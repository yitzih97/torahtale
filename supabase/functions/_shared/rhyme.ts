/* ── Deterministic rhyme scoring ─────────────────────────────────────────────
 * generate-story already had a rhyme QA pass, and it did not work: it handed the
 * verses back to the model and asked it to judge its own rhyming. A book
 * regenerated with that pass live still shipped 4 of 11 pages unrhymed, one of
 * them rhyming on the ־וֹת plural suffix that the prompt forbids BY NAME. A model
 * that cannot hear the fault the first time cannot hear it the second time
 * either, so the judgment has to happen in code.
 *
 * What this module does: score a verse WITHOUT asking a model. Hebrew is fully
 * vocalized in these books, and nikud is enough to recover the vowels, so
 * "do these two lines rhyme" is decidable here.
 *
 * The rule, matching the craft guidance in the story prompt:
 *   · rhyme is measured from the last vowel to the end of the word (the tail)
 *   · a tail that is nothing but a shared grammatical suffix (־ִים, ־וֹת, ־ִין,
 *     ־ָה) is a LAZY rhyme - הוֹלְכִים/רוֹאִים is not a rhyme - so when both words
 *     end in the same inflection we require the tail to reach one syllable
 *     further back: מְאִירִים/שִׁירִים passes, יְלָדוֹת/בָּנוֹת does not
 *   · a word never rhymes with itself
 *
 * Stress: Hebrew is predominantly milra, so the tail is taken from the final
 * vowel, with the furtive patach handled explicitly (שָׂמֵחַ is "…ay-ach", which
 * is why the prompt calls שָׂמֵחַ/פּוֹרֵחַ a good rhyme). Exotic stress is left
 * PERMISSIVE on purpose - see the note on asymmetry below.
 *
 * Asymmetry of errors, which is what makes this safe to act on: a false FAIL
 * costs one rewrite attempt that must then score strictly better to be kept, so
 * the original verse survives. A false PASS leaves a bad rhyme in a printed
 * book. The scorer is therefore tuned to catch the failures we have actually
 * seen rather than to be maximally clever.
 *
 * Pure and dependency-free: the Deno edge function and the Vitest suite both
 * import this same file.
 */

export type RhymeVerdict = "rhyme" | "suffix-only" | "none" | "unknown";

export interface RhymePair {
  a: string;
  b: string;
  verdict: RhymeVerdict;
}

export interface VerseScore {
  verdict: RhymeVerdict;
  /** A diagnosis specific enough to hand to a rewrite prompt. */
  detail: string;
  pairs: RhymePair[];
}

/** Higher is better. Used to keep a rewrite ONLY when it genuinely improves. */
export function rhymeRank(v: RhymeVerdict): number {
  switch (v) {
    case "rhyme": return 3;
    case "unknown": return 2; // unscorable: neither credited nor punished
    case "suffix-only": return 1;
    case "none": return 0;
  }
}

/* ── Hebrew ─────────────────────────────────────────────────────────────── */

const HEB_LETTER = /[א-ת]/;
const HEB_ANY = /[֐-׿]/;

/** Nikud → vowel sound. Sheva is deliberately absent: it is not a nucleus here. */
const VOWEL: Record<string, string> = {
  "ַ": "a", "ָ": "a", "ֲ": "a",           // patach, kamatz, hataf patach
  "ֵ": "e", "ֶ": "e", "ֱ": "e",           // tzere, segol, hataf segol
  "ִ": "i",                                          // chirik
  "ֹ": "o", "ֺ": "o", "ֳ": "o", "ׇ": "o", // cholam, hataf kamatz, kamatz katan
  "ֻ": "u",                                          // kubutz
};
const DAGESH = "ּ";
const SIN_DOT = "ׂ";

const FINAL_FORM: Record<string, string> = {
  "ם": "מ", "ן": "נ", "ץ": "צ",
  "ף": "פ", "ך": "כ",
};

interface Unit { letter: string; marks: string }

function unitize(word: string): Unit[] {
  const units: Unit[] = [];
  for (const ch of word) {
    if (HEB_LETTER.test(ch)) units.push({ letter: FINAL_FORM[ch] ?? ch, marks: "" });
    else if (HEB_ANY.test(ch) && units.length) units[units.length - 1].marks += ch;
  }
  return units;
}

function vowelOf(u: Unit): string | null {
  for (const m of u.marks) if (VOWEL[m]) return VOWEL[m];
  return null;
}

/**
 * A word reduced to an ordered phoneme list, e.g. שָׂמֵחַ → [ś, a, m, e, a, ch].
 * Matres lectionis are dropped so that כִּי and כִּ spell the same tail.
 */
function phonemes(word: string): string[] {
  const units = unitize(word);
  const out: string[] = [];
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    const prev = units[i - 1];
    const v = vowelOf(u);
    const last = i === units.length - 1;

    // Shuruk: a vav carrying only a dagesh is the vowel /u/, not a consonant.
    if (u.letter === "ו" && u.marks.includes(DAGESH) && !v) { out.push("u"); continue; }
    // Cholam male: the cholam is written ON the vav (הוֹ), but the vav is a mater
    // for the consonant before it, not a consonant of its own.
    if (u.letter === "ו" && v === "o" && prev && !vowelOf(prev)) { out.push("o"); continue; }
    // Mater lectionis: a silent vav/yud/alef/final-heh propping up the vowel before it.
    if (!v && !u.marks && prev) {
      const pv = out.length ? out[out.length - 1] : null;
      if (u.letter === "ו" && (pv === "o" || pv === "u")) continue;
      if (u.letter === "י" && (pv === "i" || pv === "e" || pv === "a")) continue;
      if (u.letter === "א" && pv && "aeiou".includes(pv)) continue;
      if (u.letter === "ה" && last && pv && "aeiou".includes(pv)) continue;
    }

    let c = u.letter;
    if (c === "ש") c = u.marks.includes(SIN_DOT) ? "s" : "sh";

    // Furtive patach: a final ח/ע takes its /a/ BEFORE the consonant, which is
    // exactly why שָׂמֵחַ and פּוֹרֵחַ rhyme.
    if (last && (u.letter === "ח" || u.letter === "ע") && v === "a" && out.some((p) => "aeiou".includes(p))) {
      out.push("a", c);
      continue;
    }
    out.push(c);
    if (v) out.push(v);
  }
  return out;
}

const isVowel = (p: string) => p.length === 1 && "aeiou".includes(p);

/** The tail from the nth-from-last vowel to the end of the word ("" if absent). */
function tail(ph: string[], nth: number): string {
  let seen = 0;
  for (let i = ph.length - 1; i >= 0; i--) {
    if (isVowel(ph[i])) {
      seen++;
      if (seen === nth) return ph.slice(i).join("");
    }
  }
  return "";
}

/* Tails that are pure inflection, where a match alone is not a rhyme. Written in
 * the same alphabet phonemes() emits: a Latin vowel followed by the Hebrew
 * consonant, e.g. "iמ" is ־ִים and "oת" is ־וֹת. */
const LAZY_TAILS = new Set(["iמ", "oת", "iנ", "uת", "a"]);

/* ── Yiddish ────────────────────────────────────────────────────────────── */

/* Yiddish here is written without nikud, but its vowels are spelled with real
 * letters, so the tail can be read straight off the orthography. */
const YID_VOWELS = new Set(["א", "ע", "י", "ו", "ױ", "ײ", "װ"]);
const YID_LAZY = new Set(["ען", "ן", "ער", "ס", "עס"]);

function yiddishLetters(word: string): string[] {
  const out: string[] = [];
  for (const ch of word) if (HEB_LETTER.test(ch) || YID_VOWELS.has(ch)) out.push(FINAL_FORM[ch] ?? ch);
  return out;
}

function yiddishTail(letters: string[], nth: number): string {
  let seen = 0;
  for (let i = letters.length - 1; i >= 0; i--) {
    if (YID_VOWELS.has(letters[i])) {
      // Treat a run of vowel letters (ײַ, אָ…) as one nucleus.
      if (i === letters.length - 1 || !YID_VOWELS.has(letters[i + 1])) seen++;
      if (seen === nth) return letters.slice(i).join("");
    }
  }
  return "";
}

/* ── Pair scoring ───────────────────────────────────────────────────────── */

/** The final word of a line, stripped of punctuation. */
export function endWord(line: string): string {
  const cleaned = line.replace(/[.,!?;:"'`”“’‘()\[\]{}־׳״-]+\s*$/u, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.length ? words[words.length - 1] : "";
}

export function scorePair(aRaw: string, bRaw: string, lang: string): RhymeVerdict {
  const a = aRaw.trim();
  const b = bRaw.trim();
  if (!a || !b) return "unknown";
  // A word never rhymes with itself.
  const bare = (s: string) => s.replace(/[֑-ׇ]/g, "");
  if (a === b || bare(a) === bare(b)) return "none";

  if (lang === "hebrew") {
    const pa = phonemes(a);
    const pb = phonemes(b);
    if (!pa.some(isVowel) || !pb.some(isVowel)) return "unknown"; // no nikud → cannot judge
    const t1a = tail(pa, 1);
    const t1b = tail(pb, 1);
    if (!t1a || !t1b) return "unknown";
    if (t1a !== t1b) return "none";
    // Tails agree. If the whole rhyme is a shared inflection, demand more.
    if (LAZY_TAILS.has(t1a)) {
      const t2a = tail(pa, 2);
      const t2b = tail(pb, 2);
      if (!t2a || !t2b) return "suffix-only";
      return t2a === t2b ? "rhyme" : "suffix-only";
    }
    return "rhyme";
  }

  if (lang === "yiddish") {
    const la = yiddishLetters(a);
    const lb = yiddishLetters(b);
    const t1a = yiddishTail(la, 1);
    const t1b = yiddishTail(lb, 1);
    if (!t1a || !t1b) return "unknown";
    if (t1a !== t1b) return "none";
    const suffix = [...YID_LAZY].some((s) => a.endsWith(s) && b.endsWith(s));
    if (suffix) {
      const t2a = yiddishTail(la, 2);
      const t2b = yiddishTail(lb, 2);
      if (!t2a || !t2b) return "suffix-only";
      return t2a === t2b ? "rhyme" : "suffix-only";
    }
    return "rhyme";
  }

  // English and anything else: the model already handles these well, and a
  // spelling-based check would misjudge them. Left to the prompt.
  return "unknown";
}

/* ── Verse scoring ──────────────────────────────────────────────────────── */

/**
 * Score one page's verse. Two lines are read as a couplet; four lines are
 * allowed to be either AABB or ABCB, so a valid scheme is never flagged.
 */
export function scoreVerse(text: string, lang: string): VerseScore {
  const lines = String(text ?? "").split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { verdict: "unknown", detail: "single line - nothing to rhyme", pairs: [] };
  }

  const ends = lines.map(endWord);
  const mk = (i: number, j: number): RhymePair => ({ a: ends[i], b: ends[j], verdict: scorePair(ends[i], ends[j], lang) });

  let pairs: RhymePair[];
  if (lines.length === 2) {
    pairs = [mk(0, 1)];
  } else if (lines.length === 4) {
    const aabb = [mk(0, 1), mk(2, 3)];
    const abcb = [mk(1, 3)];
    const worst = (ps: RhymePair[]) => Math.min(...ps.map((p) => rhymeRank(p.verdict)));
    pairs = worst(aabb) >= worst(abcb) ? aabb : abcb;
  } else if (lines.length === 3) {
    // Rare, and no fixed scheme: judge the strongest available pairing.
    const cands = [[mk(0, 1)], [mk(1, 2)], [mk(0, 2)]];
    pairs = cands.reduce((best, c) => (rhymeRank(c[0].verdict) > rhymeRank(best[0].verdict) ? c : best));
  } else {
    // Longer verses: consecutive couplets.
    pairs = [];
    for (let i = 0; i + 1 < lines.length; i += 2) pairs.push(mk(i, i + 1));
  }

  const worstRank = Math.min(...pairs.map((p) => rhymeRank(p.verdict)));
  const verdict = pairs.find((p) => rhymeRank(p.verdict) === worstRank)!.verdict;

  const bad = pairs.filter((p) => rhymeRank(p.verdict) <= rhymeRank("suffix-only"));
  const detail = bad.length === 0
    ? "all line endings rhyme"
    : bad.map((p) =>
        p.verdict === "suffix-only"
          ? `"${p.a}" / "${p.b}" rhyme only on a shared grammatical suffix - that is not a rhyme`
          : p.a === p.b || !p.a || !p.b
            ? `"${p.a}" / "${p.b}" - a word repeated as its own rhyme`
            : `"${p.a}" / "${p.b}" do not rhyme - the final stressed vowels differ`
      ).join("; ");

  return { verdict, detail, pairs };
}

/** True when a verse should be sent back for a rewrite. */
export function needsRewrite(s: VerseScore): boolean {
  return s.verdict === "suffix-only" || s.verdict === "none";
}

/**
 * Whether a rewritten verse is a genuine improvement on the original.
 *
 * This is the guard that makes the repair loop safe to run unattended: a
 * rewrite the scorer cannot vouch for is discarded and the original verse
 * survives, so a bad repair can never leave the book worse than it was.
 */
export function improves(before: string, after: string, lang: string): boolean {
  if (!after.trim()) return false;
  return rhymeRank(scoreVerse(after, lang).verdict) > rhymeRank(scoreVerse(before, lang).verdict);
}
