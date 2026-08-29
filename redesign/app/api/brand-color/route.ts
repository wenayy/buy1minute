import { isBlockedSSRFHost } from "../../lib/security";

function normalizeHex(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(trimmed);
  if (short) {
    const [r, g, b] = short[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  const full = /^#([0-9a-f]{6})$/i.exec(trimmed);
  return full ? trimmed.toLowerCase() : null;
}

function extractThemeColor(html: string): string | null {
  const patterns = [
    /<meta[^>]+name=["']theme-color["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]*name=["']theme-color["']/i,
    /<meta[^>]+name=["']msapplication-TileColor["'][^>]*content=["']([^"']+)["']/i,
  ];
  for (const pattern of patterns) {
    const color = normalizeHex(pattern.exec(html)?.[1]);
    if (color) return color;
  }
  return null;
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) return Response.json({ color: null });

  let target: URL;
  try {
    target = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return Response.json({ color: null });
  }

  // 1. Strict protocol check
  if (!["http:", "https:"].includes(target.protocol.toLowerCase())) {
    return Response.json({ color: null });
  }

  // 2. Comprehensive SSRF hostname check
  if (isBlockedSSRFHost(target.hostname)) {
    return Response.json({ color: null });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    // 3. Security: Set redirect to "manual" or inspect redirects to prevent SSRF bypass
    const response = await fetch(target.origin, {
      headers: {
        "User-Agent": "Buy1MinuteBot/1.0 (+https://buy1minute.com)",
        "Accept": "text/html",
      },
      redirect: "manual", // Prevent automatic redirect to internal network
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok && response.status !== 200) {
      return Response.json({ color: null });
    }

    const html = (await response.text()).slice(0, 64_000); // 64KB cap
    return Response.json({ color: extractThemeColor(html) });
  } catch {
    return Response.json({ color: null });
  }
}
