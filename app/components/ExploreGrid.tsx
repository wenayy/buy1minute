"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandIcon } from "./BrandIcon";
import { formatPrice } from "../lib/pricing";
import { allMinutes } from "../lib/seed-data";
import { minuteIndexFromDate, minuteIndexToSlug } from "../lib/time";
import type { MinuteState } from "../lib/types";

type Filter = "all" | "available" | "owned";

export function ExploreGrid() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [currentMinute, setCurrentMinute] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setCurrentMinute(minuteIndexFromDate(new Date()));
    tick();
    const interval = window.setInterval(tick, 15_000);
    return () => window.clearInterval(interval);
  }, []);

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return allMinutes.filter((minute) => {
      if (filter === "available" && minute.status !== "available") return false;
      if (filter === "owned" && minute.status !== "owned") return false;
      if (!normalizedQuery) return true;
      return (
        minute.time.includes(normalizedQuery) ||
        minute.owner?.product.name.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [filter, query]);

  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    minutes: visible.filter((minute) => Math.floor(minute.minuteIndex / 60) === hour),
  })).filter((group) => group.minutes.length > 0);

  return (
    <>
      <div className="explore-controls">
        <div className="filter-tabs" role="group" aria-label="Filter minutes">
          {(["all", "available", "owned"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={filter === value ? "active" : ""}
              onClick={() => setFilter(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <label className="minute-search">
          <span className="sr-only">Search by time or brand</span>
          <input
            type="search"
            placeholder="SEARCH TIME OR BRAND"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="hour-jump">
          <span className="sr-only">Jump to hour</span>
          <select
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) document.getElementById(`hour-${event.target.value}`)?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <option value="" disabled>JUMP TO HOUR</option>
            {Array.from({ length: 24 }, (_, hour) => (
              <option key={hour} value={hour}>{hour.toString().padStart(2, "0")}:00</option>
            ))}
          </select>
        </label>
      </div>

      <div className="day-grid">
        {hours.map(({ hour, minutes }) => (
          <HourRow key={hour} hour={hour} minutes={minutes} currentMinute={currentMinute} />
        ))}
        {hours.length === 0 && (
          <div className="empty-search">No minutes match that search.</div>
        )}
      </div>
    </>
  );
}

function HourRow({ hour, minutes, currentMinute }: { hour: number; minutes: MinuteState[]; currentMinute: number | null }) {
  return (
    <section className="hour-row" id={`hour-${hour}`}>
      <header>
        <strong>{hour.toString().padStart(2, "0")}</strong>
        <span>{minutes.filter((minute) => minute.status === "owned").length} owned</span>
      </header>
      <div className="hour-minutes">
        {minutes.map((minute) => {
          const live = minute.minuteIndex === currentMinute;
          return (
            <a
              key={minute.minuteIndex}
              href={`/minute/${minuteIndexToSlug(minute.minuteIndex)}`}
              className={`minute-tile minute-${minute.status} ${live ? "minute-live" : ""}`}
            >
              <span className="minute-tile-top">
                {minute.time}
                {minute.owner && <BrandIcon websiteUrl={minute.owner.product.websiteUrl} fallback={minute.owner.product.shortName} size={64} className="tile-favicon" imgClassName="tile-favicon-img" />}
              </span>
              {minute.owner ? (
                <strong>{minute.owner.product.name}</strong>
              ) : minute.status === "auction" ? (
                <strong className="tile-auction">AUCTION</strong>
              ) : (
                <strong className="tile-price">{formatPrice(minute.priceCents ?? 100)}</strong>
              )}
              {minute.owner ? (
                <small className="minute-tile-clicks">{minute.owner.outboundClicks.toLocaleString()} clicks</small>
              ) : minute.status === "available" ? (
                <small className="minute-tile-cta">Claim →</small>
              ) : null}
              {live && <em>LIVE</em>}
            </a>
          );
        })}
      </div>
    </section>
  );
}
