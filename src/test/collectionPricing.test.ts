import { describe, it, expect } from "vitest";
import {
  COLLECTIONS,
  collectionBlurb,
  collectionBooksLabel,
  collectionName,
  COLLECTION_FORMATS,
  PART_COLLECTIONS,
  collectionsBookCount,
  collectionsTotal,
  collectionsTotalForFormat,
  completeSaving,
  formatUpcharge,
  type CollectionFormat,
} from "@/data/collections";

/* Production cost per book, mirroring lib/bookCosts.ts (PRODUCTION_COST_USD +
 * $0.04 per generated page including the cover). Duplicated here rather than
 * imported because bookCosts pulls in the wizard's component tree. */
const PROD_USD: Record<CollectionFormat, number> = { softcover: 5.87, hardcover: 8.29, board: 12.18, coloring: 5.90 };
const PAGES: Record<CollectionFormat, number> = { softcover: 20, hardcover: 24, board: 10, coloring: 24 };
const cogs = (f: CollectionFormat) => PROD_USD[f] + 0.04 * (PAGES[f] + 1);

const books = (key: string) => collectionsBookCount([key]);

describe("collection pricing", () => {
  it("never sells a book below what printing it costs", () => {
    // The whole point of the price table: an earlier one sold the Complete
    // Collection at $6.10/book against $6.71 of production cost, losing ~$80 on
    // every order. These are per-BOOK numbers, so an error repeats 131 times.
    for (const c of COLLECTIONS) {
      for (const f of COLLECTION_FORMATS) {
        const perBook = collectionsTotalForFormat([c.key], false, f) / books(c.key);
        expect(perBook, `${c.key} in ${f}`).toBeGreaterThan(cogs(f));
      }
    }
  });

  it("keeps a real margin on every collection and cover", () => {
    for (const c of COLLECTIONS) {
      for (const f of COLLECTION_FORMATS) {
        const perBook = collectionsTotalForFormat([c.key], false, f) / books(c.key);
        const margin = (perBook - cogs(f)) / perBook;
        expect(margin, `${c.key} in ${f}`).toBeGreaterThan(0.25);
      }
    }
  });

  it("discounts a bundle against buying the same books one at a time", () => {
    const SINGLE_USD = 14.99;
    for (const c of COLLECTIONS) {
      const perBook = collectionsTotalForFormat([c.key], false, "softcover") / books(c.key);
      expect(perBook, c.key).toBeLessThan(SINGLE_USD);
    }
  });

  it("makes the all-in-one cheaper than its parts, in both currencies", () => {
    const keys = PART_COLLECTIONS.map((c) => c.key);
    for (const isIls of [false, true]) {
      expect(completeSaving(isIls)).toBeGreaterThan(0);
      expect(collectionsTotal(["complete"], isIls)).toBeLessThan(collectionsTotal(keys, isIls));
    }
    // ...and covers the same books, or "save X" would be comparing two baskets.
    expect(collectionsBookCount(["complete"])).toBe(collectionsBookCount(keys));
  });

  it("charges the cover upcharge per book, not per collection", () => {
    const perBook = formatUpcharge("hardcover", false);
    const base = collectionsTotal(["complete"], false);
    const n = books("complete");
    expect(collectionsTotalForFormat(["complete"], false, "hardcover")).toBe(base + perBook * n);
    // A 131-book bundle must cost more to upgrade than a 5-book one.
    expect(collectionsTotalForFormat(["complete"], false, "hardcover") - base)
      .toBeGreaterThan(collectionsTotalForFormat(["megillos"], false, "hardcover") - collectionsTotal(["megillos"], false));
  });

  it("leaves the listed price alone for softcover", () => {
    const keys = COLLECTIONS.map((c) => c.key);
    for (const isIls of [false, true]) {
      expect(collectionsTotalForFormat(keys, isIls, "softcover")).toBe(collectionsTotal(keys, isIls));
    }
    expect(formatUpcharge("softcover", false)).toBe(0);
  });

  it("prices ILS on the catalogue's presentment rate, not the old collection one", () => {
    // Singles and subscriptions sit at ~3.12 ILS/USD; the previous collection
    // table used ~3.69, quietly charging Israeli buyers ~18% more.
    for (const c of COLLECTIONS) {
      const rate = c.priceIls / c.priceUsd;
      expect(rate, c.key).toBeGreaterThan(3.0);
      expect(rate, c.key).toBeLessThan(3.25);
    }
  });

  it("has a real translation for every collection, not an English fallback", () => {
    for (const c of COLLECTIONS) {
      for (const lang of ["he", "yi"] as const) {
        expect(collectionName(c, lang), `${c.key} name/${lang}`).not.toBe(c.name);
        expect(collectionBlurb(c, lang), `${c.key} blurb/${lang}`).not.toBe(c.blurb);
        expect(collectionName(c, lang).trim().length, `${c.key} name/${lang}`).toBeGreaterThan(0);
        expect(collectionBlurb(c, lang).trim().length, `${c.key} blurb/${lang}`).toBeGreaterThan(0);
      }
      expect(collectionName(c, "en")).toBe(c.name);
      // The book count still has to survive translation - the number is parsed
      // out of the English string, so a broken label would show "0 ספרים".
      for (const lang of ["en", "he", "yi"] as const) {
        expect(collectionBooksLabel(c, lang), `${c.key} books/${lang}`)
          .toContain(String(collectionsBookCount([c.key])));
      }
    }
  });

  it("counts the books it claims to count", () => {
    const parts = PART_COLLECTIONS.reduce((n, c) => n + collectionsBookCount([c.key]), 0);
    expect(parts).toBe(collectionsBookCount(["complete"]));
    expect(collectionsBookCount(["chumash"])).toBe(54);
  });
});
