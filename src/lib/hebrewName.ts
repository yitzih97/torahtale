/* Rendering a child's name on a Hebrew/Yiddish book cover.
 *
 * New books get an accurate Hebrew/Yiddish spelling straight from the story LLM
 * (which writes the whole book - including the child's name - in the target
 * script). `localizedCoverName` prefers that when present. For older books (or
 * any book missing the field) it falls back to a per-name lookup:
 *   1. NAMES - a dictionary of common Jewish names with their CANONICAL Hebrew
 *      spelling (Adina→עדינה, Dovid→דוד), which rules alone can't derive (the
 *      ayin-vs-aleph and dropped-vowel choices depend on the name's origin).
 *   2. transliterateToHebrew - rule-based Latin→Hebrew for anything not listed;
 *      approximate, but always better than a Latin name on an all-Hebrew cover. */

const HEBREW_RE = /[֐-׿]/;

// Hebrew spellings for common Jewish children's names. FORMAL names use their
// canonical/traditional spelling (Adina→עדינה, Dovid→דוד). NICKNAMES are spelled
// AS the nickname, phonetically (Esti→אסתי, NOT the formal אסתר; Rivky→ריבקי;
// Shlomi→שלומי) - parents want the name they actually call the child. Keys are
// lowercase, apostrophes/spaces stripped. Extend freely - misses transliterate.
const NAMES: Record<string, string> = {
  // ── Boys - formal ──
  avraham: "אברהם", avrohom: "אברהם", abraham: "אברהם",
  yitzchak: "יצחק", yitzchok: "יצחק", isaac: "יצחק",
  yaakov: "יעקב", yankel: "יענקל", jacob: "יעקב",
  moshe: "משה", moishe: "משה", moses: "משה",
  aharon: "אהרן", aron: "אהרן", aaron: "אהרן",
  dovid: "דוד", david: "דוד", duvid: "דוד",
  shlomo: "שלמה", shloime: "שלמה", solomon: "שלמה",
  yosef: "יוסף", joseph: "יוסף",
  binyamin: "בנימין", benyamin: "בנימין", benjamin: "בנימין",
  yehuda: "יהודה", judah: "יהודה",
  shimon: "שמעון", simon: "שמעון",
  levi: "לוי", reuven: "ראובן", reuben: "ראובן",
  naftali: "נפתלי", naftoli: "נפתלי", gad: "גד", asher: "אשר", dan: "דן",
  zevulun: "זבולון", zevulon: "זבולון", yissachar: "יששכר",
  menachem: "מנחם", mendel: "מנדל", nachman: "נחמן", nachum: "נחום",
  shmuel: "שמואל", shmiel: "שמואל", samuel: "שמואל",
  eliezer: "אליעזר", elazar: "אלעזר", elimelech: "אלימלך",
  chaim: "חיים", baruch: "ברוך", boruch: "ברוך",
  zalman: "זלמן", shneur: "שניאור",
  ari: "ארי", aryeh: "אריה", arie: "אריה", leib: "לייב",
  dov: "דב", ber: "בער", tzvi: "צבי", zvi: "צבי", hirsch: "הירש",
  zev: "זאב", zeev: "זאב", wolf: "זאב",
  yehoshua: "יהושע", yeshaya: "ישעיה", yechezkel: "יחזקאל",
  yirmiyahu: "ירמיהו", yechiel: "יחיאל", yoel: "יואל", joel: "יואל",
  yona: "יונה", yair: "יאיר", meir: "מאיר", mayer: "מאיר",
  mordechai: "מרדכי", marcus: "מרדכי",
  nosson: "נתן", nathan: "נתן", nassan: "נתן", nesanel: "נתנאל", netanel: "נתנאל",
  pinchas: "פנחס", refael: "רפאל", raphael: "רפאל", rephael: "רפאל",
  shabsi: "שבתי", shaul: "שאול", saul: "שאול", simcha: "שמחה",
  uri: "אורי", uriel: "אוריאל", zecharia: "זכריה", gershon: "גרשון",
  gedalia: "גדליה", kalman: "קלמן", lipa: "ליפא", feivel: "פייבל",
  yisroel: "ישראל", yisrael: "ישראל", israel: "ישראל",
  eli: "אלי", ezra: "עזרא", efraim: "אפרים", ephraim: "אפרים", menashe: "מנשה",
  chananya: "חנניה", chanoch: "חנוך", daniel: "דניאל", doniel: "דניאל",
  eliyahu: "אליהו", elisha: "אלישע", elchanan: "אלחנן",
  noach: "נח", noah: "נח", yerachmiel: "ירחמיאל",
  yonatan: "יונתן", yonason: "יונתן", jonathan: "יונתן",
  amram: "עמרם", avigdor: "אביגדור", akiva: "עקיבא", amos: "עמוס",
  betzalel: "בצלאל", gavriel: "גבריאל", gabriel: "גבריאל", michael: "מיכאל", michoel: "מיכאל",
  zusha: "זושא", zushe: "זושא", fishel: "פישל", shmelke: "שמעלקא",
  // ── Boys - nicknames (spelled as the nickname) ──
  avrumi: "אברומי", itzik: "איציק", yitzi: "יצי", yitzy: "יצי", yanky: "יענקי",
  koby: "קובי", moishy: "מוישי", moshy: "מושי", dovi: "דובי", dovy: "דובי",
  shlomi: "שלומי", shloimy: "שלוימי", yossi: "יוסי", yossy: "יוסי", yossel: "יאסל",
  benny: "בעני", beni: "בעני", beny: "בעני", leibish: "לייביש", leibel: "לייבל", berel: "בערל",
  mendy: "מענדי", shmuli: "שמולי", lazer: "לייזר", motti: "מוטי", motty: "מוטי",
  mottel: "מוטל", sruli: "שרולי", srulik: "שרוליק", yoni: "יוני",
  chatzkel: "חצקל",
  // ── Girls - formal ──
  sara: "שרה", sarah: "שרה", rivka: "רבקה", rivkah: "רבקה", rebecca: "רבקה",
  rochel: "רחל", rachel: "רחל", leah: "לאה", adina: "עדינה",
  miriam: "מרים", chana: "חנה", hannah: "חנה", hana: "חנה",
  devora: "דבורה", devorah: "דבורה", dvora: "דבורה", deborah: "דבורה",
  esther: "אסתר", ester: "אסתר",
  rus: "רות", ruth: "רות", yael: "יעל", yehudis: "יהודית", yehudit: "יהודית", judith: "יהודית",
  chaya: "חיה", bina: "בינה", bracha: "ברכה", brocha: "ברכה",
  batya: "בתיה", basya: "בתיה", malka: "מלכה", michal: "מיכל",
  nechama: "נחמה", shira: "שירה", shaindel: "שיינדל",
  tova: "טובה", tzipora: "צפורה", gittel: "גיטל", faiga: "פייגא", feige: "פייגא",
  golda: "גולדה", hinda: "הינדא", liba: "ליבא", perl: "פערל", perel: "פערל", sima: "סימא",
  chava: "חוה", dina: "דינה", dinah: "דינה",
  naomi: "נעמי", penina: "פנינה", pnina: "פנינה", rina: "רינה", tamar: "תמר",
  ora: "אורה", aliza: "עליזה", ayala: "אילה", talia: "טליה", noa: "נועה", noya: "נויה",
  shoshana: "שושנה", tehila: "תהילה", meira: "מאירה", moriah: "מוריה", moria: "מוריה",
  ariella: "אריאלה", ariela: "אריאלה", gila: "גילה", hadassah: "הדסה", hadas: "הדס",
  yaffa: "יפה", zahava: "זהבה", raizel: "רייזל", mindel: "מינדל",
  kayla: "קיילא", zisel: "זיסל", yitta: "יטא",
  eliana: "אליאנה", ahuva: "אהובה", shprintza: "שפרינצא", henna: "הענא",
  // ── Girls - nicknames (spelled as the nickname) ──
  sury: "סורי", suri: "סורי", surie: "סורי", rivky: "ריבקי", rifky: "ריפקי",
  ruchy: "רוחי", rochy: "רוחי", mimi: "מימי", chani: "חני", dassy: "דסי",
  esti: "אסתי", esty: "אסתי", malky: "מלכי", shaindy: "שיינדי", toby: "טובי",
  tzippy: "ציפי", tzipi: "ציפי", gitty: "גיטי", faigy: "פייגי", goldy: "גולדי",
  hindy: "הינדי", raizy: "רייזי", mindy: "מינדי",
};

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

/** Convert one Latin name to Hebrew. Prefers the canonical dictionary spelling
 *  (Adina→עדינה, Dovid→דוד); otherwise transliterates rule-based - a leading
 *  vowel gets an aleph, medial/final "e" is dropped the way Hebrew omits most
 *  vowels (Ari→ארי, Esther→אסתר). Idempotent: a name already in Hebrew is
 *  returned untouched. */
function transliterateWord(word: string): string {
  const w = word.trim().toLowerCase();
  if (!w) return "";
  // Canonical spelling first (strip apostrophes/spaces to match dictionary keys).
  const key = w.replace(/['’\s.]/g, "");
  if (NAMES[key]) return NAMES[key];
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

// One child's name (possibly a compound like "Zvi Meir"): dictionary/translit
// each whitespace token separately and rejoin with a space (צבי מאיר).
function hebForChild(part: string): string {
  return part.trim().split(/\s+/).map(transliterateWord).filter(Boolean).join(" ");
}

/** Transliterate a full cover name - possibly several children ("Adina & Ari")
 *  - into Hebrew, joining extra names with a prefixed vav ("עדינה וארי"). */
export function transliterateToHebrew(name: string): string {
  const raw = (name || "").trim();
  if (!raw) return "";
  if (HEBREW_RE.test(raw)) return raw; // already Hebrew/Yiddish - leave as-is
  const parts = raw.split(/\s*(?:&|,|\band\b|\bund\b|\bun\b)\s*/i).filter(Boolean);
  const heb = parts.map(hebForChild).filter(Boolean);
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
