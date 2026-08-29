import type { PricingRule } from "./types";

export const DEFAULT_MINUTE_PRICE_CENTS = 100; // $1.00 minimum baseline

const PREMIUM_RULES: PricingRule[] = [
  { minuteIndex: 0, amountCents: null, pricingType: "auction", label: "Midnight (00:00)" },
  { minuteIndex: 260, amountCents: 6_900, pricingType: "fixed", label: "Internet Time (04:20)" },
  { minuteIndex: 427, amountCents: 2_500, pricingType: "fixed", label: "Lucky Seven (07:07)" },
  { minuteIndex: 581, amountCents: 4_100, pricingType: "fixed", label: "Hello World (09:41)" },
  { minuteIndex: 610, amountCents: 3_500, pricingType: "fixed", label: "Perfect Tens (10:10)" },
  { minuteIndex: 671, amountCents: 11_100, pricingType: "fixed", label: "Make a Wish (11:11)" },
  { minuteIndex: 754, amountCents: 5_500, pricingType: "fixed", label: "High Noon (12:34)" },
  { minuteIndex: 817, amountCents: 13_700, pricingType: "fixed", label: "Elite (13:37)" },
  { minuteIndex: 1_439, amountCents: null, pricingType: "auction", label: "Last Minute (23:59)" },
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
    maximumFractionDigits: 0,
  }).format(Math.round(amountCents / 100));
}

/** Convert a whole-dollar bid to cents safely without floating-point errors. */
export function parseDollarAmountToCents(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return null;
  const dollars = Number(normalized);
  if (dollars <= 0 || dollars > 1_000_000) return null;
  const cents = dollars * 100;
  return Number.isSafeInteger(cents) ? cents : null;
}
