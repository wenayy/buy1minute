import { env } from "cloudflare:workers";
import { CATEGORY_OPTIONS } from "../../lib/categories";
import { sanitizeText, validateAndNormalizeUrl, validateSocialHandle } from "../../lib/security";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const reservationId = sanitizeText(body?.reservationId, 80);
  const name = sanitizeText(body?.name, 60);
  const rawUrl = body?.websiteUrl;
  const tagline = sanitizeText(body?.tagline, 100);
  const description = sanitizeText(body?.description, 240);
  const category = sanitizeText(body?.category, 40);
  const rawAccent = sanitizeText(body?.accentColor, 10);
  const socialHandle = validateSocialHandle(body?.xHandle);

  if (!reservationId || !name || !rawUrl || !tagline || !description || !category) {
    return Response.json({ error: "Please fill in all required fields." }, { status: 400 });
  }

  if (!(CATEGORY_OPTIONS as readonly string[]).includes(category)) {
    return Response.json({ error: "Please select a valid category." }, { status: 400 });
  }

  // Strict URL validation: protocol must be http or https, disallow javascript:/data:
  const urlCheck = validateAndNormalizeUrl(rawUrl);
  if (!urlCheck.valid || !urlCheck.url) {
    return Response.json({ error: urlCheck.error ?? "Please enter a valid website URL." }, { status: 400 });
  }
  const websiteUrl = urlCheck.url;

  // Validate accent color format (hex #RRGGBB)
  const accentColor = /^#[0-9a-f]{6}$/i.test(rawAccent) ? rawAccent : "#ff4e24";

  const database = env.DB;
  if (!database) {
    return Response.json({ error: "Database storage is currently unavailable." }, { status: 503 });
  }

  await database.prepare("ALTER TABLE products ADD COLUMN category TEXT").run().catch(() => undefined);
  await database.prepare("ALTER TABLE ownerships ADD COLUMN reservation_id TEXT").run().catch(() => undefined);

  const requestUserId = request.headers.get("oai-authenticated-user-id");
  const reservation = await database
    .prepare("SELECT user_id, status FROM reservations WHERE id = ?")
    .bind(reservationId)
    .first<{ user_id: string | null; status: string }>();

  if (!reservation || reservation.status !== "converted") {
    return Response.json(
      { error: "Payment verification in progress. Please wait a few seconds and try publishing again." },
      { status: 409 }
    );
  }

  if (requestUserId && reservation.user_id && requestUserId !== reservation.user_id) {
    return Response.json({ error: "This reservation is associated with another account." }, { status: 403 });
  }

  const ownership = await database
    .prepare(`
      SELECT om.minute_index, o.id AS ownership_id, o.product_id
      FROM ownership_minutes om
      JOIN ownerships o ON o.id = om.ownership_id
      WHERE o.reservation_id = ? AND o.active = 1 AND om.active = 1
      LIMIT 1
    `)
    .bind(reservationId)
    .first<{ minute_index: number; ownership_id: string; product_id: string | null }>();

  if (!ownership) {
    return Response.json({ error: "Active ownership record for this reservation was not found." }, { status: 404 });
  }

  // Idempotent: If already published, return success
  if (ownership.product_id) {
    return Response.json({ ok: true, minuteIndex: ownership.minute_index });
  }

  const userId = reservation.user_id || requestUserId || `buyer-${reservationId}`;
  const email = request.headers.get("oai-authenticated-user-email") || `${userId}@buy1minute.local`;
  const now = new Date().toISOString();
  const baseSlug = slugify(name) || "brand";
  const slug = `${baseSlug}-${reservationId.slice(0, 8)}`;
  const productId = crypto.randomUUID();

  await database.batch([
    database.prepare("INSERT OR IGNORE INTO users (id, email, display_name, role, created_at) VALUES (?, ?, ?, 'owner', ?)").bind(userId, email, name, now),
    database.prepare("INSERT INTO products (id, user_id, name, slug, website_url, tagline, description, category, accent_color, social_handle, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(productId, userId, name, slug, websiteUrl, tagline, description, category, accentColor, socialHandle, now, now),
    database.prepare("UPDATE ownerships SET product_id = ? WHERE id = ?").bind(productId, ownership.ownership_id),
  ]);

  return Response.json({ ok: true, minuteIndex: ownership.minute_index });
}
