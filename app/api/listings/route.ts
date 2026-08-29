import { env } from "cloudflare:workers";

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0,  forty);
}

const forty = 40;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const reservationId = clean(body?.reservationId, 80);
  const name = clean(body?.name, 60);
  const websiteUrl = clean(body?.websiteUrl, 300);
  const tagline = clean(body?.tagline, 100);
  const description = clean(body?.description, 220);
  const socialHandle = clean(body?.xHandle, 80) || null;
  if (!reservationId || !name || !websiteUrl || !tagline || !description) return Response.json({ error: "Complete every required field" }, { status: 400 });
  try { new URL(websiteUrl); } catch { return Response.json({ error: "Enter a valid website URL" }, { status: 400 }); }

  const database = env.DB;
  if (!database) return Response.json({ error: "Listing storage is unavailable" }, { status: 503 });
  await database.prepare("ALTER TABLE ownerships ADD COLUMN reservation_id TEXT").run().catch(() => undefined);
  const requestUserId = request.headers.get("oai-authenticated-user-id");
  const reservation = await database.prepare("SELECT user_id, status FROM reservations WHERE id = ?").bind(reservationId).first<{ user_id: string | null; status: string }>();
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
    database.prepare("INSERT INTO products (id, user_id, name, slug, website_url, tagline, description, accent_color, social_handle, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, '#ff4e24', ?, ?, ?)").bind(productId, userId, name, slug, websiteUrl, tagline, description, socialHandle, now, now),
    database.prepare("UPDATE ownerships SET product_id = ? WHERE id = ?").bind(productId, ownership.ownership_id),
  ]);
  return Response.json({ ok: true, minuteIndex: ownership.minute_index });
}
