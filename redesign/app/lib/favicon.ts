import { isBlockedSSRFHost } from "./security";

/**
 * Resolves safe, high-resolution favicon URLs for a brand website.
 */
function getSafeOrigin(websiteUrl: string): string | null {
  try {
    const normalized = /^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`;
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (isBlockedSSRFHost(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function displayHost(websiteUrl: string | null | undefined): string {
  if (!websiteUrl) return "";
  try {
    const normalized = /^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`;
    const url = new URL(normalized);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Ordered list of reliable favicon sources.
 */
export function faviconSources(websiteUrl: string | null | undefined, size = 128): string[] {
  if (!websiteUrl) return [];
  const o = getSafeOrigin(websiteUrl);
  const host = displayHost(websiteUrl);
  if (!o || !host) return [];

  return [
    `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`,
    `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(o)}&size=${size}`,
    `https://www.google.com/s/2/favicons?sz=${size}&domain=${encodeURIComponent(host)}`,
    `${o}/favicon.ico`,
  ];
}

export function readableTextColor(hex: string): string {
  const clean = hex.replace("#", "").trim();
  if (clean.length !== 6) return "#0a0a09";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.55 ? "#0a0a09" : "#f4f1e9";
}
