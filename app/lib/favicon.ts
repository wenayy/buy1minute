/**
 * Resolve a brand's favicon straight from the website URL the owner entered.
 * We no longer ask people to upload a logo or a screenshot — the favicon is
 * fetched automatically from their domain.
 */

function origin(websiteUrl: string): string | null {
  try {
    const normalized = /^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`;
    return new URL(normalized).origin;
  } catch {
    return null;
  }
}

/** Human-friendly hostname for display, e.g. "linear.app". */
export function displayHost(websiteUrl: string | null | undefined): string {
  if (!websiteUrl) return "";
  const o = origin(websiteUrl);
  if (!o) return "";
  try {
    return new URL(o).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Ordered list of favicon URLs to try. Different providers cover different
 * sites, so the <BrandIcon> component walks this list on error before falling
 * back to initials. DuckDuckGo and Google's faviconV2 are the most reliable.
 */
export function faviconSources(websiteUrl: string | null | undefined, size = 128): string[] {
  if (!websiteUrl) return [];
  const o = origin(websiteUrl);
  const host = displayHost(websiteUrl);
  if (!o || !host) return [];
  return [
    `https://icons.duckduckgo.com/ip3/${host}.ico`,
    `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(o)}&size=${size}`,
    `https://www.google.com/s/2/favicons?sz=${size}&domain=${host}`,
    `${o}/favicon.ico`,
  ];
}

/** First-choice favicon URL (kept for convenience / non-fallback contexts). */
export function faviconUrl(websiteUrl: string | null | undefined, size = 128): string | null {
  return faviconSources(websiteUrl, size)[0] ?? null;
}

function hslToHex(h: number, s: number, l: number): string {
  const a = (s * Math.min(l, 1 - l)) / 100;
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/**
 * Returns a legible foreground color (near-black or near-white) for text placed
 * on top of the given accent color, based on its relative luminance. Prevents
 * unreadable dark-on-dark or light-on-light brand takeovers.
 */
export function readableTextColor(hex: string): string {
  const clean = hex.replace("#", "").trim();
  if (clean.length !== 6) return "#0a0a09";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.55 ? "#0a0a09" : "#f4f1e9";
}

/**
 * Deterministic, pleasant accent color derived from a string (e.g. hostname).
 * Used as a fallback when a site's real theme color can't be detected.
 */
export function colorFromString(input: string): string {
  if (!input) return "#ff5c35";
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = input.charCodeAt(index) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return hslToHex(hue, 68, 62);
}
