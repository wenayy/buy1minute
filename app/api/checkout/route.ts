import { env } from "cloudflare:workers";
import { dodoCheckoutBase, getOrCreateDynamicProduct } from "../../lib/dodo";
import { getCheckoutTotal } from "../../lib/pricing";
import { ownershipByMinute } from "../../lib/seed-data";
import { getDatabaseMinute } from "../../lib/live-db";
import { minuteIndexToSlug, minuteIndexToTime } from "../../lib/time";

function validSingleMinuteSelection(value: unknown): value is [number] {
  if (!Array.isArray(value) || value.length !== 1) return false;
  if (!value.every((index) => Number.isInteger(index) && index >= 0 && index < 1_440)) return false;
  return true;
}

type CheckoutPlan = { minuteIndices: number[]; totalCents: number; isOutbid: boolean };

/** Resolve the request into a validated set of minutes and a total (in cents). */
async function planCheckout(body: { minuteIndices?: unknown; minuteIndex?: unknown; bidCents?: unknown }, database: D1Database | undefined): Promise<CheckoutPlan | Response> {
  // Outbid flow: a single custom bid that must beat the current winning bid.
  if (body.minuteIndex !== undefined || body.bidCents !== undefined) {
    const { minuteIndex, bidCents } = body;
    if (!Number.isInteger(minuteIndex) || (minuteIndex as number) < 0 || (minuteIndex as number) >= 1_440) {
      return Response.json({ error: "Invalid minute" }, { status: 400 });
    }
    const live = await getDatabaseMinute(database, minuteIndex as number);
    const currentBidCents = live?.bidCents ?? ownershipByMinute.get(minuteIndex as number)?.purchasePriceCents;
    if (currentBidCents === undefined) {
      const basePrice = 100;
      if (!Number.isInteger(bidCents) || (bidCents as number) < basePrice || (bidCents as number) % 100 !== 0) {
        return Response.json({ error: `Your price must be at least $${basePrice / 100} in whole dollars` }, { status: 400 });
      }
      return { minuteIndices: [minuteIndex as number], totalCents: bidCents as number, isOutbid: false };
    }
    const minimumBidCents = Math.max(100, currentBidCents + 100);
    if (!Number.isInteger(bidCents) || (bidCents as number) < minimumBidCents || (bidCents as number) % 100 !== 0) {
      return Response.json({ error: `Your bid must be at least $${minimumBidCents / 100} in whole dollars` }, { status: 400 });
    }
    return { minuteIndices: [minuteIndex as number], totalCents: bidCents as number, isOutbid: true };
  }

  // Standard flow: buy exactly one currently available minute.
  if (!validSingleMinuteSelection(body.minuteIndices)) return Response.json({ error: "Choose exactly one minute" }, { status: 400 });
  const minuteIndices = body.minuteIndices;
  if (minuteIndices.some((index) => ownershipByMinute.has(index))) return Response.json({ error: "One or more minutes are no longer available" }, { status: 409 });
  const total = getCheckoutTotal(minuteIndices);
  if (total === null) return Response.json({ error: "Auction minutes cannot use checkout" }, { status: 400 });
  return { minuteIndices, totalCents: total, isOutbid: false };
}

export async function POST(request: Request) {
  let body: { minuteIndices?: unknown; minuteIndex?: unknown; bidCents?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const database = env.DB;
  const plan = await planCheckout(body, database);
  if (plan instanceof Response) return plan;
  const { minuteIndices, totalCents } = plan;

  const origin = new URL(request.url).origin;
  const slug = minuteIndexToSlug(minuteIndices[0]);

  // Demo mode: no Dodo Payments key configured, so no charge is created.
  const apiKey = env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    return Response.json({
      demoUrl: `${origin}/setup/${slug}?checkout=demo`,
      message: "Demo checkout: no charge was created. Add DODO_PAYMENTS_API_KEY to enable live payments.",
    });
  }

  // Reserve the minute for 10 minutes while the buyer completes payment.
  if (!database) return Response.json({ error: "Reservation service is unavailable" }, { status: 503 });

  const environment = env.DODO_PAYMENTS_ENVIRONMENT === "live" ? "live" : "test";
  let productId: string;
  try {
    productId = await getOrCreateDynamicProduct({
      apiKey,
      database,
      environment,
      configuredProductId: env.DODO_PAYMENTS_PRODUCT_ID,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Dynamic checkout is unavailable" },
      { status: 502 },
    );
  }

  // Race guard: reject minutes that are already owned. Outbids intentionally
  // target an owned minute, so they skip this check. Concurrent reservations
  // are prevented by the unique index on reservation_minutes below.
  if (!plan.isOutbid) {
    const placeholders = minuteIndices.map(() => "?").join(",");
    const owned = await database
      .prepare(`SELECT minute_index FROM ownership_minutes WHERE active = 1 AND minute_index IN (${placeholders})`)
      .bind(...minuteIndices)
      .first<{ minute_index: number }>();
    if (owned) return Response.json({ error: "One or more minutes were just claimed by someone else" }, { status: 409 });
  }

  const reservationId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60_000);
  try {
    await database.batch([
      database.prepare("UPDATE reservation_minutes SET active = 0 WHERE active = 1 AND reservation_id IN (SELECT id FROM reservations WHERE status = 'active' AND expires_at <= ?)").bind(now.toISOString()),
      database.prepare("UPDATE reservations SET status = 'expired' WHERE status = 'active' AND expires_at <= ?").bind(now.toISOString()),
      database.prepare("INSERT INTO reservations (id, user_id, status, expires_at, expected_amount_cents, is_outbid, created_at) VALUES (?, ?, 'active', ?, ?, ?, ?)").bind(reservationId, request.headers.get("oai-authenticated-user-id"), expiresAt.toISOString(), totalCents, plan.isOutbid ? 1 : 0, now.toISOString()),
      ...minuteIndices.map((index) => database.prepare("INSERT INTO reservation_minutes (reservation_id, minute_index, active) VALUES (?, ?, 1)").bind(reservationId, index)),
    ]);
  } catch {
    return Response.json({ error: "One or more minutes were just reserved by someone else" }, { status: 409 });
  }

  // Create a Dodo Payments Checkout Session.
  // The `amount` override on the cart item requires the Dodo product to have
  // "pay what you want" pricing enabled so we can charge the exact bid/total.
  const base = dodoCheckoutBase(environment);
  const label = `Buy1Minute ${minuteIndexToTime(minuteIndices[0])}`;
  const dodoResponse = await fetch(`${base}/checkouts`, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      product_cart: [{ product_id: productId, quantity: 1, amount: totalCents }],
      return_url: `${origin}/setup/${slug}?reservation=${reservationId}`,
      billing_address: { country: "US" },
      metadata: {
        minute_indices: minuteIndices.join(","),
        reservation_id: reservationId,
        expected_amount_cents: String(totalCents),
        listing: label,
      },
    }),
  });

  const checkout = (await dodoResponse.json().catch(() => ({}))) as {
    session_id?: string;
    checkout_url?: string;
    message?: string;
    error?: string;
  };
  if (!dodoResponse.ok || !checkout.checkout_url) {
    await database.batch([
      database.prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ?").bind(reservationId),
      database.prepare("UPDATE reservation_minutes SET active = 0 WHERE reservation_id = ?").bind(reservationId),
    ]);
    return Response.json({ error: checkout.error ?? checkout.message ?? "Dodo Payments checkout failed" }, { status: 502 });
  }

  // The stripe_session_id column is reused to store the Dodo checkout session id.
  await database.prepare("UPDATE reservations SET stripe_session_id = ? WHERE id = ?").bind(checkout.session_id ?? null, reservationId).run();
  return Response.json({ url: checkout.checkout_url });
}
