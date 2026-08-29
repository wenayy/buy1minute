import { getPricingRule } from "./pricing";
import { minuteIndexToTime } from "./time";
import type { MinuteState, OwnedMinute, Product } from "./types";

export const products: Product[] = [
  { id: "linear", name: "Linear", shortName: "LN", websiteUrl: "https://linear.app", tagline: "The issue tracker for modern engineering teams.", description: "Streamline issues, sprints, and product roadmaps in one blazingly fast workspace.", accentColor: "#5e6ad2", visualVariant: "signal", xHandle: "@linear", category: "Dev tools" },
  { id: "vercel", name: "Vercel", shortName: "VC", websiteUrl: "https://vercel.com", tagline: "Ship. Preview. Scale.", description: "The frontend cloud for modern web teams — deploy instantly, scale globally.", accentColor: "#ffffff", visualVariant: "orbit", xHandle: "@vercel", category: "Dev tools" },
  { id: "stripe", name: "Stripe", shortName: "ST", websiteUrl: "https://stripe.com", tagline: "Financial infrastructure for the internet.", description: "Millions of businesses use Stripe to accept payments and manage revenue online.", accentColor: "#635bff", visualVariant: "grid", xHandle: "@stripe", category: "Payments" },
  { id: "notion", name: "Notion", shortName: "NO", websiteUrl: "https://notion.so", tagline: "The connected workspace.", description: "Docs, wikis, projects, and AI in one collaborative space your whole team will love.", accentColor: "#ffffff", visualVariant: "type", xHandle: "@notionhq", category: "Productivity" },
  { id: "figma", name: "Figma", shortName: "FG", websiteUrl: "https://figma.com", tagline: "How teams build modern products.", description: "The collaborative interface design and prototyping tool where design meets code.", accentColor: "#f24e1e", visualVariant: "wave", xHandle: "@figma", category: "Design" },
  { id: "raycast", name: "Raycast", shortName: "RC", websiteUrl: "https://raycast.com", tagline: "Your shortcut to everything.", description: "An ultra-fast, extensible launcher that gives you superpowers at your fingertips.", accentColor: "#ff6363", visualVariant: "signal", xHandle: "@raycastapp", category: "Productivity" },
  { id: "supabase", name: "Supabase", shortName: "SB", websiteUrl: "https://supabase.com", tagline: "The open source Firebase alternative.", description: "Build production backends in minutes with Postgres, Auth, Realtime, and Edge Functions.", accentColor: "#3ecf8e", visualVariant: "grid", xHandle: "@supabase", category: "Dev tools" },
  { id: "anthropic", name: "Anthropic", shortName: "AN", websiteUrl: "https://anthropic.com", tagline: "AI research and steerable intelligence.", description: "Makers of Claude — pioneering safe, helpful, and highly intelligent AI systems.", accentColor: "#d97757", visualVariant: "grid", xHandle: "@anthropicai", category: "AI" },
  { id: "cloudflare", name: "Cloudflare", shortName: "CF", websiteUrl: "https://cloudflare.com", tagline: "Building a better internet.", description: "Security, edge computing, and ultra-low latency infrastructure for everyone.", accentColor: "#f6821f", visualVariant: "type", xHandle: "@cloudflare", category: "Infrastructure" },
  { id: "github", name: "GitHub", shortName: "GH", websiteUrl: "https://github.com", tagline: "Where the world builds software.", description: "The global developer platform for version control, collaboration, and open source.", accentColor: "#ffffff", visualVariant: "orbit", xHandle: "@github", category: "Dev tools" },
];

const DEMO_DATA_ENABLED = false;

export const seededOwnerships: OwnedMinute[] = (() => {
  const owners: OwnedMinute[] = [];
  if (!DEMO_DATA_ENABLED) return owners;
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
