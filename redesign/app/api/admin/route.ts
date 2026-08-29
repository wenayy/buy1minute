import { env } from "cloudflare:workers";
import { sanitizeText } from "../../lib/security";

function verifyAdminAccess(request: Request): boolean {
  const adminSecret = (env as Record<string, unknown>).ADMIN_SECRET_KEY as string | undefined;
  const providedAuth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const providedHeader = request.headers.get("x-admin-key");

  if (adminSecret && (providedAuth === adminSecret || providedHeader === adminSecret)) {
    return true;
  }

  // Also check workspace auth header
  const role = request.headers.get("oai-authenticated-user-role");
  if (role === "admin") return true;

  return false;
}

export async function GET(request: Request) {
  if (!verifyAdminAccess(request)) {
    return Response.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const database = env.DB;
  if (!database) {
    return Response.json({ error: "Database unavailable." }, { status: 503 });
  }

  try {
    const [ownersCount, reportsCount, recentReports, activeReservations] = await Promise.all([
      database.prepare("SELECT COUNT(*) as count FROM ownerships WHERE active = 1").first<{ count: number }>(),
      database.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'open'").first<{ count: number }>(),
      database.prepare("SELECT * FROM reports ORDER BY created_at DESC LIMIT 20").all(),
      database.prepare("SELECT COUNT(*) as count FROM reservations WHERE status = 'active'").first<{ count: number }>(),
    ]);

    return Response.json({
      stats: {
        activeOwners: ownersCount?.count ?? 0,
        openReports: reportsCount?.count ?? 0,
        activeReservations: activeReservations?.count ?? 0,
      },
      reports: recentReports.results,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Query failed." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!verifyAdminAccess(request)) {
    return Response.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    action?: string;
    productId?: string;
    reportId?: string;
    status?: string;
  } | null;

  const database = env.DB;
  if (!database) return Response.json({ error: "Database unavailable." }, { status: 503 });

  const action = sanitizeText(body?.action, 30);
  const now = new Date().toISOString();

  if (action === "disable_product" && body?.productId) {
    await database.prepare("UPDATE products SET disabled_at = ?, updated_at = ? WHERE id = ?").bind(now, now, body.productId).run();
    return Response.json({ ok: true });
  }

  if (action === "update_report" && body?.reportId && body?.status) {
    const status = ["open", "reviewing", "resolved", "dismissed"].includes(body.status) ? body.status : "resolved";
    await database.prepare("UPDATE reports SET status = ?, updated_at = ? WHERE id = ?").bind(status, now, body.reportId).run();
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Invalid admin action." }, { status: 400 });
}
