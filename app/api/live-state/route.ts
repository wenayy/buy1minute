import { env } from "cloudflare:workers";

export async function GET() {
  const database = env.DB;
  if (!database) return Response.json({ owners: [] });
  try {
    const rows = await database.prepare(`
      SELECT om.minute_index, o.purchased_at, o.purchase_price_cents,
        p.id, p.name, p.website_url, p.tagline, p.description, p.category, p.social_handle,
        COALESCE((SELECT COUNT(*) FROM analytics_events ae WHERE ae.minute_index = om.minute_index AND ae.event_type = 'outbound_click'), 0) AS outbound_clicks
      FROM ownership_minutes om
      JOIN ownerships o ON o.id = om.ownership_id AND o.active = 1
      JOIN products p ON p.id = o.product_id
      WHERE om.active = 1 AND p.disabled_at IS NULL
      ORDER BY om.minute_index
    `).all<{
      minute_index: number; purchased_at: string; purchase_price_cents: number;
      id: string; name: string; website_url: string; tagline: string; description: string;
      category: string | null; social_handle: string | null; outbound_clicks: number;
    }>();
    const owners = rows.results.map((row) => ({
      minuteIndex: row.minute_index,
      product: {
        id: row.id,
        name: row.name,
        shortName: row.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
        websiteUrl: row.website_url,
        tagline: row.tagline,
        description: row.description,
        category: row.category ?? "Other",
        xHandle: row.social_handle ?? undefined,
        accentColor: "#ff4e24",
        visualVariant: "signal" as const,
      },
      ownedSince: row.purchased_at,
      purchasePriceCents: row.purchase_price_cents,
      pageViews: 0,
      takeoverImpressions: 0,
      outboundClicks: Number(row.outbound_clicks ?? 0),
    }));
    return Response.json({ owners });
  } catch {
    return Response.json({ owners: [] });
  }
}
