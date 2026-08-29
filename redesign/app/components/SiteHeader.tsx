"use client";

import { useEffect, useState } from "react";

export function SiteHeader() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const utcHours = now ? String(now.getUTCHours()).padStart(2, "0") : "--";
  const utcMins = now ? String(now.getUTCMinutes()).padStart(2, "0") : "--";
  const utcSecs = now ? String(now.getUTCSeconds()).padStart(2, "0") : "--";

  return (
    <header className="site-header">
      <div className="flex items-center gap-6">
        <a href="/" className="brand-wordmark" aria-label="Buy1Minute Home">
          <span className="brand-badge">1</span>
          <span className="font-mono text-sm tracking-tight font-black">
            BUY<span className="text-[#ff4e24]">1</span>MINUTE
          </span>
        </a>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[11px] text-white/70">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>NO ALGORITHMS · PURE PAY-TO-RANK</span>
        </div>
      </div>

      <nav className="nav-links" aria-label="Main Navigation">
        <a href="/" className="nav-link">Live Broadcast</a>
        <a href="/leaderboard" className="nav-link">Leaderboard</a>
        <a href="/explore" className="nav-link">1,440 Grid</a>
        <a href="/how-it-works" className="nav-link">Rules</a>
      </nav>

      <div className="flex items-center gap-3">
        <div className="utc-pulse-pill font-mono">
          <span className="pulse-dot" />
          <span className="font-bold">{utcHours}:{utcMins}:{utcSecs} UTC</span>
        </div>
      </div>
    </header>
  );
}
