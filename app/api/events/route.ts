import { env } from "cloudflare:workers";

const allowedEvents = new Set([
  "minute_page_view",
  "homepage_takeover_impression",
  "outbound_click",
  "purchase",
  "share_clicked",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { eventType?: string; minuteIndex?: number; path?: string };
    if (!body.eventType || !allowedEvents.has(body.eventType)) return new Response(null, { status: 400 });
    if (!Number.isInteger(body.minuteIndex) || (body.minuteIndex ?? -1) < 0 || (body.minuteIndex ?? 1_440) > 1_439) return new Response(null, { status: 400 });
    const database = env.DB;
    if (database) {
      const anonymousVisitor = request.headers.get("cf-connecting-ip") ?? "anonymous";
      const hashInput = new TextEncoder().encode(`${anonymousVisitor}:${new Date().toISOString().slice(0, 10)}`);
      const digest = await crypto.subtle.digest("SHA-256", hashInput);
      const visitorHash = Array.from(new Uint8Array(digest)).slice(0, 8).map((byte) => byte.toString(16).padStart(2, "0")).join("");
      await database.prepare("INSERT INTO analytics_events (id, event_type, minute_index, visitor_hash, path, occurred_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(crypto.randomUUID(), body.eventType, body.minuteIndex, visitorHash, (body.path ?? "").slice(0, 180), new Date().toISOString()).run();
    }
  } catch {
    // Analytics must never interrupt the clock experience.
  }
  return new Response(null, { status: 204 });
}

