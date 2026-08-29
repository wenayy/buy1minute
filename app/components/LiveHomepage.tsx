"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LogoMark } from "./LogoMark";
import { ProductVisual } from "./ProductVisual";
import { SiteHeader } from "./SiteHeader";
import { formatPrice } from "../lib/pricing";
import { getMinuteState, seededOwnerships } from "../lib/seed-data";
import {
  formatLocalTime,
  minuteIndexFromDate,
  minuteIndexToSlug,
  minuteIndexToTime,
} from "../lib/time";
import type { MinuteState, OwnedMinute } from "../lib/types";

// The reigning champion: the single highest bid across all owned minutes.
const rankedByBid = [...seededOwnerships].sort((a, b) => b.purchasePriceCents - a.purchasePriceCents);
const topBidder = rankedByBid[0];

function sendEvent(eventType: string, minuteIndex: number) {
  const payload = JSON.stringify({ eventType, minuteIndex, path: window.location.pathname });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
  } else {
    void fetch("/api/events", { method: "POST", body: payload, headers: { "content-type": "application/json" }, keepalive: true });
  }
}

export function LiveHomepage() {
  const [now, setNow] = useState<Date | null>(null);
  const [databaseOwners, setDatabaseOwners] = useState<OwnedMinute[]>([]);
  const [transitioning, setTransitioning] = useState(false);
  const lastMinute = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    const refreshOwners = () => {
      fetch("/api/live-state").then((response) => response.ok ? response.json() : null).then((payload: { owners?: OwnedMinute[] } | null) => {
        if (active && payload?.owners) setDatabaseOwners(payload.owners);
      }).catch(() => undefined);
    };
    refreshOwners();
    // A purchase can complete while the homepage is open. Keep the live
    // minute, upcoming cards, and leaderboard in sync without a hard refresh.
    const interval = window.setInterval(refreshOwners, 10_000);
    window.addEventListener("focus", refreshOwners);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener("focus", refreshOwners); };
  }, []);

  const minuteIndex = now ? minuteIndexFromDate(now) : 0;
  const owners = useMemo(() => {
    const merged = new Map(seededOwnerships.map((owner) => [owner.minuteIndex, owner]));
    for (const owner of databaseOwners) merged.set(owner.minuteIndex, owner);
    return [...merged.values()];
  }, [databaseOwners]);
  const ownersByMinute = useMemo(() => new Map(owners.map((owner) => [owner.minuteIndex, owner])), [owners]);
  const current = useMemo(() => {
    const base = getMinuteState(minuteIndex);
    const owner = ownersByMinute.get(minuteIndex);
    return { ...base, owner, status: owner ? "owned" as const : base.status };
  }, [minuteIndex, ownersByMinute]);
  const ranked = useMemo(() => [...owners].sort((a, b) => b.purchasePriceCents - a.purchasePriceCents), [owners]);

  useEffect(() => {
    if (!now) return;
    if (lastMinute.current !== null && lastMinute.current !== minuteIndex) {
      setTransitioning(true);
      const timeout = window.setTimeout(() => setTransitioning(false), 650);
      lastMinute.current = minuteIndex;
      return () => window.clearTimeout(timeout);
    }
    lastMinute.current = minuteIndex;
  }, [minuteIndex, now]);

  useEffect(() => {
    if (current.owner) sendEvent("homepage_takeover_impression", minuteIndex);
  }, [current.owner, minuteIndex]);

  if (!now) {
    return (
      <main className="clock-loading" aria-label="Synchronizing Buy1Minute time">
        <span>BUY1MINUTE TIME</span>
        <strong>--:--</strong>
      </main>
    );
  }

  const secondsRemaining = 60 - now.getUTCSeconds();
  const countdown = `00:${secondsRemaining.toString().padStart(2, "0")}`;

  return (
    <main
      className={`live-home ${current.owner ? "live-owned" : "live-available"} ${transitioning ? "is-transitioning" : ""}`}
      style={current.owner ? ({ "--takeover-accent": "#f0ede4", "--takeover-ink": "#0a0a09" } as React.CSSProperties) : undefined}
    >
      <SiteHeader />
      <div className="live-frame" key={minuteIndex}>
        <ClockRail now={now} time={current.time} />
        {current.owner ? (
          <OwnedTakeover state={current} countdown={countdown} minuteIndex={minuteIndex} />
        ) : (
          <FeaturedTakeover state={current} champion={ranked[0] ?? topBidder} minuteIndex={minuteIndex} />
        )}
      </div>
      <UpcomingMinutes minuteIndex={minuteIndex} owners={owners} />
      <HomeLeaderboard minuteIndex={minuteIndex} owners={ranked} />
    </main>
  );
}

function ClockRail({ now, time }: { now: Date; time: string }) {
  return (
    <aside className="clock-rail">
      <div>
        <span className="eyebrow">BUY1MINUTE TIME</span>
        <strong>{time}</strong>
        <span>UTC · {now.getUTCSeconds().toString().padStart(2, "0")} SEC</span>
      </div>
      <div className="local-time">
        <span>YOUR LOCAL TIME</span>
        <strong>{formatLocalTime(now)}</strong>
      </div>
    </aside>
  );
}

function OwnedTakeover({ state, countdown, minuteIndex }: { state: MinuteState; countdown: string; minuteIndex: number }) {
  const owner = state.owner;
  if (!owner) return null;
  const seconds = Number(countdown.slice(-2));
  return (
    <section className="takeover owned-takeover" aria-live="polite">
      <div className="takeover-copy">
        <span className="eyebrow live-eyebrow"><span className="live-badge"><i /></span>LIVE · THIS MINUTE BELONGS TO</span>
        <div className="owner-heading">
          <LogoMark product={owner.product} interactive />
          <h1>{owner.product.name}</h1>
        </div>
        <p className="takeover-tagline">{owner.product.tagline}</p>
        <p className="takeover-description">{owner.product.description}</p>
        <a
          className="primary-link owner-cta"
          href={owner.product.websiteUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => sendEvent("outbound_click", minuteIndex)}
        >
          Visit <span>↗</span>
        </a>
        <div className={`remaining ${seconds <= 5 ? "remaining-urgent" : ""}`}>
          <span>{formatPrice(owner.purchasePriceCents)} · {owner.outboundClicks.toLocaleString("en-US")} clicks</span>
          <strong>{countdown} remaining</strong>
        </div>
        <div className="minute-progress" aria-hidden="true"><span style={{ width: `${((60 - seconds) / 60) * 100}%` }} /></div>
        <a className="text-link outbid-link" href={`/buy/${minuteIndexToSlug(minuteIndex)}?outbid=${owner.purchasePriceCents}`}>
          Outbid from {formatPrice(owner.purchasePriceCents + 100)} →
        </a>
      </div>
      <ProductVisual product={owner.product} />
      <div className="owned-meta">
        Held since {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(owner.ownedSince))}
      </div>
    </section>
  );
}

// When the live minute is unclaimed, we still feature a brand — the reigning
// highest bidder — so the homepage is never empty, plus a claim CTA.
function FeaturedTakeover({ state, champion, minuteIndex }: { state: MinuteState; champion?: OwnedMinute; minuteIndex: number }) {
  const priceLabel = state.priceCents === null ? "AUCTION" : formatPrice(state.priceCents);
  return (
    <section
      className="takeover featured-takeover"
      aria-live="polite"
      style={{ "--champ-accent": "#ff4e24" } as React.CSSProperties}
    >
      <div className="featured-copy">
        <span className="eyebrow featured-eyebrow">
          <span className="live-badge"><i /></span>
          <em>{state.time} IS OPEN</em>{champion ? <> · TODAY’S TOP SPOT · {formatPrice(champion.purchasePriceCents)}</> : <> · BE THE FIRST TO CLAIM IT</>}
        </span>
        {champion ? <>
          <div className="owner-heading">
            <LogoMark product={champion.product} interactive />
            <h1>{champion.product.name}</h1>
          </div>
          <p className="takeover-tagline">{champion.product.tagline}</p>
        </> : <>
          <div className="owner-heading"><h1>Own the next 60 seconds.</h1></div>
          <p className="takeover-tagline">Put your product on the homepage at this exact minute, every day.</p>
        </>}
        <div className="featured-actions">
          {champion ? <><a className="primary-link" href={champion.product.websiteUrl} target="_blank" rel="noopener noreferrer sponsored" onClick={() => sendEvent("outbound_click", champion.minuteIndex)}>Visit <span>↗</span></a>
          <a className="ghost-link" href={`/buy/${minuteIndexToSlug(champion.minuteIndex)}?outbid=${champion.purchasePriceCents}`}>Outbid the champion →</a></> : <a className="primary-link" href={`/buy/${minuteIndexToSlug(minuteIndex)}`}>Claim this minute <span>→</span></a>}
        </div>
      </div>
      {champion ? (
        <aside className="claim-block featured-claim">
          <span>CLAIM {state.time}</span>
          <strong>{priceLabel}</strong>
          {state.priceCents === null ? (
            <a className="primary-link muted-link" href="/explore">Explore available minutes</a>
          ) : (
            <a className="primary-link" href={`/buy/${minuteIndexToSlug(minuteIndex)}`}>
              Claim this minute <span>→</span>
            </a>
          )}
          <small>No one owns {state.time} yet. Claim it and take over the homepage every day.</small>
        </aside>
      ) : (
        <aside className="claim-block featured-claim featured-claim-empty">
          <span className="claim-eyebrow">YOUR DAILY SPOT · {state.time}</span>
          <div className="claim-timer" aria-hidden="true">
            <span className="claim-ring" />
            <strong>60<em>SEC</em></strong>
          </div>
          {state.priceCents === null ? (
            <a className="primary-link muted-link" href="/explore">Explore available minutes</a>
          ) : (
            <a className="primary-link" href={`/buy/${minuteIndexToSlug(minuteIndex)}`}>
              Claim this minute <span>→</span>
            </a>
          )}
          <small>One minute. One product. A daily homepage takeover.</small>
        </aside>
      )}
    </section>
  );
}

// Next few minutes — bid on upcoming slots before they arrive.
function UpcomingMinutes({ minuteIndex, owners }: { minuteIndex: number; owners: OwnedMinute[] }) {
  const upcoming = [1, 2, 3, 4, 5, 6].map((offset) => getMinuteState(minuteIndex + offset));
  const ownersByMinute = new Map(owners.map((owner) => [owner.minuteIndex, owner]));
  return (
    <section className="upcoming-wrap" aria-label="Upcoming minutes to bid on">
      <div className="upcoming-heading">
        <span>NEXT UP · BID ON UPCOMING MINUTES</span>
        <a href="/explore">Explore all 1,440 →</a>
      </div>
      <div className="upcoming-row">
        {upcoming.map((minute) => {
          const owner = ownersByMinute.get(minute.minuteIndex) ?? minute.owner;
          // Owned minutes lead to their page (you outbid from there); open
          // minutes go straight to claim.
          const href = owner
            ? `/minute/${minuteIndexToSlug(minute.minuteIndex)}`
            : `/buy/${minuteIndexToSlug(minute.minuteIndex)}`;
          return (
            <a
              key={minute.minuteIndex}
              href={href}
              className={`upcoming-card ${owner ? "upcoming-owned" : "upcoming-open"}`}
              style={owner ? ({ "--card-accent": "#ff4e24" } as React.CSSProperties) : undefined}
            >
              <span className="upcoming-time">{minuteIndexToTime(minute.minuteIndex)}</span>
              {owner ? (
                <>
                  <span className="upcoming-brand">
                    <LogoMark product={owner.product} small />
                    <strong>{owner.product.name}</strong>
                  </span>
                  <span className="upcoming-cta">{formatPrice(owner.purchasePriceCents)} · view →</span>
                </>
              ) : (
                <>
                  <strong className="upcoming-price">{minute.priceCents === null ? "AUCTION" : formatPrice(minute.priceCents)}</strong>
                  <span className="upcoming-cta upcoming-cta-open">Claim now →</span>
                </>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}

function HomeLeaderboard({ minuteIndex, owners }: { minuteIndex: number; owners: OwnedMinute[] }) {
  const ranked = owners.slice(0, 10);
  return (
    <section className="home-leaderboard" aria-label="Minutes ranked by highest bid">
      <div className="home-lb-heading">
        <span>TOP BIDS · HIGHEST BIDS OWN THE MINUTE</span>
        <a href="/leaderboard">See the full leaderboard →</a>
      </div>
      <ol className="home-lb-list">
        {ranked.map((owner, index) => {
          const isLive = owner.minuteIndex === minuteIndex;
          return (
            <li
              key={owner.minuteIndex}
              className={`home-lb-row ${isLive ? "home-lb-live" : ""} ${index === 0 ? "home-lb-top" : ""}`}
              style={index === 0 ? ({ "--row-accent": "#ff4e24" } as React.CSSProperties) : undefined}
            >
              <span className="home-lb-rank">{(index + 1).toString().padStart(2, "0")}</span>
              <a href={`/minute/${minuteIndexToSlug(owner.minuteIndex)}`} className="home-lb-brand">
                <LogoMark product={owner.product} small />
                <span>
                  <strong>{owner.product.name}</strong>
                    <small>{minuteIndexToTime(owner.minuteIndex)} UTC · {owner.product.category ?? "OTHER"}{isLive ? " · LIVE NOW" : ""}</small>
                </span>
              </a>
              <span className="home-lb-bid">
                <strong>{formatPrice(owner.purchasePriceCents)}</strong>
                <small>PRICE</small>
              </span>
              <span className="home-lb-clicks">
                <strong>{owner.outboundClicks.toLocaleString("en-US")}</strong>
                <small>CLICKS</small>
              </span>
              <div className="home-lb-actions">
                <a
                  className="home-lb-visit"
                  href={owner.product.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  onClick={() => sendEvent("outbound_click", owner.minuteIndex)}
                >
                  Visit ↗
                </a>
                <a
                  className="home-lb-outbid"
                  href={`/buy/${minuteIndexToSlug(owner.minuteIndex)}?outbid=${owner.purchasePriceCents}`}
                >
                  Outbid →
                </a>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="home-lb-footer">
        <a className="text-link" href="/leaderboard">See the full leaderboard →</a>
      </div>
    </section>
  );
}
