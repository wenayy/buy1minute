import { env } from "cloudflare:workers";
import { computeVisitorHash, sanitizeText } from "../../lib/security";

const allowedEvents = new Set([
  "minute_page_view",
  "homepage_takeover_impression",
  "outbound_click",
  "purchase",
  "share_clicked",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      eventType?: string;
      minuteIndex?: number;
      path?: string;
    } | null;

    if (!body || !body.eventType || !allowedEvents.has(body.eventType)) {
      return new Response(null, { status: 400 });
    }

    if (
      !Number.isInteger(body.minuteIndex) ||
      (body.minuteIndex ?? -1) < 0 ||
      (body.minuteIndex ?? 1_440) > 1_439
    ) {
      return new Response(null, { status: 400 });
    }

    const database = env.DB;
    if (database) {
      const clientIp = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for");
      const visitorHash = await computeVisitorHash(clientIp);
      const cleanPath = sanitizeText(body.path ?? "", 180);
      const nowIso = new Date().toISOString();

      // Deduplication throttle: prevent spamming duplicate impressions within a 1-minute window
      if (body.eventType === "homepage_takeover_impression" || body.eventType === "minute_page_view") {
        const fiveMinutesAgo = new Date(Date.now() - 60_000).toISOString();
        const existing = await database
          .prepare(`
            SELECT id FROM analytics_events
            WHERE event_type = ? AND minute_index = ? AND visitor_hash = ? AND occurred_at >= ?
            LIMIT 1
          `)
          .bind(body.eventType, body.minuteIndex, visitorHash, fiveMinutesAgo)
          .first<{ id: string }>();

        if (existing) {
          return new Response(null, { status: 204 });
        }
      }

      await database
        .prepare(`
          INSERT INTO analytics_events (id, event_type, minute_index, visitor_hash, path, occurred_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        .bind(
          crypto.randomUUID(),
          body.eventType,
          body.minuteIndex,
          visitorHash,
          cleanPath,
          nowIso
        )
        .run();
    }
  } catch {
    // Analytics must never throw or interrupt visitor experience
  }
  return new Response(null, { status: 204 });
}
