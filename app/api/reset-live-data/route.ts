import { env } from "cloudflare:workers";

// Temporary owner-only reset endpoint. This route is removed immediately
// after the requested test reset completes.
const RESET_KEY = "b1m-reset-7f3c9a2e";

export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get("key") !== RESET_KEY) return new Response("Not found", { status: 404 });
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
