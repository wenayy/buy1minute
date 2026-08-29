import { env } from "cloudflare:workers";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// Standard Webhooks signature verification:
// signature = base64(HMAC_SHA256(`${id}.${timestamp}.${payload}`, secret))
async function verifySignature(payload: string, headers: Headers, secret: string): Promise<boolean> {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  // 5-minute replay tolerance
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      base64ToBytes(secret.replace(/^whsec_/, "")),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${payload}`));
    const expected = bytesToBase64(new Uint8Array(digest));
    const provided = signatureHeader.split(" ").map((part) => part.split(",")[1] ?? part);
    return provided.some((signature) => timingSafeEqual(signature, expected));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const payload = await request.text();
  const secret = env.DODO_PAYMENTS_WEBHOOK_SECRET;
  if (!secret || !(await verifySignature(payload, request.headers, secret))) {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  let event: {
    type?: string;
    data?: {
      payment_id?: string;
      total_amount?: number;
      status?: string;
      metadata?: { minute_indices?: string; reservation_id?: string; expected_amount_cents?: string };
    };
  };

  try {
    event = JSON.parse(payload);
  } catch {
    return new Response("Invalid JSON payload", { status: 400 });
  }

  // Handle successful one-time payment
  if (event.type === "payment.succeeded" && event.data?.status === "succeeded") {
    const database = env.DB;
    const reservationId = event.data.metadata?.reservation_id;
    if (database && reservationId) {
      // Ensure compatible schema
      await database.prepare("ALTER TABLE ownerships ADD COLUMN reservation_id TEXT").run().catch(() => undefined);

      const reservation = await database
        .prepare("SELECT user_id, status, expected_amount_cents, is_outbid FROM reservations WHERE id = ?")
        .bind(reservationId)
        .first<{ user_id: string | null; status: string; expected_amount_cents: number; is_outbid: number }>();

      if (!reservation) return new Response("Unknown reservation ID", { status: 400 });
      if (reservation.status === "converted") return Response.json({ received: true });
      if (reservation.status !== "active") return new Response("Reservation is no longer active", { status: 409 });

      const metadataAmount = Number(event.data.metadata?.expected_amount_cents);
      if (!Number.isInteger(metadataAmount) || metadataAmount !== reservation.expected_amount_cents) {
        return new Response("Payment amount does not match reserved price", { status: 400 });
      }

      const reservedMinutes = await database
        .prepare("SELECT minute_index FROM reservation_minutes WHERE reservation_id = ? AND active = 1 ORDER BY minute_index")
        .bind(reservationId)
        .all<{ minute_index: number }>();

      const indices = reservedMinutes.results.map(({ minute_index }) => minute_index);
      if (indices.length !== 1) return new Response("Reservation must target exactly one minute", { status: 400 });

      const targetMinute = indices[0];
      const providerPaymentId = event.data.payment_id ?? `pay_${crypto.randomUUID()}`;

      // Webhook Idempotency Guard
      const existingPayment = await database
        .prepare("SELECT id FROM payments WHERE stripe_session_id = ?")
        .bind(providerPaymentId)
        .first<{ id: string }>();
      if (existingPayment) return Response.json({ received: true });

      const amount = reservation.expected_amount_cents;
      const now = new Date().toISOString();

      // CRITICAL OUTBID RACE CONDITION CHECK:
      // If this is an outbid payment, verify the current active ownership for this minute
      // has NOT already been upgraded to an even higher amount while this payment was in flight.
      if (reservation.is_outbid) {
        const currentActive = await database
          .prepare(`
            SELECT o.purchase_price_cents
            FROM ownership_minutes om
            JOIN ownerships o ON o.id = om.ownership_id AND o.active = 1
            WHERE om.minute_index = ? AND om.active = 1
            LIMIT 1
          `)
          .bind(targetMinute)
          .first<{ purchase_price_cents: number }>();

        if (currentActive && currentActive.purchase_price_cents >= amount) {
          // A higher bid already took ownership before this payment finished.
          // Record payment and mark reservation as outbid_refunded.
          await database.batch([
            database.prepare("INSERT INTO payments (id, user_id, reservation_id, stripe_session_id, amount_cents, status, created_at) VALUES (?, ?, ?, ?, ?, 'outbid_superseded', ?)")
              .bind(crypto.randomUUID(), reservation.user_id, reservationId, providerPaymentId, amount, now),
            database.prepare("UPDATE reservations SET status = 'outbid_refunded' WHERE id = ?").bind(reservationId),
            database.prepare("UPDATE reservation_minutes SET active = 0 WHERE reservation_id = ?").bind(reservationId),
          ]);
          return Response.json({ received: true, note: "Superseded by higher concurrent bid." });
        }
      }

      const ownershipId = crypto.randomUUID();
      const statements = [
        database.prepare("INSERT OR IGNORE INTO payments (id, user_id, reservation_id, stripe_session_id, amount_cents, status, created_at) VALUES (?, ?, ?, ?, ?, 'paid', ?)")
          .bind(crypto.randomUUID(), reservation.user_id, reservationId, providerPaymentId, amount, now),
      ];

      // Deactivate any previous active ownership for this minute
      statements.push(
        database.prepare("UPDATE ownerships SET active = 0 WHERE id IN (SELECT ownership_id FROM ownership_minutes WHERE active = 1 AND minute_index = ?)").bind(targetMinute),
        database.prepare("UPDATE ownership_minutes SET active = 0 WHERE active = 1 AND minute_index = ?").bind(targetMinute)
      );

      // Create new active ownership
      statements.push(
        database.prepare("INSERT INTO ownerships (id, user_id, reservation_id, product_id, purchased_at, purchase_price_cents, active) VALUES (?, ?, ?, NULL, ?, ?, 1)")
          .bind(ownershipId, reservation.user_id ?? "pending-setup", reservationId, now, amount),
        database.prepare("INSERT INTO ownership_minutes (ownership_id, minute_index, active) VALUES (?, ?, 1)")
          .bind(ownershipId, targetMinute),
        database.prepare("UPDATE reservations SET status = 'converted' WHERE id = ?").bind(reservationId),
        database.prepare("UPDATE reservation_minutes SET active = 0 WHERE reservation_id = ?").bind(reservationId)
      );

      await database.batch(statements);
    }
  }

  return Response.json({ received: true });
}
