// Detects a website's brand/theme color so owners don't have to pick one by
// hand. Reads <meta name="theme-color"> (and a couple of common fallbacks)
// from the site's HTML.

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

// Basic SSRF guard: only public http(s) hosts.
function isBlockedHost(host: string): boolean {
  return (
    host === "localhost" ||
    host.endsWith(".local") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
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
  if (!/^https?:$/.test(target.protocol) || isBlockedHost(target.hostname)) {
    return Response.json({ color: null });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(target.origin, {
      headers: { "user-agent": "Buy1MinuteBot/1.0 (+brand-color)" },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return Response.json({ color: null });
    const html = (await response.text()).slice(0, 120_000);
    return Response.json({ color: extractThemeColor(html) });
  } catch {
    return Response.json({ color: null });
  }
}
