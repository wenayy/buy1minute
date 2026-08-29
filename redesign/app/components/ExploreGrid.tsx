"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandIcon } from "./BrandIcon";
import { formatPrice } from "../lib/pricing";
import { allMinutes } from "../lib/seed-data";
import { minuteIndexFromDate, minuteIndexToSlug, minuteIndexToTime } from "../lib/time";
import type { MinuteState } from "../lib/types";

type Filter = "all" | "available" | "owned";

export function ExploreGrid() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [currentMinute, setCurrentMinute] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setCurrentMinute(minuteIndexFromDate(new Date()));
    tick();
    const interval = window.setInterval(tick, 10_000);
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
        minute.owner?.product.name.toLowerCase().includes(normalizedQuery) ||
        minute.owner?.product.category?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [filter, query]);

  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      minutes: visible.filter((m) => Math.floor(m.minuteIndex / 60) === hour),
    })).filter((group) => group.minutes.length > 0);
  }, [visible]);

  return (
    <div className="explore-container">
      {/* Controls Bar */}
      <div className="explore-controls-bar">
        <div className="filter-pills" role="group" aria-label="Filter minute status">
          {(["all", "available", "owned"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`filter-pill ${filter === tab ? "active" : ""}`}
              onClick={() => setFilter(tab)}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="search-input-wrap">
            <span className="text-white/40">🔍</span>
            <input
              type="search"
              placeholder="Filter by time, brand, or tag..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <select
            className="rounded-xl border border-white/10 bg-[#08080a] px-4 py-2 font-mono text-xs text-white/70 outline-none"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                document.getElementById(`hour-${e.target.value}`)?.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            <option value="" disabled>
              JUMP TO HOUR
            </option>
            {Array.from({ length: 24 }, (_, hour) => (
              <option key={hour} value={hour}>
                {String(hour).padStart(2, "0")}:00 UTC
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="space-y-8">
        {hours.map(({ hour, minutes }) => (
          <section key={hour} id={`hour-${hour}`} className="hour-row-block">
            <div className="hour-row-header">
              <strong>{String(hour).padStart(2, "0")}:00</strong>
              <span className="font-mono text-xs text-white/40">
                {minutes.filter((m) => m.status === "owned").length} / {minutes.length} CLAIMED
              </span>
            </div>

            <div className="hour-minutes-grid">
              {minutes.map((minute) => {
                const isLive = minute.minuteIndex === currentMinute;
                const isOwned = minute.status === "owned";

                return (
                  <a
                    key={minute.minuteIndex}
                    href={`/minute/${minuteIndexToSlug(minute.minuteIndex)}`}
                    className={`minute-grid-card ${isOwned ? "is-owned" : ""} ${isLive ? "is-live" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid-card-time">{minute.time}</span>
                      {isLive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#ff4e24] animate-ping" />
                      )}
                    </div>

                    <div className="grid-card-label">
                      {isOwned ? (
                        minute.owner?.product.name
                      ) : minute.status === "auction" ? (
                        <span className="text-yellow-400">AUCTION</span>
                      ) : (
                        <span className="text-emerald-400">{formatPrice(minute.priceCents ?? 100)}</span>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        ))}

        {hours.length === 0 && (
          <div className="py-24 text-center">
            <span className="font-mono text-sm text-white/40">No minutes matched your search filter.</span>
          </div>
        )}
      </div>
    </div>
  );
}
