import {
  BookOpen, Landmark, ScrollText, Scroll, Sparkles, HeartHandshake,
  Library, type LucideIcon,
} from "lucide-react";

import imgChumash from "@/assets/collections/chumash.webp";
import imgNeviim from "@/assets/collections/neviim.webp";
import imgKesuvim from "@/assets/collections/kesuvim.webp";
import imgMegillos from "@/assets/collections/megillos.webp";
import imgYamimTovim from "@/assets/collections/yamim-tovim.webp";
import imgMiddos from "@/assets/collections/middos.webp";
import imgComplete from "@/assets/collections/complete.webp";

export interface Collection {
  key: string;
  icon: LucideIcon;
  image: string;
  name: string;
  blurb: string;
  books: string;
  priceUsd: number;
  priceIls: number;
  featured?: boolean;
}

/**
 * Collections become directly buyable as soon as each one has a Shopify product
 * variant to sell. Until a key appears here the bundle builder still works and
 * still totals correctly — it just sends the selection to the admin inbox as a
 * request instead of to Shopify's checkout. Paste the variant GIDs in and the
 * same button starts taking payment; nothing else needs to change.
 */
export const COLLECTION_VARIANT_IDS: Record<string, string | null> = {
  chumash: null,
  neviim: null,
  kesuvim: null,
  megillos: null,
  "yamim-tovim": null,
  middos: null,
  complete: null,
};

export const collectionVariantId = (key: string): string | null =>
  COLLECTION_VARIANT_IDS[key] ?? null;

/** True when every selected collection can actually be charged for. */
export const canCheckoutCollections = (keys: string[]): boolean =>
  keys.length > 0 && keys.every((k) => !!collectionVariantId(k));

// Bundle catalog — front-end only for now (no live checkout). Requests flow
// through the creation wizard in "collection request" mode and land in the
// admin inbox as contact tickets; invoicing + generation are handled by hand.
//
// Book counts match the story catalog (TorahPortions by category) — the Chumash
// 54 is the parshiyos, i.e. the 61 `torah` entries less the 7 combined doubles.
//
// PRICES: the discount deepens with the size of the bundle, from ~$12.99/book on
// the smallest set to ~$9.92/book on the all-in-one, against a $14.99 single.
// The floor is production cost — see PRODUCTION_COST_USD in lib/bookCosts.ts
// ($6.71 all-in for a softcover) — so nothing here may drop near it again: the
// previous table sold Complete at $6.10/book and Chumash at $6.46/book, i.e.
// BELOW what printing them costs. ILS is the Israel presentment price at the
// catalog's ~3.12 rate (matching SINGLE_PRICE/SUB_PRICE), not an FX conversion.
export const COLLECTIONS: Collection[] = [
  { key: "chumash", icon: BookOpen, image: imgChumash, name: "The Chumash Collection", blurb: "Every weekly parsha across all five Chumashim — Bereishis through Devarim — a full year of personalized parsha storybooks.", books: "54 books", priceUsd: 599, priceIls: 1869 },
  { key: "neviim", icon: Landmark, image: imgNeviim, name: "The Nevi'im Collection", blurb: "The heroes and prophets of Tanach — Yehoshua, Shoftim, Shmuel, Melachim and more brought to life for your kinderlach.", books: "25 books", priceUsd: 289, priceIls: 899 },
  { key: "kesuvim", icon: ScrollText, image: imgKesuvim, name: "The Kesuvim Collection", blurb: "Timeless stories and lessons from the Writings — Tehillim, Mishlei, Daniel, Divrei HaYamim and beyond.", books: "21 books", priceUsd: 249, priceIls: 779 },
  { key: "megillos", icon: Scroll, image: imgMegillos, name: "The Megillos Collection", blurb: "All five Megillos — Esther, Rus, Shir HaShirim, Eicha and Koheles — one keepsake set.", books: "5 books", priceUsd: 65, priceIls: 199 },
  { key: "yamim-tovim", icon: Sparkles, image: imgYamimTovim, name: "The Yamim Tovim Collection", blurb: "A story for every Yom Tov — Shabbos, Rosh Hashanah, Yom Kippur, Sukkos, Chanukah, Purim, Pesach, Shavuos and more.", books: "16 books", priceUsd: 189, priceIls: 589 },
  { key: "middos", icon: HeartHandshake, image: imgMiddos, name: "The Middos Collection", blurb: "Character-building adventures — chesed, emes, kibud av va'em, savlanus and more middos tovos.", books: "10 books", priceUsd: 125, priceIls: 389 },
  { key: "complete", icon: Library, image: imgComplete, name: "The Complete Collection", blurb: "The ultimate library — every Chumash, Nevi'im, Kesuvim, Megillos, Yamim Tovim and Middos book, all starring your child. Our very best value.", books: "131 books", priceUsd: 1299, priceIls: 4049, featured: true },
];

export const getCollection = (key: string | null | undefined): Collection | undefined =>
  COLLECTIONS.find((c) => c.key === key);

/** Every collection except the all-in-one, i.e. what "Complete" is made of. */
export const PART_COLLECTIONS = COLLECTIONS.filter((c) => c.key !== "complete");

export const collectionsTotal = (keys: string[], isIls: boolean): number =>
  keys.reduce((sum, k) => {
    const c = getCollection(k);
    return sum + (c ? (isIls ? c.priceIls : c.priceUsd) : 0);
  }, 0);

export const collectionsBookCount = (keys: string[]): number =>
  keys.reduce((sum, k) => sum + (parseInt(getCollection(k)?.books || "0", 10) || 0), 0);

/**
 * What the all-in-one saves against buying its parts separately — a real number
 * from the price table, not a claimed discount.
 */
export const completeSaving = (isIls: boolean): number => {
  const parts = collectionsTotal(PART_COLLECTIONS.map((c) => c.key), isIls);
  const complete = getCollection("complete");
  const whole = complete ? (isIls ? complete.priceIls : complete.priceUsd) : 0;
  return Math.max(0, parts - whole);
};
