import { env } from "cloudflare:workers";

// Temporary owner-only reset endpoint. Remove this route immediately after
// clearing the test data; it is never part of the public application surface.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || !env.DODO_PAYMENTS_WEBHOOK_SECRET || token !== env.DODO_PAYMENTS_WEBHOOK_SECRET) {
    return new Response("Not found", { status: 404 });
  }
  const database = env.DB;
  if (!database) return Response.json({ error: "Database unavailable" }, { status: 503 });
  await database.batch([
    database.prepare("DELETE FROM analytics_events"),
    database.prepare("DELETE FROM payments"),
    database.prepare("DELETE FROM reservation_minutes"),
    database.prepare("DELETE FROM reservations"),
    database.prepare("DELETE FROM ownership_minutes"),
    database.prepare("DELETE FROM ownerships"),
    database.prepare("DELETE FROM products"),
    database.prepare("DELETE FROM users"),
  ]);
  return Response.json({ ok: true, owners: 0 });
}
