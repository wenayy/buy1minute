"use client";

import { useMemo, useState } from "react";
import { BrandIcon } from "./BrandIcon";
import { displayHost } from "../lib/favicon";
import { formatPrice } from "../lib/pricing";
import { minuteIndexToSlug, minuteIndexToTime, timeAgo } from "../lib/time";
import type { OwnedMinute } from "../lib/types";
import { CATEGORY_OPTIONS } from "../lib/categories";

type SortKey = "bid" | "newest";

const TABS: { key: SortKey; label: string }[] = [
  { key: "bid", label: "HIGHEST BID" },
  { key: "newest", label: "NEWEST" },
];

const comparators: Record<SortKey, (a: OwnedMinute, b: OwnedMinute) => number> = {
  bid: (a, b) => b.purchasePriceCents - a.purchasePriceCents,
  newest: (a, b) => new Date(b.ownedSince).getTime() - new Date(a.ownedSince).getTime(),
};

const CATEGORY_ICON: Record<string, string> = {
  "Dev tools": "◈",
  Payments: "▤",
  Productivity: "⚡",
  Design: "✎",
  Infrastructure: "☁",
  Video: "▶",
  AI: "✦",
};

export function LeaderboardTable({ owners }: { owners: OwnedMinute[] }) {
  const [sort, setSort] = useState<SortKey>("bid");
  const [category, setCategory] = useState("ALL");
  const categories = CATEGORY_OPTIONS;
  const ranked = useMemo(
    () => owners.filter((owner) => category === "ALL" || owner.product.category === category).sort(comparators[sort]),
    [owners, sort, category],
  );

  return (
    <>
      <div className="leaderboard-tabs" role="tablist" aria-label="Sort leaderboard">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={sort === tab.key}
            className={sort === tab.key ? "active" : ""}
            onClick={() => setSort(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <label className="leaderboard-category-filter">
        <span>CATEGORY</span>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
          <option value="ALL">ALL CATEGORIES</option>
          {categories.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}
        </select>
      </label>
      {ranked.length === 0 ? <div className="leaderboard-empty"><strong>No minutes listed yet.</strong><span>Be the first to claim a minute and appear here.</span></div> : <ol className="lb-list">
        {ranked.map((owner, index) => {
          const product = owner.product;
          const host = displayHost(product.websiteUrl);
          const slug = minuteIndexToSlug(owner.minuteIndex);
          const claimCents = owner.purchasePriceCents + 100;
          return (
            <li
              key={owner.minuteIndex}
              className={`lb-card ${index === 0 ? "lb-card-top" : ""}`}
            >
              <a className="lb-claim-pill" href={`/buy/${slug}?outbid=${owner.purchasePriceCents}`}>
                claim this rank for {formatPrice(claimCents)}
              </a>
              <span className="lb-rank">#{index + 1}</span>
              <BrandIcon websiteUrl={product.websiteUrl} fallback={product.shortName} size={128} className="lb-logo" imgClassName="lb-logo-img" />
              <div className="lb-main">
                <a className="lb-headline" href={product.websiteUrl} target="_blank" rel="noopener noreferrer sponsored">
                  <strong>{product.name}</strong> <span className="lb-sep">·</span> {product.tagline}
                </a>
                <p className="lb-desc">{product.description}</p>
                <div className="lb-meta">
                  {product.category && <span className="lb-cat">{CATEGORY_ICON[product.category] ?? "◆"} {product.category}</span>}
                  <span>{timeAgo(owner.ownedSince)}</span>
                  <a href={product.websiteUrl} target="_blank" rel="noopener noreferrer sponsored" className="lb-domain">{host}</a>
                  <a href={`/minute/${slug}`} className="lb-details">see details</a>
                </div>
              </div>
              <div className="lb-right">
                <div className="lb-price">{formatPrice(owner.purchasePriceCents)}</div>
                <div className="lb-price-label">{minuteIndexToTime(owner.minuteIndex)} UTC</div>
              </div>
              <div className="rank-clicks">
                <strong>{owner.outboundClicks.toLocaleString("en-US")}</strong>
                <small>CLICKS</small>
              </div>
            </li>
          );
        })}
      </ol>}
    </>
  );
}
