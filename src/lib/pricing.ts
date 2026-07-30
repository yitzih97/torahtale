// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL PRICING — the single source of truth for every price shown on the
// site. These MUST match the live Shopify product variants (that's what the
// customer actually pays at checkout). If a Shopify price changes, update it
// HERE and every surface follows.
//
// Verified against the Shopify Storefront API (store cnhtj8-x9) — USD is the shop
// currency; ILS is the Israel market presentment price (NOT a currency-rate
// conversion, so use these exact numbers rather than usd × rate).
// ─────────────────────────────────────────────────────────────────────────────

export type BookFormat = "softcover" | "hardcover" | "board" | "coloring";
export type SubPlan = "weekly" | "monthly" | "yearly";

interface Money { usd: number; ils: number }

/** One-time single-book price per format. */
export const SINGLE_PRICE: Record<BookFormat, Money> = {
  softcover: { usd: 14.99, ils: 47 },
  hardcover: { usd: 24.99, ils: 78 },
  board:     { usd: 29.99, ils: 94 },
  coloring:  { usd: 16.99, ils: 53 },
};

/** Recurring subscription price per plan × format (the amount billed each cycle). */
export const SUB_PRICE: Record<SubPlan, Record<BookFormat, Money>> = {
  weekly: {
    softcover: { usd: 19.44, ils: 61 },
    hardcover: { usd: 28.44, ils: 89 },
    board:     { usd: 32.94, ils: 103 },
    coloring:  { usd: 21.24, ils: 66 },
  },
  monthly: {
    softcover: { usd: 74.77, ils: 233 },
    hardcover: { usd: 108.77, ils: 338 },
    board:     { usd: 125.77, ils: 391 },
    coloring:  { usd: 81.57, ils: 254 },
  },
  yearly: {
    softcover: { usd: 932.98, ils: 2898 },
    hardcover: { usd: 1348.98, ils: 4190 },
    board:     { usd: 1556.98, ils: 4836 },
    coloring:  { usd: 1016.18, ils: 3156 },
  },
};

const asFormat = (f: string): BookFormat =>
  f === "hardcover" || f === "board" || f === "coloring" ? f : "softcover";

/** One-time price for a format in the active currency. */
export const singlePrice = (format: string, isIls: boolean): number => {
  const m = SINGLE_PRICE[asFormat(format)];
  return isIls ? m.ils : m.usd;
};

/** Subscription price for a plan + format in the active currency. */
export const subPrice = (plan: SubPlan, format: string, isIls: boolean): number => {
  const m = SUB_PRICE[plan][asFormat(format)];
  return isIls ? m.ils : m.usd;
};
