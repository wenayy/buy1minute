export type PricingType = "standard" | "fixed" | "auction";

export type PricingRule = {
  minuteIndex: number;
  amountCents: number | null;
  pricingType: PricingType;
  label?: string;
};

export type Product = {
  id: string;
  name: string;
  shortName: string;
  websiteUrl: string;
  tagline: string;
  description: string;
  accentColor: string;
  visualVariant: "orbit" | "grid" | "signal" | "type" | "wave";
  xHandle?: string;
  category?: string;
};

export type OwnedMinute = {
  minuteIndex: number;
  product: Product;
  ownedSince: string;
  purchasePriceCents: number;
  pageViews: number;
  takeoverImpressions: number;
  outboundClicks: number;
};

export type MinuteState = {
  minuteIndex: number;
  time: string;
  status: "available" | "owned" | "auction";
  priceCents: number | null;
  pricingLabel?: string;
  owner?: OwnedMinute;
};

