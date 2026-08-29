import { env } from "cloudflare:workers";
import { CATEGORY_OPTIONS } from "../../lib/categories";
import { getCheckoutTotal } from "../../lib/pricing";

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

// Local/test convenience: the Dodo webhook can't reach localhost, so payments
// never get marked "converted" there. In test mode we confirm the reservation
// ourselves (create ownership from the reserved minutes) so publishing works
// end-to-end locally. In live mode the webhook remains the source of truth.
async function confirmReservationForTest(database: D1Database, reservationId: string): Promise<void> {
  const reserved = await database
    .prepare("SELECT minute_index FROM reservation_minutes WHERE reservation_id = ? AND active = 1")
    .bind(reservationId)
    .all<{ minute_index: number }>();
  const indices = reserved.results.map((row) => row.minute_index);
  if (indices.length === 0) return;
  const reservation = await database.prepare("SELECT user_id FROM reservations WHERE id = ?").bind(reservationId).first<{ user_id: string | null }>();
  const userId = reservation?.user_id || `buyer-${reservationId}`;
  const email = `${userId}@buy1minute.local`;
  const ownershipId = crypto.randomUUID();
  const now = new Date().toISOString();
  const total = getCheckoutTotal(indices) ?? indices.length * 100;
  await database.batch([
    database.prepare("INSERT OR IGNORE INTO users (id, email, display_name, role, created_at) VALUES (?, ?, ?, 'owner', ?)").bind(userId, email, "Buyer", now),
    database.prepare("INSERT OR IGNORE INTO ownerships (id, user_id, product_id, purchased_at, purchase_price_cents, active, reservation_id) VALUES (?, ?, NULL, ?, ?, 1, ?)").bind(ownershipId, userId, now, total, reservationId),
    ...indices.map((index) => database.prepare("INSERT OR IGNORE INTO ownership_minutes (ownership_id, minute_index, active) VALUES (?, ?, 1)").bind(ownershipId, index)),
    database.prepare("UPDATE reservations SET status = 'converted' WHERE id = ?").bind(reservationId),
    database.prepare("UPDATE reservation_minutes SET active = 0 WHERE reservation_id = ?").bind(reservationId),
  ]);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const reservationId = clean(body?.reservationId, 80);
  const name = clean(body?.name, 60);
  const websiteUrl = clean(body?.websiteUrl, 300);
  const tagline = clean(body?.tagline, 100);
  const description = clean(body?.description, 220);
  const category = clean(body?.category, 40);
  const socialHandle = clean(body?.xHandle, 80) || null;
  if (!reservationId || !name || !websiteUrl || !tagline || !description || !category) return Response.json({ error: "Complete every required field" }, { status: 400 });
  if (!(CATEGORY_OPTIONS as readonly string[]).includes(category)) return Response.json({ error: "Choose a valid category" }, { status: 400 });
  try { new URL(websiteUrl); } catch { return Response.json({ error: "Enter a valid website URL" }, { status: 400 }); }

  const database = env.DB;
  if (!database) return Response.json({ error: "Listing storage is unavailable" }, { status: 503 });
  await database.prepare("ALTER TABLE products ADD COLUMN category TEXT").run().catch(() => undefined);
  await database.prepare("ALTER TABLE ownerships ADD COLUMN reservation_id TEXT").run().catch(() => undefined);
  const requestUserId = request.headers.get("oai-authenticated-user-id");
  let reservation = await database.prepare("SELECT user_id, status FROM reservations WHERE id = ?").bind(reservationId).first<{ user_id: string | null; status: string }>();

  // Without a reachable webhook (local/test), confirm the payment here.
  if (reservation && reservation.status !== "converted" && env.DODO_PAYMENTS_ENVIRONMENT !== "live") {
    await confirmReservationForTest(database, reservationId);
    reservation = await database.prepare("SELECT user_id, status FROM reservations WHERE id = ?").bind(reservationId).first<{ user_id: string | null; status: string }>();
  }

  if (!reservation || reservation.status !== "converted") return Response.json({ error: "Payment is still being confirmed. Wait a moment and try publishing again." }, { status: 409 });
  if (requestUserId && reservation.user_id && requestUserId !== reservation.user_id) return Response.json({ error: "This payment belongs to another account" }, { status: 403 });
  const ownership = await database.prepare("SELECT om.minute_index, o.id AS ownership_id, o.product_id FROM ownership_minutes om JOIN ownerships o ON o.id = om.ownership_id WHERE o.reservation_id = ? AND o.active = 1 AND om.active = 1 LIMIT 1").bind(reservationId).first<{ minute_index: number; ownership_id: string; product_id: string | null }>();
  if (!ownership) return Response.json({ error: "Paid minute could not be found" }, { status: 404 });
  if (ownership.product_id) return Response.json({ ok: true, minuteIndex: ownership.minute_index });

  const userId = reservation.user_id || requestUserId || `buyer-${reservationId}`;
  const email = request.headers.get("oai-authenticated-user-email") || `${userId}@buy1minute.local`;
  const now = new Date().toISOString();
  const baseSlug = slugify(name) || "listing";
  const slug = `${baseSlug}-${reservationId.slice(0, 8)}`;
  const productId = crypto.randomUUID();
  await database.batch([
    database.prepare("INSERT OR IGNORE INTO users (id, email, display_name, role, created_at) VALUES (?, ?, ?, 'owner', ?)").bind(userId, email, name, now),
    database.prepare("INSERT INTO products (id, user_id, name, slug, website_url, tagline, description, category, accent_color, social_handle, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '#ff4e24', ?, ?, ?)").bind(productId, userId, name, slug, websiteUrl, tagline, description, category, socialHandle, now, now),
    database.prepare("UPDATE ownerships SET product_id = ? WHERE id = ?").bind(productId, ownership.ownership_id),
  ]);
  return Response.json({ ok: true, minuteIndex: ownership.minute_index });
}
