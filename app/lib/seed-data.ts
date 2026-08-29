import { getPricingRule } from "./pricing";
import { minuteIndexToTime } from "./time";
import type { MinuteState, OwnedMinute, Product } from "./types";

// Demo brands use real domains so the auto-fetched favicon renders in previews.
const products: Product[] = [
  { id: "linear", name: "Linear", shortName: "LN", websiteUrl: "https://linear.app", tagline: "The tool for modern software teams.", description: "Streamline issues, sprints, and product roadmaps in one fast, keyboard-first workspace.", accentColor: "#8d95f2", visualVariant: "signal", xHandle: "linear", category: "Dev tools" },
  { id: "vercel", name: "Vercel", shortName: "VC", websiteUrl: "https://vercel.com", tagline: "Ship. Preview. Scale.", description: "The platform for frontend developers — deploy in seconds, scale to millions.", accentColor: "#ededed", visualVariant: "orbit", xHandle: "vercel", category: "Dev tools" },
  { id: "stripe", name: "Stripe", shortName: "ST", websiteUrl: "https://stripe.com", tagline: "Payments infrastructure for the internet.", description: "Millions of businesses of all sizes use Stripe to accept payments and grow revenue.", accentColor: "#7a73ff", visualVariant: "grid", xHandle: "stripe", category: "Payments" },
  { id: "notion", name: "Notion", shortName: "NO", websiteUrl: "https://notion.so", tagline: "One workspace. Every team.", description: "Docs, wikis, and projects in one connected place your whole team can share.", accentColor: "#edeae3", visualVariant: "type", xHandle: "notion", category: "Productivity" },
  { id: "figma", name: "Figma", shortName: "FG", websiteUrl: "https://figma.com", tagline: "Nothing great is made alone.", description: "The collaborative interface design tool where teams create together in real time.", accentColor: "#ff7262", visualVariant: "wave", xHandle: "figma", category: "Design" },
  { id: "raycast", name: "Raycast", shortName: "RC", websiteUrl: "https://raycast.com", tagline: "Your shortcut to everything.", description: "A blazingly fast, extendable launcher that lets you complete tasks and run scripts.", accentColor: "#ff6363", visualVariant: "signal", xHandle: "raycast", category: "Productivity" },
  { id: "supabase", name: "Supabase", shortName: "SB", websiteUrl: "https://supabase.com", tagline: "Build in a weekend. Scale to millions.", description: "The open source Firebase alternative with Postgres, auth, storage, and edge functions.", accentColor: "#3ecf8e", visualVariant: "grid", xHandle: "supabase", category: "Dev tools" },
  { id: "github", name: "GitHub", shortName: "GH", websiteUrl: "https://github.com", tagline: "Where the world builds software.", description: "Home to millions of developers and the world's most popular open-source projects.", accentColor: "#d0d7de", visualVariant: "orbit", xHandle: "github", category: "Dev tools" },
  { id: "framer", name: "Framer", shortName: "FR", websiteUrl: "https://framer.com", tagline: "Design and publish stunning sites.", description: "The web builder for creative pros — design, animate, and ship without code.", accentColor: "#4da2ff", visualVariant: "wave", xHandle: "framer", category: "Design" },
  { id: "cloudflare", name: "Cloudflare", shortName: "CF", websiteUrl: "https://cloudflare.com", tagline: "Helping build a better internet.", description: "Security, performance, and reliability for anything connected to the internet.", accentColor: "#f6821f", visualVariant: "type", xHandle: "cloudflare", category: "Infrastructure" },
  { id: "loom", name: "Loom", shortName: "LO", websiteUrl: "https://loom.com", tagline: "Say it with video.", description: "Async video messaging for work — record your screen and camera in one click.", accentColor: "#8b87ff", visualVariant: "signal", xHandle: "loom", category: "Video" },
  { id: "anthropic", name: "Anthropic", shortName: "AN", websiteUrl: "https://anthropic.com", tagline: "AI research and products that put safety first.", description: "Makers of Claude — building reliable, interpretable, and steerable AI systems.", accentColor: "#d97757", visualVariant: "grid", xHandle: "anthropicai", category: "AI" },
];

// Keep the fresh-production experience empty while real listings are added through checkout.
// Set to true later if a local visual demo dataset is needed again.
const DEMO_DATA_ENABLED = false;

// Deterministic pseudo-random in [0,1) so the demo data is stable across renders.
function rand(seed: number): number {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

// Populate a large, spread-out share of the day with demo brands so every
// minute you browse looks alive (roughly 40% owned, the rest claimable).
export const seededOwnerships: OwnedMinute[] = (() => {
  const owners: OwnedMinute[] = [];
  if (!DEMO_DATA_ENABLED) return owners;
  for (let minuteIndex = 0; minuteIndex < 1_440; minuteIndex += 1) {
    if (getPricingRule(minuteIndex).pricingType === "auction") continue; // leave auction minutes open
    if ((minuteIndex * 2 + 1) % 5 !== 0) continue; // ~40% of minutes owned, evenly spread
    const product = products[minuteIndex % products.length];
    const bidDollars = 40 + Math.floor(rand(minuteIndex * 1.13 + 2) * 461); // $40–$500
    owners.push({
      minuteIndex,
      product,
      ownedSince: new Date(Date.UTC(2026, 7, 1 + (minuteIndex % 27))).toISOString(),
      purchasePriceCents: bidDollars * 100,
      pageViews: 500 + Math.floor(rand(minuteIndex * 2.7 + 5) * 6_000),
      takeoverImpressions: 1_500 + Math.floor(rand(minuteIndex * 3.9 + 7) * 16_000),
      outboundClicks: 150 + Math.floor(rand(minuteIndex * 5.1 + 9) * 9_000),
    });
  }
  return owners;
})();

export const ownershipByMinute = new Map(
  seededOwnerships.map((ownership) => [ownership.minuteIndex, ownership]),
);

export function getMinuteState(minuteIndex: number): MinuteState {
  const normalized = ((minuteIndex % 1_440) + 1_440) % 1_440;
  const owner = ownershipByMinute.get(normalized);
  const pricing = getPricingRule(normalized);
  return {
    minuteIndex: normalized,
    time: minuteIndexToTime(normalized),
    status: owner ? "owned" : pricing.pricingType === "auction" ? "auction" : "available",
    priceCents: pricing.amountCents,
    pricingLabel: pricing.label,
    owner,
  };
}

export const allMinutes: MinuteState[] = Array.from({ length: 1_440 }, (_, index) =>
  getMinuteState(index),
);
