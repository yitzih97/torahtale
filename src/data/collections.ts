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
  /** English name/blurb. `nameHe`/`nameYi` and `blurbHe`/`blurbYi` carry the
   *  translations - read them through collectionName()/collectionBlurb(), which
   *  fall back to English. The English `name` stays the one the ADMIN sees on a
   *  request ticket, whatever language the customer was browsing in. */
  name: string;
  nameHe: string;
  nameYi: string;
  blurb: string;
  blurbHe: string;
  blurbYi: string;
  /** "54 books" - English, and the string collectionsBookCount() parses. Use
   *  collectionBooksLabel() to show it. */
  books: string;
  priceUsd: number;
  priceIls: number;
  featured?: boolean;
}

/**
 * Collections become directly buyable as soon as each one has a Shopify product
 * variant to sell. Until a key appears here the bundle builder still works and
 * still totals correctly - it just sends the selection to the admin inbox as a
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

// Bundle catalog - front-end only for now (no live checkout). Requests flow
// through the creation wizard in "collection request" mode and land in the
// admin inbox as contact tickets; invoicing + generation are handled by hand.
//
// Book counts match the story catalog (TorahPortions by category) - the Chumash
// 54 is the parshiyos, i.e. the 61 `torah` entries less the 7 combined doubles.
//
// PRICES: the discount deepens with the size of the bundle, from ~$12.99/book on
// the smallest set to ~$9.92/book on the all-in-one, against a $14.99 single.
// The floor is production cost - see PRODUCTION_COST_USD in lib/bookCosts.ts
// ($6.71 all-in for a softcover) - so nothing here may drop near it again: the
// previous table sold Complete at $6.10/book and Chumash at $6.46/book, i.e.
// BELOW what printing them costs. ILS is the Israel presentment price at the
// catalog's ~3.12 rate (matching SINGLE_PRICE/SUB_PRICE), not an FX conversion.
export const COLLECTIONS: Collection[] = [
  { key: "chumash", icon: BookOpen, image: imgChumash, name: "The Chumash Collection", nameHe: "אוסף החומש", nameYi: "די חומש זאַמלונג", blurb: "Every weekly parsha across all five Chumashim - Bereishis through Devarim - a full year of personalized parsha storybooks.", blurbHe: "כל פרשות השבוע בחמישה חומשי תורה - מבראשית ועד דברים - שנה שלמה של ספרי פרשה מותאמים אישית.", blurbYi: "אַלע וואָכעדיקע פּרשיות פֿון אַלע פֿינף חומשים - פֿון בראשית ביז דברים - אַ גאַנץ יאָר פּערזענלעכע פּרשה־ביכער.", books: "54 books", priceUsd: 599, priceIls: 1869 },
  { key: "neviim", icon: Landmark, image: imgNeviim, name: "The Nevi'im Collection", nameHe: "אוסף הנביאים", nameYi: "די נביאים זאַמלונג", blurb: "The heroes and prophets of Tanach - Yehoshua, Shoftim, Shmuel, Melachim and more brought to life for your kinderlach.", blurbHe: "הגיבורים והנביאים של התנ״ך - יהושע, שופטים, שמואל, מלכים ועוד - מתעוררים לחיים בשביל הילדים שלכם.", blurbYi: "די העלדן און נביאים פֿון תנ״ך - יהושע, שופטים, שמואל, מלכים און נאָך - לעבעדיק געמאַכט פֿאַר אײַערע קינדערלעך.", books: "25 books", priceUsd: 289, priceIls: 899 },
  { key: "kesuvim", icon: ScrollText, image: imgKesuvim, name: "The Kesuvim Collection", nameHe: "אוסף הכתובים", nameYi: "די כתובים זאַמלונג", blurb: "Timeless stories and lessons from the Writings - Tehillim, Mishlei, Daniel, Divrei HaYamim and beyond.", blurbHe: "סיפורים ולקחים נצחיים מן הכתובים - תהלים, משלי, דניאל, דברי הימים ועוד.", blurbYi: "אייביקע מעשיות און לימודים פֿון די כתובים - תהלים, משלי, דניאל, דברי הימים און נאָך.", books: "21 books", priceUsd: 249, priceIls: 779 },
  { key: "megillos", icon: Scroll, image: imgMegillos, name: "The Megillos Collection", nameHe: "אוסף המגילות", nameYi: "די מגילות זאַמלונג", blurb: "All five Megillos - Esther, Rus, Shir HaShirim, Eicha and Koheles - one keepsake set.", blurbHe: "כל חמש המגילות - אסתר, רות, שיר השירים, איכה וקהלת - סט אחד לשמירה לדורות.", blurbYi: "אַלע פֿינף מגילות - אסתר, רות, שיר השירים, איכה און קהלת - איין סעט צום אָפּהיטן.", books: "5 books", priceUsd: 65, priceIls: 199 },
  { key: "yamim-tovim", icon: Sparkles, image: imgYamimTovim, name: "The Yamim Tovim Collection", nameHe: "אוסף הימים הטובים", nameYi: "די ימים־טובים זאַמלונג", blurb: "A story for every Yom Tov - Shabbos, Rosh Hashanah, Yom Kippur, Sukkos, Chanukah, Purim, Pesach, Shavuos and more.", blurbHe: "סיפור לכל חג - שבת, ראש השנה, יום כיפור, סוכות, חנוכה, פורים, פסח, שבועות ועוד.", blurbYi: "אַ מעשה פֿאַר יעדן יום־טוב - שבת, ראש השנה, יום כיפור, סוכות, חנוכה, פורים, פּסח, שבועות און נאָך.", books: "16 books", priceUsd: 189, priceIls: 589 },
  { key: "middos", icon: HeartHandshake, image: imgMiddos, name: "The Middos Collection", nameHe: "אוסף המידות", nameYi: "די מידות זאַמלונג", blurb: "Character-building adventures - chesed, emes, kibud av va'em, savlanus and more middos tovos.", blurbHe: "הרפתקאות שבונות אופי - חסד, אמת, כיבוד אב ואם, סבלנות ועוד מידות טובות.", blurbYi: "אַוואַנטורעס וואָס בויען דעם כאַראַקטער - חסד, אמת, כיבוד אב ואם, סבלנות און נאָך מידות טובות.", books: "10 books", priceUsd: 125, priceIls: 389 },
  { key: "complete", icon: Library, image: imgComplete, name: "The Complete Collection", nameHe: "האוסף המלא", nameYi: "די גאַנצע זאַמלונג", blurb: "The ultimate library - every Chumash, Nevi'im, Kesuvim, Megillos, Yamim Tovim and Middos book, all starring your child. Our very best value.", blurbHe: "הספרייה השלמה - כל ספרי החומש, הנביאים, הכתובים, המגילות, הימים הטובים והמידות, וכולם עם הילד שלכם בכיכובם. הערך הטוב ביותר שלנו.", blurbYi: "די פֿולע ביבליאָטעק - אַלע חומש, נביאים, כתובים, מגילות, ימים־טובים און מידות ביכער, מיט אײַער קינד אַלס העלד. אונדזער סאַמע בעסטער ווערט.", books: "131 books", priceUsd: 1299, priceIls: 4049, featured: true },
];

export const getCollection = (key: string | null | undefined): Collection | undefined =>
  COLLECTIONS.find((c) => c.key === key);

type Lang = "en" | "he" | "yi";

/** The collection's name in the reader's language (English is the fallback). */
export const collectionName = (c: Collection, lang: Lang): string =>
  (lang === "he" ? c.nameHe : lang === "yi" ? c.nameYi : c.name) || c.name;

/** The collection's blurb in the reader's language (English is the fallback). */
export const collectionBlurb = (c: Collection, lang: Lang): string =>
  (lang === "he" ? c.blurbHe : lang === "yi" ? c.blurbYi : c.blurb) || c.blurb;

/** "54 books" / "54 ספרים" / "54 ביכער". The stored `books` string stays English
 *  because collectionsBookCount() parses its number out. */
export const collectionBooksLabel = (c: Collection, lang: Lang): string => {
  const n = parseInt(c.books, 10) || 0;
  return lang === "he" ? `${n} ספרים` : lang === "yi" ? `${n} ביכער` : c.books;
};

/** Every collection except the all-in-one, i.e. what "Complete" is made of. */
export const PART_COLLECTIONS = COLLECTIONS.filter((c) => c.key !== "complete");

export const collectionsTotal = (keys: string[], isIls: boolean): number =>
  keys.reduce((sum, k) => {
    const c = getCollection(k);
    return sum + (c ? (isIls ? c.priceIls : c.priceUsd) : 0);
  }, 0);

export const collectionsBookCount = (keys: string[]): number =>
  keys.reduce((sum, k) => sum + (parseInt(getCollection(k)?.books || "0", 10) || 0), 0);

/* ─────────────────────────── Cover format ───────────────────────────
 * Listed collection prices are for the 8″×8″ softcover. A different cover is a
 * flat per-BOOK upcharge on top, which is how the rest of the catalogue already
 * prices format: SUB_PRICE in lib/pricing.ts charges the same delta per book on
 * every plan, and the delta narrows as the commitment grows (+$9.00/book on the
 * weekly plan, +$8.50 monthly, +$8.00 yearly for hardcover). A collection is the
 * largest commitment we sell, so it takes the yearly-plan delta.
 *
 * Every combination clears production cost - the thinnest is the Complete
 * Collection in board book at ~42% gross margin (see lib/bookCosts.ts). Keep it
 * that way: these deltas are per book, so a wrong one is wrong 131 times over. */
export type CollectionFormat = "softcover" | "hardcover" | "board" | "coloring";

/** The cover choices offered on a collection, in display order. */
export const COLLECTION_FORMATS: CollectionFormat[] = ["softcover", "hardcover", "board", "coloring"];

export const COLLECTION_FORMAT_UPCHARGE: Record<CollectionFormat, { usd: number; ils: number }> = {
  softcover: { usd: 0, ils: 0 },
  hardcover: { usd: 8, ils: 25 },
  board: { usd: 12, ils: 37 },
  // Derived the same way as the two above: the YEARLY-plan per-book delta over
  // softcover. yearly/52 gives 17.94 softcover vs 19.54 coloring = +1.60 (and
  // +4.96 -> 5 in shekels), which reproduces hardcover's +8 and board's +12
  // exactly, so the ladder stays internally consistent.
  coloring: { usd: 1.6, ils: 5 },
};

export const formatUpcharge = (format: CollectionFormat, isIls: boolean): number => {
  const u = COLLECTION_FORMAT_UPCHARGE[format] ?? COLLECTION_FORMAT_UPCHARGE.softcover;
  return isIls ? u.ils : u.usd;
};

/** What the whole selection costs in a given cover format. */
export const collectionsTotalForFormat = (
  keys: string[], isIls: boolean, format: CollectionFormat,
): number =>
  collectionsTotal(keys, isIls) + formatUpcharge(format, isIls) * collectionsBookCount(keys);

/**
 * What the all-in-one saves against buying its parts separately - a real number
 * from the price table, not a claimed discount.
 */
export const completeSaving = (isIls: boolean): number => {
  const parts = collectionsTotal(PART_COLLECTIONS.map((c) => c.key), isIls);
  const complete = getCollection("complete");
  const whole = complete ? (isIls ? complete.priceIls : complete.priceUsd) : 0;
  return Math.max(0, parts - whole);
};
