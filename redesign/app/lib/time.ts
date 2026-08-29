export const BUY1MINUTE_TIMEZONE = "UTC";
export const MINUTES_PER_DAY = 1_440;

export function minuteIndexFromDate(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export function minuteIndexToTime(index: number): string {
  const normalized = ((index % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function minuteIndexToSlug(index: number): string {
  return minuteIndexToTime(index).replace(":", "-");
}

export function parseMinuteSlug(slug: string): number | null {
  const match = /^(\d{2})-(\d{2})$/.exec(slug);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(1, Math.floor((Date.now() - then) / 1000));
  const units: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [30, "d"],
    [12, "mo"],
    [Number.POSITIVE_INFINITY, "y"],
  ];
  let value = seconds;
  for (let i = 0; i < units.length; i += 1) {
    const [step, label] = units[i];
    if (value < step || i === units.length - 1) {
      const rounded = Math.floor(value);
      return `${rounded}${label} ago`;
    }
    value /= step;
  }
  return "";
}

export function formatLocalTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatUtcDetailed(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
