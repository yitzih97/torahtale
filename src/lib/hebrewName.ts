/* Rendering a child's name on a Hebrew/Yiddish book cover.
 *
 * New books get an accurate Hebrew/Yiddish spelling straight from the story LLM
 * (which writes the whole book — including the child's name — in the target
 * script). `localizedCoverName` prefers that when present. For older books (or
 * any book missing the field) it falls back to `transliterateToHebrew`, a simple
 * rule-based Latin→Hebrew transliteration: good enough for common names, and
 * always better than a Latin name sitting on an otherwise all-Hebrew cover. */

const HEBREW_RE = /[֐-׿]/;

// Final-letter (sofit) forms, applied to the LAST consonant of a word.
const SOFIT: Record<string, string> = { "מ": "ם", "נ": "ן", "צ": "ץ", "פ": "ף", "כ": "ך" };

// Longest-match first. Digraphs before single letters.
const MAP: Array<[string, string]> = [
  ["tz", "צ"], ["ts", "צ"], ["sch", "ש"], ["sh", "ש"], ["ch", "ח"], ["kh", "כ"],
  ["ph", "פ"], ["th", "ת"], ["ck", "ק"], ["ee", "י"], ["oo", "ו"], ["ou", "ו"],
  ["ai", "יי"], ["ay", "יי"], ["ei", "יי"], ["ie", "י"], ["ya", "יא"], ["yo", "יו"],
  ["a", "א"], ["b", "ב"], ["c", "ק"], ["d", "ד"], ["e", ""], ["f", "פ"], ["g", "ג"],
  ["h", "ה"], ["i", "י"], ["j", "ג"], ["k", "ק"], ["l", "ל"], ["m", "מ"], ["n", "נ"],
  ["o", "ו"], ["p", "פ"], ["q", "ק"], ["r", "ר"], ["s", "ס"], ["t", "ט"], ["u", "ו"],
  ["v", "ב"], ["w", "ו"], ["x", "קס"], ["y", "י"], ["z", "ז"],
];

/** Transliterate one Latin name into Hebrew letters. A leading vowel gets an
 *  aleph so the word doesn't start bare; medial/final "e" is dropped the way
 *  Hebrew omits most vowels (Ari→ארי, Esther→אסתר). Idempotent: a name already
 *  in Hebrew is returned untouched. */
function transliterateWord(word: string): string {
  const w = word.trim().toLowerCase();
  if (!w) return "";
  let out = "";
  for (let i = 0; i < w.length; ) {
    let matched = false;
    for (const [lat, heb] of MAP) {
      if (w.startsWith(lat, i)) {
        // A word-initial "e" still needs an aleph so it isn't swallowed.
        out += lat === "e" && i === 0 ? "א" : heb;
        i += lat.length;
        matched = true;
        break;
      }
    }
    if (!matched) i += 1; // skip unmappable char (apostrophes, hyphens, etc.)
  }
  // Apply the final-letter form to the last consonant.
  const last = out.slice(-1);
  if (SOFIT[last]) out = out.slice(0, -1) + SOFIT[last];
  return out;
}

/** Transliterate a full cover name — possibly several children ("Adina & Ari")
 *  — into Hebrew, joining extra names with a prefixed vav ("אדינה וארי"). */
export function transliterateToHebrew(name: string): string {
  const raw = (name || "").trim();
  if (!raw) return "";
  if (HEBREW_RE.test(raw)) return raw; // already Hebrew/Yiddish — leave as-is
  const parts = raw.split(/\s*(?:&|,|\band\b|\bund\b|\bun\b)\s*/i).filter(Boolean);
  const heb = parts.map(transliterateWord).filter(Boolean);
  if (heb.length <= 1) return heb[0] || "";
  return heb[0] + " " + heb.slice(1).map((h) => "ו" + h).join(" ");
}

/** The child name to print on the cover, in the book's language. English keeps
 *  the name as typed; Hebrew/Yiddish prefers the LLM's localized spelling and
 *  falls back to transliteration. */
export function localizedCoverName(
  raw: string,
  lang: "en" | "he" | "yi",
  localized?: string | null,
): string {
  if (!raw || lang === "en") return raw;
  if (localized && localized.trim()) return localized.trim();
  return transliterateToHebrew(raw);
}
