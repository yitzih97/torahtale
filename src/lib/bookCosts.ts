import { PAGES_BY_TYPE, type BookOptions } from "@/components/wizard/BookOptionsStep";

/**
 * Estimated production cost of goods sold (COGS) per book — admin-only.
 *
 * Printify production costs pulled live from the District Photo blueprints
 * (see project pricing work): the printed book plus an estimated AI image cost
 * (~$0.04 per generated page incl. cover via Gemini Flash Image). These are
 * ESTIMATES for margin insight — revenue and payment figures shown alongside
 * come from Shopify and are exact. Shipping is excluded (the customer pays it).
 */
const PRODUCTION_COST_USD: Record<BookOptions["productType"], number> = {
  softcover: 5.87,
  hardcover: 8.29,
  board: 12.18,
  coloring: 5.90,
};

const AI_COST_PER_PAGE_USD = 0.04;

type ProductType = BookOptions["productType"];

/** Resolve the book's product type from the stored order/story options. */
export function getProductType(book: any): ProductType {
  const pt: string | undefined =
    book?.shipping_data?.bookOptions?.productType ??
    book?.story_data?.bookOptions?.productType;
  if (pt === "softcover" || pt === "hardcover" || pt === "board" || pt === "coloring") return pt;
  return "softcover";
}

/** Estimated COGS in USD for a given book (production + AI generation). */
export function getCogs(book: any): number {
  const pt = getProductType(book);
  const pages = PAGES_BY_TYPE[pt] ?? 20;
  let cogs = PRODUCTION_COST_USD[pt] + AI_COST_PER_PAGE_USD * (pages + 1); // +1 = cover
  // A bundled standalone coloring book adds its own production cost.
  if (book?.shipping_data?.bookOptions?.coloringBook) cogs += PRODUCTION_COST_USD.coloring;
  return Math.round(cogs * 100) / 100;
}

/** Profit = revenue (what the customer paid, ex-shipping) − estimated COGS. */
export function getProfit(revenueUsd: number, book: any): number {
  return Math.round((revenueUsd - getCogs(book)) * 100) / 100;
}
