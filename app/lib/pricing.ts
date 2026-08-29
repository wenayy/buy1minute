import type { PricingRule } from "./types";

export const DEFAULT_MINUTE_PRICE_CENTS = 100;

const PREMIUM_RULES: PricingRule[] = [
  { minuteIndex: 0, amountCents: null, pricingType: "auction", label: "Midnight" },
  { minuteIndex: 260, amountCents: 6_900, pricingType: "fixed", label: "Internet time" },
  { minuteIndex: 427, amountCents: 2_500, pricingType: "fixed", label: "Lucky seven" },
  { minuteIndex: 581, amountCents: 4_100, pricingType: "fixed", label: "Hello, world" },
  { minuteIndex: 610, amountCents: 3_500, pricingType: "fixed", label: "Perfect tens" },
  { minuteIndex: 671, amountCents: 11_100, pricingType: "fixed", label: "Make a wish" },
  { minuteIndex: 754, amountCents: 5_500, pricingType: "fixed", label: "Sequence" },
  { minuteIndex: 817, amountCents: 13_700, pricingType: "fixed", label: "Elite" },
  { minuteIndex: 1_439, amountCents: null, pricingType: "auction", label: "Last minute" },
];

const PREMIUM_MAP = new Map(PREMIUM_RULES.map((rule) => [rule.minuteIndex, rule]));

export function getPricingRule(minuteIndex: number): PricingRule {
  return (
    PREMIUM_MAP.get(minuteIndex) ?? {
      minuteIndex,
      amountCents: DEFAULT_MINUTE_PRICE_CENTS,
      pricingType: "standard",
    }
  );
}

export function getCheckoutTotal(indices: number[]): number | null {
  let total = 0;
  for (const index of indices) {
    const rule = getPricingRule(index);
    if (rule.amountCents === null) return null;
    total += rule.amountCents;
  }
  return total;
}

export function formatPrice(amountCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amountCents % 100 === 0 ? 0 : 2,
  }).format(amountCents / 100);
}

/** Convert a user-entered USD amount to cents without floating-point rounding. */
export function parseDollarAmountToCents(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return null;
  const [dollars, fractional = ""] = normalized.split(".");
  const cents = Number(dollars) * 100 + Number(fractional.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}
