export interface TorahOption {
  value: string;
  label: string;
  sub: string;
  category: "torah" | "neviim" | "ketuvim" | "megillot" | "holiday" | "educational";
  book?: string;
  emoji?: string;
  /** Lucide icon name (from the wizard icon registry) shown instead of an emoji. */
  icon?: string;
}

import { TORAH_PORTIONS_DATA, PARSHA_CALENDAR_DATA } from "./torahData.mjs";

/** Every story a customer can order, in wizard display order. Data lives in
 *  ./torahData.mjs so the Node-side blog agent can read the same list. */
export const TORAH_PORTIONS: TorahOption[] = TORAH_PORTIONS_DATA as TorahOption[];

export const TORAH_BOOKS = ["Bereishit", "Shemot", "Vayikra", "Bamidbar", "Devarim"] as const;

/** Bilingual sefer titles for the Torah books - shown as accordion headers. */
export const TORAH_BOOK_LABELS: Record<string, { en: string; he: string }> = {
  Bereishit: { en: "Sefer Bereishis", he: "ספר בראשית" },
  Shemot: { en: "Sefer Shemos", he: "ספר שמות" },
  Vayikra: { en: "Sefer Vayikra", he: "ספר ויקרא" },
  Bamidbar: { en: "Sefer Bamidbar", he: "ספר במדבר" },
  Devarim: { en: "Sefer Devarim", he: "ספר דברים" },
};

/** Sifrei Nevi'im, in order - used to group the Nevi'im list into accordions. */
export const NEVIIM_BOOKS = ["Yehoshua", "Shoftim", "Shmuel", "Melachim", "Yeshayahu", "Yirmiyahu", "Yechezkel", "Trei Asar"] as const;

/** Sifrei Kesuvim (excluding the Megillos, which are their own category). */
export const KETUVIM_BOOKS = ["Tehillim", "Mishlei", "Iyov", "Daniel", "Ezra", "Nechemia", "Divrei HaYamim"] as const;

/** Bilingual sefer titles for Nevi'im + Kesuvim accordion headers. */
const NEVIIM_KETUVIM_BOOK_LABELS: Record<string, { en: string; he: string }> = {
  Yehoshua: { en: "Sefer Yehoshua", he: "ספר יהושע" },
  Shoftim: { en: "Sefer Shoftim", he: "ספר שופטים" },
  Shmuel: { en: "Sefer Shmuel", he: "ספר שמואל" },
  Melachim: { en: "Sefer Melachim", he: "ספר מלכים" },
  Yeshayahu: { en: "Sefer Yeshayahu", he: "ספר ישעיהו" },
  Yirmiyahu: { en: "Sefer Yirmiyahu", he: "ספר ירמיהו" },
  Yechezkel: { en: "Sefer Yechezkel", he: "ספר יחזקאל" },
  "Trei Asar": { en: "Trei Asar", he: "תרי עשר" },
  Tehillim: { en: "Sefer Tehillim", he: "ספר תהלים" },
  Mishlei: { en: "Sefer Mishlei", he: "ספר משלי" },
  Iyov: { en: "Sefer Iyov", he: "ספר איוב" },
  Daniel: { en: "Sefer Daniel", he: "ספר דניאל" },
  Ezra: { en: "Sefer Ezra", he: "ספר עזרא" },
  Nechemia: { en: "Sefer Nechemia", he: "ספר נחמיה" },
  "Divrei HaYamim": { en: "Sefer Divrei HaYamim", he: "ספר דברי הימים" },
};

/** All sefer labels (Torah + Nevi'im + Kesuvim) keyed by `book`. */
export const BOOK_LABELS: Record<string, { en: string; he: string }> = {
  ...TORAH_BOOK_LABELS,
  ...NEVIIM_KETUVIM_BOOK_LABELS,
};

/**
 * Which categories drill down into per-sefer accordions, and in what order.
 * Categories mapped to `null` render as a flat grid of stories.
 */
export const CATEGORY_BOOKS: Record<TorahOption["category"], readonly string[] | null> = {
  torah: TORAH_BOOKS,
  neviim: NEVIIM_BOOKS,
  ketuvim: KETUVIM_BOOKS,
  megillot: null,
  holiday: null,
  educational: null,
};

export const CATEGORY_META: Record<TorahOption["category"], { label: string; labelHe: string; emoji: string; icon: string }> = {
  torah: { label: "Torah", labelHe: "תורה", emoji: "📜", icon: "Scroll" },
  neviim: { label: "Nevi'im", labelHe: "נביאים", emoji: "⚔️", icon: "Megaphone" },
  ketuvim: { label: "Kesuvim", labelHe: "כתובים", emoji: "✍️", icon: "PenLine" },
  megillot: { label: "Megillos", labelHe: "מגילות", emoji: "📖", icon: "ScrollText" },
  holiday: { label: "Yamim Tovim", labelHe: "ימים טובים", emoji: "🕯️", icon: "Sparkles" },
  educational: { label: "Educational Stories", labelHe: "סיפורים חינוכיים", emoji: "🌟", icon: "Lightbulb" },
};

/**
 * Story title with the leading "Sefer X - " (or "Tehillim - ", etc.) removed -
 * used inside a sefer accordion, where the header already names the sefer.
 * Returns the text unchanged when there is no " - " separator (e.g. Torah parshiyos).
 */
export const stripSeferPrefix = (text: string): string => {
  const idx = text.indexOf(" - ");
  return idx >= 0 ? text.slice(idx + 3) : text;
};

export const getPortionLabel = (value: string): string => {
  const found = TORAH_PORTIONS.find((p) => p.value === value);
  return found ? `${found.label} / ${found.sub}` : value;
};

/** Capitalize first letter of fallback slug, replacing dashes with spaces. */
const prettifySlug = (value: string): string =>
  value
    .split("-")
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(" ");

/** Language-aware display: English label for "en", Hebrew sub for "he"/"yi". */
/** Map a book's stored `language` ("english" | "hebrew" | "yiddish") to the
 *  short display code + text direction. Book text (incl. the cover) must follow
 *  the BOOK's own language, not the viewer's UI language. */
/** The languages selected for a book, parsed from the (possibly "+"-joined)
 *  language string - e.g. "hebrew+yiddish", "english+hebrew", "yiddish". */
const bookLanguageParts = (language?: string | null): string[] =>
  (language || "").toLowerCase().split(/[+,/|\s]+/).filter(Boolean);

/** The book's PREMIER (default) language - the one all of its baked text (cover,
 *  captions, questions) renders in. **English always wins when it is one of the
 *  selected languages**; otherwise the first Hebrew/Yiddish selection is used.
 *  Robust to the "+"-joined multi-language string and to selection order. */
export const bookLanguageCode = (language?: string | null): "en" | "he" | "yi" => {
  const parts = bookLanguageParts(language);
  if (parts.some((p) => p.startsWith("en"))) return "en";
  for (const p of parts) {
    if (p.startsWith("he")) return "he";
    if (p.startsWith("yi")) return "yi";
  }
  return "en";
};

/** A book reads right-to-left only when it is Hebrew and/or Yiddish with NO
 *  English. A mixed book that includes English stays LTR (English leads the
 *  layout), regardless of the order the languages were selected in. */
export const isBookRtl = (language?: string | null): boolean => {
  const parts = bookLanguageParts(language);
  const has = (pfx: string) => parts.some((p) => p.startsWith(pfx));
  return (has("he") || has("yi")) && !has("en");
};

export const getPortionDisplay = (value: string, lang: "en" | "he" | "yi"): string => {
  if (!value) return "";
  const found = TORAH_PORTIONS.find((p) => p.value === value);
  if (!found) return prettifySlug(value);
  return lang === "en" ? found.label : found.sub;
};

/**
 * Weekly Torah portion reading schedule.
 * Maps a Saturday date (YYYY-MM-DD) to the parsha value(s) read that Shabbat.
 */
const PARSHA_CALENDAR: Record<string, string> = PARSHA_CALENDAR_DATA;

/**
 * Returns the parsha read `leadWeeks` weeks after `from` (default: 3 weeks from
 * now, the production lead time). Pass a future Monday to find the portion a
 * subscription book released that day will cover - mirrors the server-side
 * supabase/functions/_shared/parsha.ts used by the release job.
 */
export const getUpcomingParsha = (from: Date = new Date(), leadWeeks = 3): string => {
  const daysUntilSat = (6 - from.getDay() + 7) % 7 || 7;
  const targetSat = new Date(from);
  targetSat.setDate(from.getDate() + daysUntilSat + leadWeeks * 7);
  const key = targetSat.toISOString().slice(0, 10);

  if (PARSHA_CALENDAR[key]) return PARSHA_CALENDAR[key];

  const allDates = Object.keys(PARSHA_CALENDAR).sort();
  const future = allDates.find(d => d >= key);
  if (future) return PARSHA_CALENDAR[future];

  return "bereishit";
};

/**
 * Modest outfit change-ups for the back-cover teaser thumbnails - each teaser
 * re-dresses the kids differently so the "coming next" row looks varied and
 * attractive. Mirrors PREVIEW_OUTFITS in supabase/functions/generate-book.
 */
export const PREVIEW_OUTFITS = [
  "festive Shabbos best - boys in a navy vest over a crisp white shirt, girls in an elegant navy-and-cream long-sleeved dress",
  "warm autumn knits - boys in a rust-brown sweater, girls in a mustard-gold long-sleeved dress with a cozy cream cardigan",
  "fresh spring colors - boys in a soft sage-green shirt, girls in a blush-pink long-sleeved floral dress",
  "royal celebration - boys in a burgundy sweater-vest over a white shirt, girls in a deep burgundy velvet long-sleeved dress with delicate gold trim",
];

/**
 * The stories to tease on a book's back cover (to drive subscriptions): for a
 * Megilla, the OTHER Megillos; otherwise the next few upcoming weekly parshiyos.
 * Returns up to `count` { value, label } entries, never including the current one.
 */
export const getBackCoverPreviewPortions = (
  currentPortion: string,
  lang: "en" | "he" | "yi" = "en",
  count = 4,
  from: Date = new Date(),
): { value: string; label: string }[] => {
  const current = TORAH_PORTIONS.find((p) => p.value === currentPortion);
  const out: { value: string; label: string }[] = [];
  const push = (value: string) => {
    if (value && value !== currentPortion && !out.some((o) => o.value === value)) {
      out.push({ value, label: getPortionDisplay(value, lang) });
    }
  };
  if (current?.category === "megillot") {
    for (const p of TORAH_PORTIONS) {
      if (out.length >= count) break;
      if (p.category === "megillot") push(p.value);
    }
  } else {
    let d = new Date(from);
    for (let guard = 0; out.length < count && guard < 120; guard++) {
      push(getUpcomingParsha(d, 0));
      d = new Date(d);
      d.setDate(d.getDate() + 7);
    }
  }
  return out.slice(0, count);
};

// ── Weekly parsha rollover: Wednesday 12:00 PM Eastern ─────────────────────
// The wizard's auto-selected parsha rolls over every Wednesday at noon ET and
// the on-screen countdown ticks toward that moment. We derive the Eastern wall
// clock of any instant via toLocaleString (DST-safe, no date library): `et` is a
// Date whose LOCAL fields mirror the America/New_York clock, and `offset`
// converts an ET-wall-clock Date back into a real UTC instant.
const easternClock = (d: Date): { et: Date; offset: number } => {
  const et = new Date(d.toLocaleString("en-US", { timeZone: "America/New_York" }));
  return { et, offset: d.getTime() - et.getTime() };
};

/**
 * The order-by deadline shown on the wizard's countdown: the NEXT Wednesday
 * 12:00 PM ET rollover, so the countdown is always within a week (a rolling
 * ≤7-day cadence). The production runway lives in the TARGET - getCurrentParsha
 * delivers the Shabbos 10 days after this deadline, which is exactly 7 business
 * days (Thu, Fri, Mon-Fri) - so the countdown stays short without promising a
 * Shabbos we cannot print and ship for.
 */
export const getNextParshaRollover = (from: Date = new Date()): Date => {
  const { et, offset } = easternClock(from);
  const target = new Date(et);
  target.setDate(et.getDate() + ((3 - et.getDay() + 7) % 7)); // next Wednesday (Wed = 3)
  target.setHours(12, 0, 0, 0);
  if (target.getTime() <= et.getTime()) target.setDate(target.getDate() + 7);
  return new Date(target.getTime() + offset);
};

/** Business days a book needs between the order deadline and Shabbos delivery. */
export const PRINT_LEAD_BUSINESS_DAYS = 7;

/**
 * The parsha to offer in the creation wizard.
 *
 * It is anchored on the DEADLINE the customer is actually being counted down to
 * - the next Wednesday-noon-ET rollover - and then set 10 days later, which is
 * exactly PRINT_LEAD_BUSINESS_DAYS business days (Thu, Fri, Mon, Tue, Wed, Thu,
 * Fri) to print and ship.
 *
 * It used to anchor on the MOST RECENT rollover instead, which was a week short:
 * a customer ordering right on the deadline was being promised a Shabbos only
 * three days away. Anchoring on the next rollover is what makes the offered
 * parsha "next week's" rather than this week's.
 *
 * e.g. Mon 2026-08-17 → deadline Wed 08-19 noon ET → Shabbos 08-29 → ki-tavo
 * (not ki-teitzei, whose Shabbos 08-22 could not be printed and shipped in time).
 */
export const getCurrentParsha = (from: Date = new Date()): string => {
  const { et } = easternClock(getNextParshaRollover(from));
  const sat = new Date(et);
  sat.setDate(et.getDate() + 10);
  const pad = (n: number) => String(n).padStart(2, "0");
  const key = `${sat.getFullYear()}-${pad(sat.getMonth() + 1)}-${pad(sat.getDate())}`;

  if (PARSHA_CALENDAR[key]) return PARSHA_CALENDAR[key];
  const future = Object.keys(PARSHA_CALENDAR).sort().find((d) => d >= key);
  return future ? PARSHA_CALENDAR[future] : "bereishit";
};
