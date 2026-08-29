import { env } from "cloudflare:workers";
import { validateAndNormalizeUrl } from "../../lib/security";

export async function GET() {
  const database = env.DB;
  if (!database) return Response.json({ owners: [] });

  try {
    const rows = await database
      .prepare(`
        SELECT om.minute_index, o.purchased_at, o.purchase_price_cents,
          p.id, p.name, p.website_url, p.tagline, p.description, p.category, p.accent_color, p.social_handle,
          COALESCE((SELECT COUNT(*) FROM analytics_events ae WHERE ae.minute_index = om.minute_index AND ae.event_type = 'outbound_click'), 0) AS outbound_clicks
        FROM ownership_minutes om
        JOIN ownerships o ON o.id = om.ownership_id AND o.active = 1
        JOIN products p ON p.id = o.product_id
        WHERE om.active = 1 AND p.disabled_at IS NULL
        ORDER BY om.minute_index
      `)
      .all<{
        minute_index: number;
        purchased_at: string;
        purchase_price_cents: number;
        id: string;
        name: string;
        website_url: string;
        tagline: string;
        description: string;
        category: string | null;
        accent_color: string | null;
        social_handle: string | null;
        outbound_clicks: number;
      }>();

    const owners = rows.results.map((row) => {
      const validatedUrl = validateAndNormalizeUrl(row.website_url).url ?? row.website_url;
      return {
        minuteIndex: row.minute_index,
        product: {
          id: row.id,
          name: row.name,
          shortName: row.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
          websiteUrl: validatedUrl,
          tagline: row.tagline,
          description: row.description,
          category: row.category ?? "Other",
          accentColor: row.accent_color ?? "#ff4e24",
          visualVariant: "signal" as const,
          xHandle: row.social_handle ?? undefined,
        },
        ownedSince: row.purchased_at,
        purchasePriceCents: row.purchase_price_cents,
        pageViews: 0,
        takeoverImpressions: 0,
        outboundClicks: Number(row.outbound_clicks ?? 0),
      };
    });

    return Response.json(
      { owners },
      {
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
        },
      }
    );
  } catch {
    return Response.json({ owners: [] });
  }
}
