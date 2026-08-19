import { describe, it, expect } from "vitest";
// Plain ESM modules, imported by the tests exactly as the agent imports them.
import { rotationCandidates, validateEnglish, validateHebrew } from "../../scripts/blog-agent.mjs";
import { TORAH_PORTIONS_DATA } from "../components/wizard/torahData.mjs";
import { ARTICLES } from "../content/blog/index.mjs";

// The agent writes to the live site unattended, so the two pieces that decide
// *what* it writes and *whether the result is publishable* are worth pinning.

const body = (extra = "") => `
  <p>${"A sentence about the parsha for parents to read. ".repeat(60)}</p>
  <h2>What happens in the story</h2>
  <p>${"More about the story, written for a child. ".repeat(60)}</p>
  [[IMAGE:cover]]
  <h2>How to explain it</h2>
  <p>${"Practical guidance for a parent at the Shabbos table. ".repeat(40)}</p>
  [[IMAGE:products]]
  <p><a href="/create">Create the book</a></p>
  ${extra}`;

const hebrewBody = `
  <p>${"משפט על הפרשה שההורה קורא בעברית פשוטה וברורה. ".repeat(40)}</p>
  <h2>מה קורה בסיפור</h2>
  <p>${"עוד על הסיפור, מסופר לילדים בגובה העיניים. ".repeat(40)}</p>
  [[IMAGE:cover]]
  <h2>איך מסבירים לילד</h2>
  <p>${"הדרכה מעשית להורה לשולחן השבת. ".repeat(30)}</p>
  [[IMAGE:products]]
  <p><a href="/create">ליצירת הספר</a></p>`;

const hebrew = (overrides: Record<string, unknown> = {}) => ({
  title: "פרשת נח לילדים: התיבה, החיות והקשת",
  description:
    "איך מספרים לילדים את פרשת נח — מה קורה בסיפור, איזו מידה הוא מלמד, ואיך מסבירים את המבול לילד בן ארבע בלי להפחיד אותו.",
  excerpt: "התיבה, החיות שנכנסו שניים שניים, והקשת בענן שבסוף.",
  keywords: ["פרשת נח לילדים", "סיפור נח לילדים", "התיבה של נח"],
  keyFacts: ["עובדה ראשונה על הפרשה.", "עובדה שנייה על הפרשה.", "עובדה שלישית על הפרשה."],
  faq: [
    { q: "שאלה ראשונה?", a: "תשובה ראשונה." },
    { q: "שאלה שנייה?", a: "תשובה שנייה." },
    { q: "שאלה שלישית?", a: "תשובה שלישית." },
    { q: "שאלה רביעית?", a: "תשובה רביעית." },
  ],
  bodyHtml: hebrewBody,
  ...overrides,
});

const article = (overrides: Record<string, unknown> = {}) => ({
  slug: "parshas-noach-for-kids",
  title: "Parshas Noach for Kids: The Teivah, the Animals and the Keshet",
  description:
    "How to tell Parshas Noach to children — what happens, the middah it teaches, and how to explain the mabul to a four-year-old without frightening them.",
  excerpt:
    "The teivah, the animals two by two, and the rainbow at the end — here is how to bring Parshas Noach alive for a young child.",
  keywords: ["parshas noach for kids", "noach story children", "teivah"],
  keyFacts: ["A fact.", "Another fact.", "A third fact."],
  faq: [
    { q: "Q1?", a: "A1." },
    { q: "Q2?", a: "A2." },
    { q: "Q3?", a: "A3." },
    { q: "Q4?", a: "A4." },
  ],
  bodyHtml: body(),
  ...overrides,
});

describe("blog agent topic rotation", () => {
  it("offers every story that has no article yet, exactly once", () => {
    const covered = new Set(ARTICLES.map((a: { portion?: string }) => a.portion).filter(Boolean));
    const candidates = rotationCandidates();
    expect(candidates.length).toBe(TORAH_PORTIONS_DATA.length - covered.size);
    expect(new Set(candidates.map((c: { value: string }) => c.value)).size).toBe(candidates.length);
    // Nothing already written should come round again.
    expect(candidates.filter((c: { value: string }) => covered.has(c.value))).toEqual([]);
  });

  it("interleaves collections instead of draining Chumash first", () => {
    const firstEight = rotationCandidates()
      .slice(0, 8)
      .map((c: { category: string }) => c.category);
    expect(new Set(firstEight).size).toBeGreaterThan(1);
  });
});

describe("blog agent English validation", () => {
  it("accepts a well-formed article", () => {
    expect(validateEnglish(article())).toEqual([]);
  });

  it("rejects an invented internal link", () => {
    const bad = article({ bodyHtml: body('<p><a href="/blog/made-up-post">see this</a></p>') });
    expect(validateEnglish(bad).join(" ")).toMatch(/made-up-post/);
  });

  it("rejects an unknown image token", () => {
    const bad = article({ bodyHtml: body("[[IMAGE:hero]]") });
    expect(validateEnglish(bad).join(" ")).toMatch(/hero/);
  });

  it("rejects raw <img> and other disallowed tags", () => {
    const bad = article({ bodyHtml: body('<img src="/x.jpg" alt="x" />') });
    expect(validateEnglish(bad).join(" ")).toMatch(/disallowed tag <img>/);
  });

  it("rejects a slug that already exists on the blog", () => {
    const bad = article({ slug: "best-personalized-jewish-gifts-for-kids" });
    expect(validateEnglish(bad).join(" ")).toMatch(/already used/);
  });

  it("rejects a thin article", () => {
    const bad = article({ bodyHtml: "<h2>Short</h2><p>Too short.</p>[[IMAGE:cover]][[IMAGE:products]]" });
    expect(validateEnglish(bad).join(" ")).toMatch(/write more/);
  });
});

describe("blog agent halachic checks", () => {
  // Five of the first six story articles shipped offering the coloring book as
  // something to do on Shabbos or Yom Tov. Coloring is melacha.
  it("rejects the coloring book offered on Yom Tov", () => {
    const bad = article({
      bodyHtml: body("<p>The matching coloring book is a good answer for a long Yom Tov afternoon.</p>"),
    });
    expect(validateEnglish(bad).join(" ")).toMatch(/melacha/);
  });

  it("rejects it in an FAQ answer too", () => {
    const bad = article({
      faq: [
        { q: "Which format?", a: "Many families add the coloring book for the long afternoons of Yom Tov." },
        { q: "Q2?", a: "A2." },
        { q: "Q3?", a: "A3." },
        { q: "Q4?", a: "A4." },
      ],
    });
    expect(validateEnglish(bad).join(" ")).toMatch(/melacha/);
  });

  it("allows the coloring book on a weekday, before Yom Tov, or on Chol HaMoed", () => {
    for (const line of [
      "<p>The coloring book is for the weekday afternoons of Elul, before Yom Tov begins.</p>",
      "<p>The coloring book is one for Chol HaMoed afternoons in the sukkah.</p>",
      "<p>Keep the coloring book for erev Shabbos, while the cooking is happening.</p>",
    ]) {
      expect(validateEnglish(article({ bodyHtml: body(line) }))).toEqual([]);
    }
  });

  it("leaves reading a storybook on Shabbos alone", () => {
    const fine = article({
      bodyHtml: body("<p>It is a book to read at the Shabbos table, or on a long Yom Tov afternoon.</p>"),
    });
    expect(validateEnglish(fine)).toEqual([]);
  });

  it("catches it in Hebrew", () => {
    const bad = hebrew({
      bodyHtml: hebrewBody + "<p>חוברת הצביעה מעסיקה יפה בשבת אחר הצהריים.</p>",
    });
    expect(validateHebrew(bad).join(" ")).toMatch(/melacha/);
  });
});

describe("blog agent Hebrew validation", () => {
  it("accepts a well-formed Hebrew article", () => {
    expect(validateHebrew(hebrew())).toEqual([]);
  });

  it("rejects an English body handed in as the Hebrew one", () => {
    expect(validateHebrew(hebrew({ bodyHtml: body() })).join(" ")).toMatch(/Hebrew/);
  });

  it("rejects a Hebrew article whose prose is half English", () => {
    const mixed = hebrew({
      bodyHtml: hebrewBody + "<p>This is a long run of English prose that should never appear here.</p>",
    });
    expect(validateHebrew(mixed).join(" ")).toMatch(/do not translate/);
  });

  it("rejects English search keywords on the Hebrew article", () => {
    const bad = hebrew({ keywords: ["parshas noach for kids", "noach story", "teivah"] });
    expect(validateHebrew(bad).join(" ")).toMatch(/Hebrew search phrases/);
  });

  it("rejects a Hebrew title that reuses an existing title's shape", () => {
    // Three holiday articles once shipped as "<chag> לילדים: איך מספרים את הסיפור בבית".
    const published = ["ראש השנה לילדים: איך מספרים את הסיפור בבית"];
    const templated = hebrew({ title: "סוכות לילדים: איך מספרים את הסיפור בבית" });
    expect(validateHebrew(templated, { publishedTitles: published }).join(" ")).toMatch(
      /repeats the shape/
    );
    const distinct = hebrew({ title: "סוכות לילדים: למה יוצאים מהבית לשבעה ימים" });
    expect(validateHebrew(distinct, { publishedTitles: published })).toEqual([]);
  });

  it("rejects a Hebrew title that is really English", () => {
    expect(validateHebrew(hebrew({ title: "Parshas Noach for Kids" })).join(" ")).toMatch(/he\.title/);
  });
});
