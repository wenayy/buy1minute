"use client";

import { useEffect, useMemo, useState } from "react";
import { LogoMark } from "./LogoMark";
import { ProductVisual } from "./ProductVisual";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { formatPrice } from "../lib/pricing";
import { getMinuteState, seededOwnerships } from "../lib/seed-data";
import {
  formatLocalTime,
  minuteIndexFromDate,
  minuteIndexToSlug,
  minuteIndexToTime,
} from "../lib/time";
import type { OwnedMinute } from "../lib/types";

function sendEvent(eventType: string, minuteIndex: number) {
  const payload = JSON.stringify({
    eventType,
    minuteIndex,
    path: typeof window !== "undefined" ? window.location.pathname : "/",
  });
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
  } else if (typeof fetch !== "undefined") {
    void fetch("/api/events", {
      method: "POST",
      body: payload,
      headers: { "content-type": "application/json" },
      keepalive: true,
    }).catch(() => undefined);
  }
}

export function LiveHomepage() {
  const [now, setNow] = useState<Date | null>(null);
  const [databaseOwners, setDatabaseOwners] = useState<OwnedMinute[]>([]);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const interval = window.setInterval(tick, 200);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/live-state")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { owners?: OwnedMinute[] } | null) => {
        if (active && payload?.owners) {
          setDatabaseOwners(payload.owners);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const minuteIndex = now ? minuteIndexFromDate(now) : 0;

  const owners = useMemo(() => {
    const merged = new Map(seededOwnerships.map((o) => [o.minuteIndex, o]));
    for (const owner of databaseOwners) {
      merged.set(owner.minuteIndex, owner);
    }
    return [...merged.values()];
  }, [databaseOwners]);

  const ownersByMinute = useMemo(() => new Map(owners.map((o) => [o.minuteIndex, o])), [owners]);

  const current = useMemo(() => {
    const base = getMinuteState(minuteIndex);
    const owner = ownersByMinute.get(minuteIndex);
    return { ...base, owner, status: owner ? ("owned" as const) : base.status };
  }, [minuteIndex, ownersByMinute]);

  const ranked = useMemo(
    () => [...owners].sort((a, b) => b.purchasePriceCents - a.purchasePriceCents),
    [owners]
  );

  const champion = ranked[0] ?? null;

  useEffect(() => {
    if (current.owner) {
      sendEvent("homepage_takeover_impression", minuteIndex);
    }
  }, [current.owner, minuteIndex]);

  if (!now) {
    return (
      <main className="flex h-screen flex-col items-center justify-center bg-[#08080a] text-center">
        <span className="font-mono text-xs tracking-widest text-white/40">INITIALIZING GLOBAL CHRONOMETER</span>
        <strong className="mt-2 font-mono text-6xl font-extrabold text-white">--:--</strong>
      </main>
    );
  }

  const seconds = now.getUTCSeconds();
  const secondsRemaining = 60 - seconds;
  const countdownFormatted = `${String(secondsRemaining).padStart(2, "0")}s`;
  const secondsProgressPercent = (seconds / 60) * 100;

  return (
    <div className="live-homepage">
      <SiteHeader />

      {/* High-Impact Viral Hero */}
      <section className="px-4 sm:px-8 pt-10 pb-6 max-w-[1300px] mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-xs text-white/70 mb-4">
          <span className="w-2 h-2 rounded-full bg-[#ff4e24] animate-pulse"></span>
          <span>1,440 DAILY SLOTS · PAY TO RANK · OUTBID TO WIN</span>
        </div>

        <h1 className="text-4xl sm:text-7xl font-extrabold text-white tracking-tight leading-[1.05] max-w-4xl mx-auto">
          The Pay-to-Rank Clock <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#ff4e24] via-amber-400 to-emerald-400 bg-clip-text text-transparent">
            of the Internet.
          </span>
        </h1>

        <p className="text-white/60 text-base sm:text-lg max-w-2xl mx-auto mt-4 leading-relaxed">
          No algorithms. No upvote cartels. Highest bid owns the minute and takes over the homepage for 60 seconds every day.
        </p>
      </section>

      {/* #1 All-Time Champion Showcase Banner */}
      {champion && (
        <section className="px-4 sm:px-8 mb-8 max-w-[1300px] mx-auto w-full">
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#0f1014] to-transparent p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 grid place-items-center font-mono font-black text-amber-400 text-xl shadow-lg shadow-amber-500/20">
                #1
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    👑 REIGNING #1 CHAMPION
                  </span>
                  <span className="font-mono text-xs text-white/40">
                    {minuteIndexToTime(champion.minuteIndex)} UTC BROADCAST
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-white mt-0.5">{champion.product.name}</h3>
                <p className="text-xs text-white/60 mt-0.5">{champion.product.tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right font-mono">
                <div className="text-2xl font-extrabold text-amber-400">
                  {formatPrice(champion.purchasePriceCents)}
                </div>
                <span className="text-[10px] text-white/40 uppercase">WINNING PRICE</span>
              </div>
              <a
                href={`/buy/${minuteIndexToSlug(champion.minuteIndex)}?outbid=${champion.purchasePriceCents}`}
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-amber-500/30"
              >
                Claim #1 for {formatPrice(champion.purchasePriceCents + 100)} →
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Main Broadcast Stage */}
      <section className="chrono-hero-container">
        {/* Left Live Clock HUD */}
        <aside className="chrono-rail">
          <div className="chrono-time-display">
            <span className="eyebrow">
              <span className="h-2 w-2 rounded-full bg-[#ff4e24] animate-ping" />
              LIVE BROADCAST CLOCK
            </span>
            <strong className="chrono-time-giant">{current.time}</strong>
            <div className="chrono-seconds-bar">
              <div
                className="chrono-seconds-fill"
                style={{ width: `${secondsProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="chrono-info-block">
            <div className="chrono-info-item">
              <span>YOUR LOCAL TIME</span>
              <strong className="font-mono">{formatLocalTime(now)}</strong>
            </div>
            <div className="chrono-info-item">
              <span>BROADCAST TIME REMAINING</span>
              <strong className="font-mono text-lg text-[#ff4e24] font-bold">{countdownFormatted}</strong>
            </div>
            <div className="chrono-info-item">
              <span>ACTIVE SLOT</span>
              <strong className="font-mono">{minuteIndex + 1} / 1,440</strong>
            </div>
          </div>
        </aside>

        {/* Live Takeover Card */}
        {current.owner ? (
          <section className="takeover-stage is-owned">
            <div className="flex flex-col items-start justify-center">
              <div className="takeover-meta-header">
                <span className="live-indicator">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff4e24] animate-ping" />
                  LIVE ON AIR RIGHT NOW
                </span>
                <span className="font-mono text-xs text-white/50">
                  {formatPrice(current.owner.purchasePriceCents)} ACTIVE BID
                </span>
              </div>

              <div className="brand-heading-row">
                <LogoMark product={current.owner.product} />
                <h2 className="brand-title">{current.owner.product.name}</h2>
              </div>

              <p className="brand-tagline">{current.owner.product.tagline}</p>
              <p className="brand-description">{current.owner.product.description}</p>

              <div className="flex flex-wrap items-center gap-4">
                <a
                  href={current.owner.product.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="btn-primary"
                  onClick={() => sendEvent("outbound_click", minuteIndex)}
                >
                  Visit Website <span>↗</span>
                </a>
                <a
                  href={`/buy/${minuteIndexToSlug(minuteIndex)}?outbid=${current.owner.purchasePriceCents}`}
                  className="btn-secondary"
                >
                  Outbid for {formatPrice(current.owner.purchasePriceCents + 100)} →
                </a>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <ProductVisual product={current.owner.product} />
            </div>
          </section>
        ) : (
          <section className="takeover-stage">
            <div className="flex flex-col items-start justify-center">
              <div className="takeover-meta-header">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-xs font-bold text-emerald-400 border border-emerald-500/20">
                  OPEN AIRTIME
                </span>
                <span className="font-mono text-xs text-white/50">
                  {current.time} UTC IS CURRENTLY UNCLAIMED
                </span>
              </div>

              <h2 className="brand-title">Take Over This Minute.</h2>
              <p className="brand-tagline">
                Broadcast your website to the entire internet for 60 seconds every day.
              </p>
              <p className="brand-description">
                Own {current.time} permanently. Transparent pay-to-rank. No algorithms or gatekeepers.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                {current.priceCents === null ? (
                  <a href="/explore" className="btn-secondary">
                    Explore Available Minutes
                  </a>
                ) : (
                  <a href={`/buy/${minuteIndexToSlug(minuteIndex)}`} className="btn-primary">
                    Claim {current.time} for {formatPrice(current.priceCents)} <span>→</span>
                  </a>
                )}
                <a href="/how-it-works" className="btn-ghost">
                  How pay-to-rank works →
                </a>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 text-center backdrop-blur-md">
                <div className="font-mono text-xs uppercase tracking-wider text-white/50">Starting Bid</div>
                <div className="mt-3 font-mono text-5xl font-extrabold text-[#ff4e24]">
                  {current.priceCents === null ? "AUCTION" : formatPrice(current.priceCents)}
                </div>
                <p className="mt-4 text-xs text-white/60">
                  Permanent daily 60s broadcast · Verified link
                </p>
                <a
                  href={`/buy/${minuteIndexToSlug(minuteIndex)}`}
                  className="mt-6 inline-block w-full rounded-xl bg-white/10 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20"
                >
                  Claim {current.time} Now →
                </a>
              </div>
            </div>
          </section>
        )}
      </section>

      {/* Upcoming Slots Ticker */}
      <section className="upcoming-ribbon" aria-label="Upcoming minutes timeline">
        <div className="upcoming-header">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            UPCOMING BROADCAST BATTLES
          </span>
          <a href="/explore" className="font-mono text-xs text-[#ff4e24] hover:underline">
            View All 1,440 Minutes →
          </a>
        </div>

        <div className="upcoming-scroll">
          {[1, 2, 3, 4, 5, 6].map((offset) => {
            const nextIdx = (minuteIndex + offset) % 1_440;
            const minute = getMinuteState(nextIdx);
            const liveOwner = ownersByMinute.get(nextIdx);
            const isOwned = Boolean(liveOwner);

            return (
              <a
                key={nextIdx}
                href={
                  isOwned
                    ? `/buy/${minuteIndexToSlug(nextIdx)}?outbid=${liveOwner?.purchasePriceCents}`
                    : `/buy/${minuteIndexToSlug(nextIdx)}`
                }
                className={`upcoming-cell ${isOwned ? "is-owned" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="upcoming-cell-time">{minuteIndexToTime(nextIdx)} UTC</span>
                  {isOwned ? (
                    <span className="font-mono text-[10px] text-[#ff4e24] font-bold">OWNED</span>
                  ) : (
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">OPEN</span>
                  )}
                </div>
                <div className="upcoming-cell-title">
                  {liveOwner ? liveOwner.product.name : "Claim Slot"}
                </div>
                <div className="upcoming-cell-price">
                  {liveOwner
                    ? `Outbid ${formatPrice(liveOwner.purchasePriceCents)}`
                    : minute.priceCents === null
                    ? "Auction"
                    : formatPrice(minute.priceCents)}
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* Live Pay-to-Rank Leaderboard */}
      <section className="p-4 sm:p-8 max-w-[1300px] mx-auto w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <span className="eyebrow text-[#ff4e24]">ALL-TIME PAY-TO-RANK BOARD</span>
            <h2 className="text-3xl font-extrabold text-white mt-1">Live Minute Rankings</h2>
          </div>
          <a href="/leaderboard" className="btn-secondary text-xs">
            See Full Leaderboard →
          </a>
        </div>

        <div className="space-y-3">
          {ranked.slice(0, 10).map((owner, idx) => {
            const outbidTarget = owner.purchasePriceCents + 100;
            const slug = minuteIndexToSlug(owner.minuteIndex);

            return (
              <div
                key={owner.minuteIndex}
                className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#0f1014] border border-white/5 hover:border-white/20 transition-all ${
                  idx === 0 ? "border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-[#0f1014]" : ""
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span
                    className={`font-mono font-black text-sm w-7 ${
                      idx === 0 ? "text-amber-400" : "text-white/40"
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <LogoMark product={owner.product} small />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <a
                        href={owner.product.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="font-bold text-white text-base hover:underline truncate"
                      >
                        {owner.product.name}
                      </a>
                      <span className="font-mono text-[10px] text-white/40 px-2 py-0.5 rounded bg-white/5">
                        {minuteIndexToTime(owner.minuteIndex)} UTC
                      </span>
                    </div>
                    <p className="text-xs text-white/60 truncate mt-0.5">{owner.product.tagline}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right font-mono hidden sm:block">
                    <div className="font-extrabold text-white text-base">
                      {formatPrice(owner.purchasePriceCents)}
                    </div>
                    <div className="text-[10px] text-white/40">WINNING PRICE</div>
                  </div>
                  <a
                    href={`/buy/${slug}?outbid=${owner.purchasePriceCents}`}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-[#ff4e24] hover:text-white text-white/80 font-mono text-xs font-bold uppercase transition-all"
                  >
                    Outbid {formatPrice(outbidTarget)}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
