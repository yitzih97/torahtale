import { describe, it, expect } from "vitest";
import { scorePair, scoreVerse, endWord, needsRewrite, rhymeRank, improves } from "../../supabase/functions/_shared/rhyme";

/* The cases below are not invented: the first four are the exact pairs the story
 * prompt names as good or lazy, and the scorer is only trustworthy if it agrees
 * with the craft rule the book is written to. */
describe("Hebrew rhyme scoring", () => {
  it("accepts a real rhyme built on the final stressed vowel", () => {
    // שָׂמֵחַ / פּוֹרֵחַ - the prompt's own example of a GOOD rhyme (furtive patach).
    expect(scorePair("שָׂמֵחַ", "פּוֹרֵחַ", "hebrew")).toBe("rhyme");
  });

  it("rejects the plural suffix ־ִים standing in for a rhyme", () => {
    // הוֹלְכִים / רוֹאִים - named in the prompt as lazy, and shipped anyway.
    expect(scorePair("הוֹלְכִים", "רוֹאִים", "hebrew")).toBe("suffix-only");
  });

  it("rejects the plural suffix ־וֹת standing in for a rhyme", () => {
    // יְלָדוֹת / בָּנוֹת - this is the failure the customer's book actually shipped.
    expect(scorePair("יְלָדוֹת", "בָּנוֹת", "hebrew")).toBe("suffix-only");
  });

  it("still accepts a plural rhyme when the match runs deeper than the suffix", () => {
    // מְאִירִים / שִׁירִים share "־ירים", not merely "־ים".
    expect(scorePair("מְאִירִים", "שִׁירִים", "hebrew")).toBe("rhyme");
  });

  it("never lets a word rhyme with itself", () => {
    expect(scorePair("שָׁלוֹם", "שָׁלוֹם", "hebrew")).toBe("none");
    // Same word, different nikud, is still the same word.
    expect(scorePair("מֶלֶךְ", "מֶלֶך", "hebrew")).toBe("none");
  });

  it("calls a plain non-rhyme a non-rhyme", () => {
    expect(scorePair("תּוֹרָה", "מֶלֶךְ", "hebrew")).toBe("none");
    expect(scorePair("גָּדוֹל", "יָפֶה", "hebrew")).toBe("none");
  });

  it("declines to judge unvocalized Hebrew rather than guessing", () => {
    // No nikud means no vowels to compare - "unknown", never a false verdict.
    expect(scorePair("הולכים", "רואים", "hebrew")).toBe("unknown");
  });

  it("leaves English to the prompt", () => {
    expect(scorePair("light", "night", "english")).toBe("unknown");
  });
});

describe("verse scoring", () => {
  it("passes a rhyming couplet", () => {
    const s = scoreVerse("הַיֶּלֶד רָץ אֶל הַשָּׂדֶה שָׂמֵחַ,\nוְהַשֶּׁמֶשׁ בַּשָּׁמַיִם פּוֹרֵחַ", "hebrew");
    expect(s.verdict).toBe("rhyme");
    expect(needsRewrite(s)).toBe(false);
  });

  it("flags a suffix couplet and says exactly what is wrong", () => {
    const s = scoreVerse("הַיְלָדִים בַּגַּן הוֹלְכִים,\nאֶת הַנִּסִּים הֵם רוֹאִים", "hebrew");
    expect(s.verdict).toBe("suffix-only");
    expect(needsRewrite(s)).toBe(true);
    // The diagnosis must name the words, or the rewrite prompt is useless.
    expect(s.detail).toContain("הוֹלְכִים");
    expect(s.detail).toContain("shared grammatical suffix");
  });

  it("accepts ABCB in a four-line verse without demanding AABB", () => {
    const s = scoreVerse(
      "בַּבֹּקֶר קַר,\nהַיֶּלֶד שָׂמֵחַ,\nהוּא לוֹבֵשׁ מְעִיל,\nוְאָז הוּא פּוֹרֵחַ",
      "hebrew",
    );
    expect(s.verdict).toBe("rhyme");
  });

  it("treats a one-line page as unscorable, not as a failure", () => {
    expect(needsRewrite(scoreVerse("רַק שׁוּרָה אַחַת", "hebrew"))).toBe(false);
  });

  it("ranks verdicts so a rewrite can only be kept when it improves", () => {
    expect(rhymeRank("rhyme")).toBeGreaterThan(rhymeRank("unknown"));
    expect(rhymeRank("unknown")).toBeGreaterThan(rhymeRank("suffix-only"));
    expect(rhymeRank("suffix-only")).toBeGreaterThan(rhymeRank("none"));
  });
});

describe("endWord", () => {
  it("ignores trailing punctuation", () => {
    expect(endWord("וְהַשֶּׁמֶשׁ בַּשָּׁמַיִם פּוֹרֵחַ,")).toBe("פּוֹרֵחַ");
    expect(endWord("the boy ran home!")).toBe("home");
  });
});

describe("repair safety", () => {
  const bad = "הַיְלָדִים בַּגַּן הוֹלְכִים,\nאֶת הַנִּסִּים הֵם רוֹאִים";
  const good = "הַיֶּלֶד רָץ אֶל הַשָּׂדֶה שָׂמֵחַ,\nוְהַשֶּׁמֶשׁ בַּשָּׁמַיִם פּוֹרֵחַ";

  it("accepts a rewrite that actually fixes the rhyme", () => {
    expect(improves(bad, good, "hebrew")).toBe(true);
  });

  it("rejects a rewrite that is no better, so the original survives", () => {
    // The model's most common failure here is returning the verse barely
    // touched; if it still doesn't rhyme, it must not replace anything.
    expect(improves(bad, bad, "hebrew")).toBe(false);
    expect(improves(bad, "אֲנַחְנוּ הוֹלְכִים,\nוְהֵם רוֹאִים", "hebrew")).toBe(false);
  });

  it("never downgrades a verse that was already fine", () => {
    expect(improves(good, bad, "hebrew")).toBe(false);
  });

  it("rejects an empty rewrite", () => {
    expect(improves(bad, "   ", "hebrew")).toBe(false);
  });
});
