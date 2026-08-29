/**
 * Security & defensive validation utilities for Buy1Minute.
 * Enforces strict input validation, SSRF protection, XSS prevention, and abuse throttling.
 */

// Forbidden schemes that could lead to XSS, sandbox escapes, or protocol smuggling
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Validates and normalizes user-provided website URLs.
 * Rejects javascript:, data:, file:, vbscript:, userinfo (user:pass@), and invalid domains.
 */
export function validateAndNormalizeUrl(raw: unknown): {
  valid: boolean;
  url?: string;
  host?: string;
  error?: string;
} {
  if (typeof raw !== "string") {
    return { valid: false, error: "Website URL must be a string." };
  }

  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 300) {
    return { valid: false, error: "Website URL is required and cannot exceed 300 characters." };
  }

  // Auto-prepend https:// if protocol is omitted
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { valid: false, error: "Please enter a valid website URL." };
  }

  // 1. Strict protocol whitelist
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol.toLowerCase())) {
    return { valid: false, error: "Only HTTP and HTTPS URLs are allowed." };
  }

  // 2. Reject credentials in URL (phishing mitigation)
  if (parsed.username || parsed.password) {
    return { valid: false, error: "URLs containing usernames or passwords are not permitted." };
  }

  // 3. Host validation
  const hostname = parsed.hostname.toLowerCase();
  if (!hostname || hostname.includes("..") || hostname.length > 253) {
    return { valid: false, error: "Invalid domain name." };
  }

  // 4. Disallow raw internal/loopback IPs in submitted website URLs
  if (isBlockedSSRFHost(hostname)) {
    return { valid: false, error: "Target domain must be a publicly accessible host." };
  }

  // Clean canonical URL
  return {
    valid: true,
    url: parsed.href,
    host: hostname.replace(/^www\./, ""),
  };
}

/**
 * Comprehensive SSRF blocker for IPv4, IPv6, loopbacks, link-local, cloud metadata, and internal hostnames.
 */
export function isBlockedSSRFHost(rawHost: string): boolean {
  const host = rawHost.trim().toLowerCase().replace(/^\[|\]$/g, ""); // Strip IPv6 brackets if present

  // 1. Internal Hostnames
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan") ||
    host.endsWith(".corp") ||
    host.endsWith(".test") ||
    host.endsWith(".example") ||
    host.endsWith(".invalid")
  ) {
    return true;
  }

  // 2. Cloud metadata endpoints & Link-Local (AWS/GCP/Azure/DO/etc. 169.254.169.254, metadata.google.internal)
  if (host === "169.254.169.254" || host === "metadata.google.internal" || host.startsWith("169.254.")) {
    return true;
  }

  // 3. IPv4 Loopback and Private Networks (CIDR checks)
  // 127.0.0.0/8 (Loopback)
  // 0.0.0.0/8 (Current network)
  // 10.0.0.0/8 (Private)
  // 100.64.0.0/10 (Shared Carrier NAT)
  // 172.16.0.0/12 (Private)
  // 192.168.0.0/16 (Private)
  // 192.0.0.0/24 (IETF Protocol)
  // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (Documentation)
  // 224.0.0.0/4 (Multicast)
  // 240.0.0.0/4 (Reserved)
  if (
    /^(127\.|0\.|10\.|192\.168\.|169\.254\.|192\.0\.2\.|198\.51\.100\.|203\.0\.113\.)/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\./.test(host) ||
    /^(22[4-9]|23\d|24\d|25[0-5])\./.test(host)
  ) {
    return true;
  }

  // 4. Hex / Octal / Decimal single-integer IP representations (e.g. 2130706433, 0177.0.0.1, 0x7f.1)
  if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host) || /^0[0-7]+(\.|$)/.test(host)) {
    return true;
  }

  // 5. IPv6 Loopback, Link-Local, and Unique Local
  if (
    host === "::1" ||
    host === "::" ||
    host.startsWith("fe80:") ||
    host.startsWith("fc00:") ||
    host.startsWith("fd00:") ||
    host.startsWith("::ffff:127.") ||
    host.startsWith("::ffff:10.") ||
    host.startsWith("::ffff:192.168.")
  ) {
    return true;
  }

  return false;
}

/**
 * Strips non-printable ASCII control characters, normalizes Unicode, trims, and truncates text.
 */
export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  // Normalize Unicode (NFC), strip control characters (except common spaces), trim
  const cleaned = value
    .normalize("NFC")
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
  return cleaned.slice(0, maxLength);
}

/**
 * Validates Twitter / X handle format (alphanumeric + underscores, 1-15 chars).
 */
export function validateSocialHandle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const clean = raw.trim().replace(/^@/, "");
  if (!clean) return null;
  if (/^[A-Za-z0-9_]{1,15}$/.test(clean)) {
    return `@${clean}`;
  }
  return null;
}

/**
 * Validates email format.
 */
export function validateEmail(raw: unknown): boolean {
  if (typeof raw !== "string") return false;
  const clean = raw.trim();
  if (clean.length > 254) return false;
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(clean);
}

/**
 * Computes a privacy-preserving daily rotating visitor hash from IP and Date.
 */
export async function computeVisitorHash(ip: string | null): Promise<string> {
  const visitorIp = ip ?? "anonymous-client";
  const dayKey = new Date().toISOString().slice(0, 10);
  const input = new TextEncoder().encode(`buy1minute-salt:${visitorIp}:${dayKey}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(digest))
    .slice(0, 10)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
