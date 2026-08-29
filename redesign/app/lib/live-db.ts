import { env } from "cloudflare:workers";
import type { OwnedMinute, Product } from "./types";
import { validateAndNormalizeUrl } from "./security";

type Database = NonNullable<typeof env.DB>;

export async function getDatabaseMinute(
  database: Database | undefined,
  minuteIndex: number
): Promise<{ bidCents: number; owner: OwnedMinute | null } | null> {
  if (!database) return null;
  try {
    const row = await database
      .prepare(`
        SELECT om.minute_index, o.purchased_at, o.purchase_price_cents,
          p.id, p.name, p.website_url, p.tagline, p.description, p.category, p.accent_color, p.social_handle,
          COALESCE((SELECT COUNT(*) FROM analytics_events ae WHERE ae.minute_index = om.minute_index AND ae.event_type = 'outbound_click'), 0) AS outbound_clicks
        FROM ownership_minutes om
        JOIN ownerships o ON o.id = om.ownership_id AND o.active = 1
        LEFT JOIN products p ON p.id = o.product_id AND p.disabled_at IS NULL
        WHERE om.minute_index = ? AND om.active = 1
        LIMIT 1
      `)
      .bind(minuteIndex)
      .first<{
        minute_index: number;
        purchased_at: string;
        purchase_price_cents: number;
        id: string | null;
        name: string | null;
        website_url: string | null;
        tagline: string | null;
        description: string | null;
        category: string | null;
        accent_color: string | null;
        social_handle: string | null;
        outbound_clicks: number;
      }>();

    if (!row) return null;
    if (!row.id || !row.name || !row.website_url || !row.tagline || !row.description) {
      return { bidCents: row.purchase_price_cents, owner: null };
    }

    const validatedUrl = validateAndNormalizeUrl(row.website_url).url ?? row.website_url;

    const product: Product = {
      id: row.id,
      name: row.name,
      shortName: row.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
      websiteUrl: validatedUrl,
      tagline: row.tagline,
      description: row.description,
      category: row.category ?? "Other",
      accentColor: row.accent_color ?? "#ff4e24",
      visualVariant: "signal",
      xHandle: row.social_handle ?? undefined,
    };

    return {
      bidCents: row.purchase_price_cents,
      owner: {
        minuteIndex,
        product,
        ownedSince: row.purchased_at,
        purchasePriceCents: row.purchase_price_cents,
        pageViews: 0,
        takeoverImpressions: 0,
        outboundClicks: Number(row.outbound_clicks ?? 0),
      },
    };
  } catch {
    return null;
  }
}

export function databaseBinding(): Database | undefined {
  return env.DB;
}
