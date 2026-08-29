import { env } from "cloudflare:workers";
import { computeVisitorHash, sanitizeText, validateEmail } from "../../lib/security";

const VALID_REASONS = new Set([
  "Phishing or malware",
  "Hate or harassment",
  "Explicit content",
  "Impersonation",
  "Other policy violation",
]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    minuteIndex?: unknown;
    reason?: unknown;
    details?: unknown;
    reporterEmail?: unknown;
  } | null;

  const minuteIndex = Number(body?.minuteIndex);
  const reason = sanitizeText(body?.reason, 60);
  const details = sanitizeText(body?.details, 1000);
  const reporterEmail = sanitizeText(body?.reporterEmail, 200);

  if (!Number.isInteger(minuteIndex) || minuteIndex < 0 || minuteIndex >= 1_440) {
    return Response.json({ error: "Please specify a valid minute index (0 to 1439)." }, { status: 400 });
  }

  if (!reason || !VALID_REASONS.has(reason)) {
    return Response.json({ error: "Please select a valid report reason." }, { status: 400 });
  }

  if (!details || details.length < 10) {
    return Response.json({ error: "Please provide a brief description (at least 10 characters)." }, { status: 400 });
  }

  if (!validateEmail(reporterEmail)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const database = env.DB;
  if (!database) {
    return Response.json({ error: "Report service is currently offline." }, { status: 503 });
  }

  const clientIp = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for");
  const visitorHash = await computeVisitorHash(clientIp);
  const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();

  // Rate limit: max 5 reports per visitor per hour
  const recentReports = await database
    .prepare("SELECT COUNT(*) as count FROM reports WHERE reporter_email = ? AND created_at >= ?")
    .bind(reporterEmail, oneHourAgo)
    .first<{ count: number }>()
    .catch(() => null);

  if (recentReports && recentReports.count >= 5) {
    return Response.json({ error: "Too many recent reports. Please try again later." }, { status: 429 });
  }

  const reportId = crypto.randomUUID();
  const now = new Date().toISOString();

  await database
    .prepare(`
      INSERT INTO reports (id, minute_index, reason, details, reporter_email, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'open', ?)
    `)
    .bind(reportId, minuteIndex, reason, details, reporterEmail, now)
    .run();

  return Response.json({ ok: true, reportId });
}
