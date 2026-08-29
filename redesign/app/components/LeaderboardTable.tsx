"use client";

import { useMemo, useState } from "react";
import { BrandIcon } from "./BrandIcon";
import { displayHost } from "../lib/favicon";
import { formatPrice } from "../lib/pricing";
import { minuteIndexToSlug, minuteIndexToTime } from "../lib/time";
import type { OwnedMinute } from "../lib/types";
import { CATEGORY_OPTIONS, CATEGORY_ICONS } from "../lib/categories";

type SortKey = "bid" | "clicks" | "newest";

export function LeaderboardTable({ owners }: { owners: OwnedMinute[] }) {
  const [sort, setSort] = useState<SortKey>("bid");
  const [category, setCategory] = useState("ALL");

  const ranked = useMemo(() => {
    return owners
      .filter((o) => category === "ALL" || o.product.category === category)
      .sort((a, b) => {
        if (sort === "bid") return b.purchasePriceCents - a.purchasePriceCents;
        if (sort === "clicks") return b.outboundClicks - a.outboundClicks;
        return new Date(b.ownedSince).getTime() - new Date(a.ownedSince).getTime();
      });
  }, [owners, sort, category]);

  return (
    <div className="leaderboard-table-container">
      {/* Pay-to-rank Headline info */}
      <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-white/80">TRANSPARENT PAY-TO-RANK · NO ALGORITHMS · NO CURATION</span>
        </div>
        <span className="text-[#ff4e24] font-bold">OUTBID BY +$1 TO TAKE ANY RANK</span>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-2xl bg-[#0f1014] border border-white/10">
        <div className="flex gap-2">
          {(
            [
              { key: "bid", label: "Highest Bid" },
              { key: "clicks", label: "Most Traffic" },
              { key: "newest", label: "Newest" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`filter-pill ${sort === tab.key ? "active" : ""}`}
              onClick={() => setSort(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          className="rounded-xl border border-white/10 bg-[#08080a] px-4 py-2 font-mono text-xs text-white/80 outline-none"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="ALL">ALL CATEGORIES</option>
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Rows */}
      {ranked.length === 0 ? (
        <div className="p-16 text-center border border-white/5 rounded-2xl bg-[#0f1014]">
          <h3 className="text-lg font-bold text-white">No minutes owned yet in this category</h3>
          <p className="text-xs text-white/50 mt-1">Be the first to claim a minute and rank #1.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.map((owner, idx) => {
            const product = owner.product;
            const host = displayHost(product.websiteUrl);
            const slug = minuteIndexToSlug(owner.minuteIndex);
            const outbidTarget = owner.purchasePriceCents + 100;

            return (
              <div
                key={owner.minuteIndex}
                className={`leaderboard-card-row ${
                  idx === 0 ? "rank-1 border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-[#0f1014]" : ""
                }`}
              >
                <div
                  className={`font-mono font-black text-base ${
                    idx === 0
                      ? "text-amber-400"
                      : idx === 1
                      ? "text-slate-300"
                      : idx === 2
                      ? "text-amber-600"
                      : "text-white/40"
                  }`}
                >
                  #{idx + 1}
                </div>

                <div className="flex items-center gap-4 min-w-0">
                  <BrandIcon
                    websiteUrl={product.websiteUrl}
                    fallback={product.shortName}
                    size={44}
                    className="h-11 w-11 flex-shrink-0 rounded-xl bg-white/10"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <a
                        href={product.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="font-bold text-white text-base hover:underline truncate"
                      >
                        {product.name}
                      </a>
                      <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/60">
                        {CATEGORY_ICONS[product.category || "Other"] || "●"}{" "}
                        {product.category || "Other"}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 truncate mt-0.5">{product.tagline}</p>
                    <div className="flex items-center gap-3 font-mono text-[10px] text-white/40 mt-1">
                      <span>{minuteIndexToTime(owner.minuteIndex)} UTC</span>
                      <span>·</span>
                      <a
                        href={product.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="hover:underline text-white/60"
                      >
                        {host} ↗
                      </a>
                    </div>
                  </div>
                </div>

                <div className="hide-mobile">
                  <div className="font-mono font-extrabold text-lg text-white">
                    {formatPrice(owner.purchasePriceCents)}
                  </div>
                  <div className="font-mono text-[10px] text-white/40">PAID AMOUNT</div>
                </div>

                <div className="hide-mobile text-right">
                  <div className="font-mono text-sm text-emerald-400 font-bold">
                    {owner.outboundClicks.toLocaleString()}
                  </div>
                  <div className="font-mono text-[10px] text-white/40">CLICKS</div>
                </div>

                <div>
                  <a
                    href={`/buy/${slug}?outbid=${owner.purchasePriceCents}`}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-white/10 hover:bg-[#ff4e24] hover:text-white text-white/90 font-mono text-xs font-bold uppercase transition-all shadow"
                  >
                    Claim Rank for {formatPrice(outbidTarget)}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
