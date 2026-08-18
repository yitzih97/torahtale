import { describe, it, expect } from "vitest";
// Plain ESM modules, imported by the tests exactly as the agent imports them.
import { rotationCandidates, validate } from "../../scripts/blog-agent.mjs";
import { TORAH_PORTIONS_DATA } from "../components/wizard/torahData.mjs";

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
  he: {
    title: "פרשת נח לילדים",
    description: "איך מספרים לילדים את פרשת נח.",
    excerpt: "התיבה, החיות והקשת.",
    keyFacts: ["עובדה.", "עוד עובדה.", "עובדה שלישית."],
    faq: [
      { q: "ש1?", a: "ת1." },
      { q: "ש2?", a: "ת2." },
      { q: "ש3?", a: "ת3." },
      { q: "ש4?", a: "ת4." },
    ],
    bodyHtml: body().replace("What happens in the story", "מה קורה בסיפור") + "<p>עברית</p>",
  },
  ...overrides,
});

describe("blog agent topic rotation", () => {
  it("offers every story exactly once", () => {
    const candidates = rotationCandidates();
    expect(candidates.length).toBe(TORAH_PORTIONS_DATA.length);
    expect(new Set(candidates.map((c: { value: string }) => c.value)).size).toBe(candidates.length);
  });

  it("interleaves collections instead of draining Chumash first", () => {
    const firstEight = rotationCandidates()
      .slice(0, 8)
      .map((c: { category: string }) => c.category);
    expect(new Set(firstEight).size).toBeGreaterThan(1);
  });
});

describe("blog agent article validation", () => {
  it("accepts a well-formed article", () => {
    expect(validate(article())).toEqual([]);
  });

  it("rejects an invented internal link", () => {
    const bad = article({ bodyHtml: body('<p><a href="/blog/made-up-post">see this</a></p>') });
    expect(validate(bad).join(" ")).toMatch(/made-up-post/);
  });

  it("rejects an unknown image token", () => {
    const bad = article({ bodyHtml: body("[[IMAGE:hero]]") });
    expect(validate(bad).join(" ")).toMatch(/hero/);
  });

  it("rejects raw <img> and other disallowed tags", () => {
    const bad = article({ bodyHtml: body('<img src="/x.jpg" alt="x" />') });
    expect(validate(bad).join(" ")).toMatch(/disallowed tag <img>/);
  });

  it("rejects a slug that already exists on the blog", () => {
    const bad = article({ slug: "best-personalized-jewish-gifts-for-kids" });
    expect(validate(bad).join(" ")).toMatch(/already used/);
  });

  it("rejects a Hebrew body that is not in Hebrew", () => {
    const bad = article({ he: { ...article().he, bodyHtml: body() } });
    expect(validate(bad).join(" ")).toMatch(/actually be written in Hebrew/);
  });

  it("rejects a thin article", () => {
    const bad = article({ bodyHtml: "<h2>Short</h2><p>Too short.</p>[[IMAGE:cover]][[IMAGE:products]]" });
    expect(validate(bad).join(" ")).toMatch(/write more/);
  });
});
