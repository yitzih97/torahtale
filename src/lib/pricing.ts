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

/* ───────────────────────────── Shipping ─────────────────────────────
 * Mirrors the Shopify shipping zones, which is what the customer is actually
 * charged. The site has one zone signal — the display currency — so USD is read
 * as the United States zone and ILS as the Israel zone.
 *
 * Standard shipping is NOT free. It was, and the claim survived in a lot of
 * copy after the rates changed; if these numbers move again, grep for
 * "business days" as well as for the prices.
 *
 * VERIFY the ILS figures against the Israel market's presentment price before
 * trusting them: Shopify shows the Israel zone in the shop currency ($5.95 /
 * $10.00) and the shekel amounts here are that converted at the catalogue's
 * ~3.12 rate, not values read back from the Storefront API the way
 * SINGLE_PRICE/SUB_PRICE were.
 */
export type ShippingMethod = "standard" | "express";

/** Price per order. `usd` is the US zone, `ils` the Israel zone. */
export const SHIPPING_PRICE: Record<ShippingMethod, Money> = {
  standard: { usd: 3, ils: 19 },
  express: { usd: 6, ils: 31 },
};

/** Quoted transit time, as a bare range — the "business days" wording is i18n. */
export const SHIPPING_DAYS: Record<ShippingMethod, { us: string; il: string }> = {
  standard: { us: "5–8", il: "9–14" },
  express: { us: "3", il: "5–8" },
};

export const shippingPrice = (method: ShippingMethod, isIls: boolean): number =>
  isIls ? SHIPPING_PRICE[method].ils : SHIPPING_PRICE[method].usd;

export const shippingDays = (method: ShippingMethod, isIls: boolean): string =>
  isIls ? SHIPPING_DAYS[method].il : SHIPPING_DAYS[method].us;

/**
 * Books that one successful charge of each plan entitles — mirrors
 * BOOKS_PER_PERIOD in supabase/functions/_shared/subscription.ts, which is what
 * the release job actually drips.
 */
export const BOOKS_PER_PERIOD: Record<SubPlan, number> = { weekly: 1, monthly: 4, yearly: 52 };

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

/**
 * What the year bundle's 52 books would cost on the monthly plan. Monthly bills
 * per 4 books, so that is THIRTEEN charges, not twelve — comparing a year of
 * monthly billing (48 books) against the bundle (52 books) prices two different
 * baskets and makes the bundle look more expensive than it is.
 */
export const yearlyEquivalentMonthlyCost = (format: string, isIls: boolean): number =>
  subPrice("monthly", format, isIls) * (BOOKS_PER_PERIOD.yearly / BOOKS_PER_PERIOD.monthly);

/* ───────────────────────────── Display ─────────────────────────────
 * Every customer-facing price goes through this. A plain toFixed(2) prints the
 * year bundle as "$1348.98" — four figures with no thousands separator, which
 * reads as a typo on the one screen where the number matters most. Grouping is
 * en-US on purpose: the shekel amounts are presentment prices with a "₪" prefix
 * in this UI, not locale-formatted ILS. */

/** A price with thousands separators and fixed decimals: "$1,099.20". */
export const formatMoney = (
  amount: number, symbol: string, fractionDigits = 2,
): string =>
  `${symbol}${(Number(amount) || 0).toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
