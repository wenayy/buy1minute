import { env } from "cloudflare:workers";
import type { OwnedMinute, Product } from "./types";

type Database = NonNullable<typeof env.DB>;

export async function getDatabaseMinute(database: Database | undefined, minuteIndex: number): Promise<{ bidCents: number; owner: OwnedMinute | null } | null> {
  if (!database) return null;
  const row = await database.prepare(`
    SELECT om.minute_index, o.purchased_at, o.purchase_price_cents,
      p.id, p.name, p.website_url, p.tagline, p.description, p.category, p.social_handle
    FROM ownership_minutes om
    JOIN ownerships o ON o.id = om.ownership_id AND o.active = 1
    LEFT JOIN products p ON p.id = o.product_id
    WHERE om.minute_index = ? AND om.active = 1
    LIMIT 1
  `).bind(minuteIndex).first<{
    minute_index: number; purchased_at: string; purchase_price_cents: number;
    id: string | null; name: string | null; website_url: string | null; tagline: string | null;
    description: string | null; category: string | null; social_handle: string | null;
  }>();
  if (!row) return null;
  if (!row.id || !row.name || !row.website_url || !row.tagline || !row.description) {
    return { bidCents: row.purchase_price_cents, owner: null };
  }
  const product: Product = {
    id: row.id,
    name: row.name,
    shortName: row.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    websiteUrl: row.website_url,
    tagline: row.tagline,
    description: row.description,
    category: row.category ?? "Other",
    xHandle: row.social_handle ?? undefined,
    accentColor: "#ff4e24",
    visualVariant: "signal",
  };
  return {
    bidCents: row.purchase_price_cents,
    owner: { minuteIndex, product, ownedSince: row.purchased_at, purchasePriceCents: row.purchase_price_cents, pageViews: 0, takeoverImpressions: 0, outboundClicks: 0 },
  };
}

export function databaseBinding(): Database | undefined {
  return env.DB;
}
