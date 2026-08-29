"use client";

import { useEffect, useState } from "react";
import { minuteIndexFromDate } from "../lib/time";

export function MinuteCountdown({ minuteIndex }: { minuteIndex: number }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!now) return <span className="minute-live-countdown">SYNCING LIVE TIME</span>;
  const current = minuteIndexFromDate(now);
  const seconds = now.getUTCSeconds();
  if (current === minuteIndex) {
    const remaining = 60 - seconds;
    return <span className="minute-live-countdown is-live"><i /> LIVE NOW · 00:{remaining.toString().padStart(2, "0")} REMAINING</span>;
  }
  const minutesUntil = (minuteIndex - current + 1_440) % 1_440;
  return <span className="minute-live-countdown">NEXT LIVE IN · {minutesUntil} MIN</span>;
}
