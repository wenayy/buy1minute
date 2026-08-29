import { env } from "cloudflare:workers";
import { dodoCheckoutBase, getOrCreateDynamicProduct } from "../../lib/dodo";
import { getCheckoutTotal } from "../../lib/pricing";
import { ownershipByMinute } from "../../lib/seed-data";
import { getDatabaseMinute } from "../../lib/live-db";
import { minuteIndexToSlug, minuteIndexToTime } from "../../lib/time";
import { computeVisitorHash } from "../../lib/security";

function validSingleMinuteSelection(value: unknown): value is [number] {
  if (!Array.isArray(value) || value.length !== 1) return false;
  const index = value[0];
  return Number.isInteger(index) && index >= 0 && index < 1_440;
}

type CheckoutPlan = {
  minuteIndices: number[];
  totalCents: number;
  isOutbid: boolean;
};

async function planCheckout(
  body: { minuteIndices?: unknown; minuteIndex?: unknown; bidCents?: unknown },
  database: D1Database | undefined
): Promise<CheckoutPlan | Response> {
  // 1. Outbid flow: higher bid on an already owned minute
  if (body.minuteIndex !== undefined || body.bidCents !== undefined) {
    const { minuteIndex, bidCents } = body;
    if (!Number.isInteger(minuteIndex) || (minuteIndex as number) < 0 || (minuteIndex as number) >= 1_440) {
      return Response.json({ error: "Invalid minute selected." }, { status: 400 });
    }
    const live = await getDatabaseMinute(database, minuteIndex as number);
    const currentBidCents = live?.bidCents ?? ownershipByMinute.get(minuteIndex as number)?.purchasePriceCents;
    if (currentBidCents === undefined) {
      return Response.json({ error: "This minute is not currently owned. You can claim it directly." }, { status: 409 });
    }
    if (!Number.isInteger(bidCents) || (bidCents as number) <= currentBidCents) {
      return Response.json({ error: "Your bid must be at least $1 higher than the current price." }, { status: 400 });
    }
    if ((bidCents as number) > 100_000_000) {
      return Response.json({ error: "Bid exceeds maximum allowed transaction limit." }, { status: 400 });
    }
    return { minuteIndices: [minuteIndex as number], totalCents: bidCents as number, isOutbid: true };
  }

  // 2. Standard claim flow
  if (!validSingleMinuteSelection(body.minuteIndices)) {
    return Response.json({ error: "Select exactly one available minute." }, { status: 400 });
  }
  const minuteIndices = body.minuteIndices;
  if (minuteIndices.some((index) => ownershipByMinute.has(index))) {
    return Response.json({ error: "This minute is already claimed. Place an outbid instead." }, { status: 409 });
  }
  const total = getCheckoutTotal(minuteIndices);
  if (total === null) {
    return Response.json({ error: "Auction minutes cannot be purchased directly via instant checkout." }, { status: 400 });
  }
  return { minuteIndices, totalCents: total, isOutbid: false };
}

export async function POST(request: Request) {
  let body: { minuteIndices?: unknown; minuteIndex?: unknown; bidCents?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON request payload." }, { status: 400 });
  }

  const database = env.DB;
  const clientIp = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for");
  const clientHash = await computeVisitorHash(clientIp);

  // Security: Anti-Hoarding Rate Limit
  // Ensure a single client cannot hoard more than 2 active unpaid reservations simultaneously.
  if (database) {
    const nowIso = new Date().toISOString();
    // 1. Purge expired reservations eagerly
    await database.batch([
      database.prepare("UPDATE reservation_minutes SET active = 0 WHERE active = 1 AND reservation_id IN (SELECT id FROM reservations WHERE status = 'active' AND expires_at <= ?)").bind(nowIso),
      database.prepare("UPDATE reservations SET status = 'expired' WHERE status = 'active' AND expires_at <= ?").bind(nowIso),
    ]).catch(() => undefined);

    // 2. Check active reservations for this visitor
    const activeUserReservations = await database
      .prepare("SELECT COUNT(*) as count FROM reservations WHERE client_hash = ? AND status = 'active' AND expires_at > ?")
      .bind(clientHash, nowIso)
      .first<{ count: number }>()
      .catch(() => null);

    if (activeUserReservations && activeUserReservations.count >= 3) {
      return Response.json(
        { error: "You currently have active pending reservations. Please complete or wait for them to expire before reserving another slot." },
        { status: 429 }
      );
    }
  }

  const plan = await planCheckout(body, database);
  if (plan instanceof Response) return plan;
  const { minuteIndices, totalCents } = plan;

  const origin = new URL(request.url).origin;
  const slug = minuteIndexToSlug(minuteIndices[0]);

  // Demo mode: If Dodo Payments API key is not configured, redirect to demo setup
  const apiKey = env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    return Response.json({
      demoUrl: `${origin}/setup/${slug}?checkout=demo`,
      message: "Demo checkout mode: Set DODO_PAYMENTS_API_KEY to activate live payments.",
    });
  }

  if (!database) {
    return Response.json({ error: "Reservation storage is currently unavailable." }, { status: 503 });
  }

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
      { error: error instanceof Error ? error.message : "Dynamic payment configuration failed." },
      { status: 502 }
    );
  }

  // Pre-check for standard (non-outbid) claims
  if (!plan.isOutbid) {
    const placeholders = minuteIndices.map(() => "?").join(",");
    const owned = await database
      .prepare(`SELECT minute_index FROM ownership_minutes WHERE active = 1 AND minute_index IN (${placeholders})`)
      .bind(...minuteIndices)
      .first<{ minute_index: number }>();
    if (owned) {
      return Response.json({ error: "This minute was just claimed by someone else." }, { status: 409 });
    }
  }

  const reservationId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60_000); // 10-minute hold

  try {
    await database.batch([
      database.prepare("INSERT INTO reservations (id, user_id, client_hash, status, expires_at, expected_amount_cents, is_outbid, created_at) VALUES (?, ?, ?, 'active', ?, ?, ?, ?)")
        .bind(
          reservationId,
          request.headers.get("oai-authenticated-user-id"),
          clientHash,
          expiresAt.toISOString(),
          totalCents,
          plan.isOutbid ? 1 : 0,
          now.toISOString()
        ),
      ...minuteIndices.map((index) =>
        database.prepare("INSERT INTO reservation_minutes (reservation_id, minute_index, active) VALUES (?, ?, 1)").bind(reservationId, index)
      ),
    ]);
  } catch {
    return Response.json({ error: "This minute is currently reserved by another buyer. Please try again shortly." }, { status: 409 });
  }

  // Create Dodo Payments Checkout Session
  const base = dodoCheckoutBase(environment);
  const label = `Buy1Minute ${minuteIndexToTime(minuteIndices[0])} UTC`;

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
    // Revert reservation on failure
    await database.batch([
      database.prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ?").bind(reservationId),
      database.prepare("UPDATE reservation_minutes SET active = 0 WHERE reservation_id = ?").bind(reservationId),
    ]).catch(() => undefined);
    return Response.json({ error: checkout.error ?? checkout.message ?? "Checkout initialization failed." }, { status: 502 });
  }

  await database.prepare("UPDATE reservations SET stripe_session_id = ? WHERE id = ?").bind(checkout.session_id ?? null, reservationId).run();
  return Response.json({ url: checkout.checkout_url });
}
