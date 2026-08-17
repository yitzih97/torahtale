import { TORAH_PORTIONS } from "@/components/wizard/TorahPortions";

type Lang = "en" | "he" | "yi";

/**
 * The four series advertised on every back cover, each represented by ONE
 * personalized book — the same kids, in a story from that series — so the reader
 * sees where else their child can star, not just which parsha comes next.
 *
 * The FEATURED portion of each series is what the generator illustrates; the
 * series NAME is resolved from a portion's category (below), so a book generated
 * before this change still gets a correct label for whatever teasers it has.
 */
export const BACK_COVER_SERIES: { key: string; featured: string; category: string }[] = [
  { key: "torah", featured: "noach", category: "torah" },
  { key: "neviim", featured: "david-goliath", category: "neviim" },
  { key: "holiday", featured: "purim", category: "holiday" },
  { key: "middos", featured: "edu-kibud", category: "educational" },
];

/** Series name per portion category, per book language. */
const SERIES_NAME: Record<string, Record<Lang, string>> = {
  torah: { en: "The Torah Series", he: "סדרת התורה", yi: "די תורה סעריע" },
  neviim: { en: "Nevi'im & Kesuvim", he: "נביאים וכתובים", yi: "נביאים און כתובים" },
  ketuvim: { en: "Nevi'im & Kesuvim", he: "נביאים וכתובים", yi: "נביאים און כתובים" },
  megillot: { en: "The Megillos", he: "המגילות", yi: "די מגילות" },
  holiday: { en: "The Holiday Series", he: "סדרת המועדים", yi: "די יום־טוב סעריע" },
  educational: { en: "Inspirational Stories", he: "סיפורי השראה", yi: "מוסר מעשיות" },
};

const categoryOf = (portion: string): string =>
  TORAH_PORTIONS.find((p) => p.value === portion)?.category || "torah";

/**
 * Short titles for the back-cover stacks. The catalogue's own label is written
 * for a picker, not a 2cm thumbnail — "Sefer Shmuel – Dovid & Golias" wrapped
 * onto three lines and collided with the "With <child>" line. These are the
 * same stories, named the way they'd be said aloud.
 *
 * Transliteration follows the house style enforced in the story prompt
 * (Golias, not Goliath).
 */
const SHORT_TITLE: Record<string, Record<Lang, string>> = {
  // Hebrew/Yiddish are deliberately WITHOUT nikud here: on a ~2cm thumbnail the
  // points are illegible anyway, and their ascenders were clipping against the
  // top of the mini cover.
  noach: { en: "Noach", he: "נח", yi: "נח" },
  bereishit: { en: "Bereishis", he: "בראשית", yi: "בראשית" },
  "david-goliath": { en: "Dovid & Golias", he: "דוד וגוליית", yi: "דוד און גליאת" },
  "david-yonatan": { en: "Dovid & Yonasan", he: "דוד ויונתן", yi: "דוד און יונתן" },
  purim: { en: "Purim", he: "פורים", yi: "פורים" },
  chanukah: { en: "Chanukah", he: "חנוכה", yi: "חנוכה" },
  "edu-kibud": { en: "Kibbud Av Va'em", he: "כיבוד אב ואם", yi: "כיבוד אב ואם" },
  "edu-chesed": { en: "A Helping Hand", he: "יד עוזרת", yi: "א העלפנדע האנט" },
};

/** The short back-cover title for a portion, or null to fall back to its full label. */
export const getShortTitle = (portion: string, lang: Lang): string | null =>
  SHORT_TITLE[portion]?.[lang] || SHORT_TITLE[portion]?.en || null;

/** The localized series name for whatever portion a teaser illustrates. */
export const getSeriesName = (portion: string, lang: Lang): string => {
  const set = SERIES_NAME[categoryOf(portion)] || SERIES_NAME.torah;
  return set[lang] || set.en;
};

/**
 * The four portions to illustrate as back-cover teasers: one per series.
 *
 * When the book being made IS the featured title of a series (a Noach book
 * would otherwise advertise Noach), that slot falls back to another story from
 * the same series — the back cover should never sell the book already in the
 * reader's hands.
 */
export const getSeriesPreviewPortions = (currentPortion: string): string[] =>
  BACK_COVER_SERIES.map(({ featured, category }) => {
    if (featured !== currentPortion) return featured;
    const alt = TORAH_PORTIONS.find((p) => p.category === category && p.value !== currentPortion);
    return alt?.value || featured;
  });
