/**
 * The daily blog agent.
 *
 * Once a day (see .github/workflows/daily-blog.yml) this picks a story from the
 * Torah Tale collections that the blog hasn't covered yet, has Claude write a
 * bilingual, SEO- and GEO-shaped article about it, validates the result, and
 * writes it into src/content/blog/stories/. The commit triggers the normal
 * Pages build, which regenerates sitemap.xml / rss.xml / llms.txt from the
 * article list — so a new post is live and discoverable without any other step.
 *
 * Usage:
 *   node scripts/blog-agent.mjs                  # write today's article
 *   node scripts/blog-agent.mjs --count 5        # backfill five articles
 *   node scripts/blog-agent.mjs --topic noach    # force a specific story
 *   node scripts/blog-agent.mjs --plan           # print what it would write, call nothing
 *
 * Requires ANTHROPIC_API_KEY (or an `ant auth login` profile) and the
 * @anthropic-ai/sdk package, which the workflow installs on the fly so the
 * site's own lockfile stays untouched.
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { TORAH_PORTIONS_DATA, PARSHA_CALENDAR_DATA } from "../src/components/wizard/torahData.mjs";
import { ARTICLES } from "../src/content/blog/index.mjs";
import { COVER_BY_PORTION, stripHtml } from "../src/content/blog/shared.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STORIES_DIR = join(ROOT, "src", "content", "blog", "stories");

const MODEL = process.env.BLOG_MODEL || "claude-opus-5";
const EFFORT = process.env.BLOG_EFFORT || "high";

// ── CLI ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const value = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const PLAN_ONLY = flag("plan") || flag("dry-run");
const COUNT = Math.max(1, parseInt(value("count", "1"), 10) || 1);
const FORCED_TOPIC = value("topic", null);
const RUN_DATE = value("date", new Date().toISOString().slice(0, 10));

// ── What the model is allowed to say about us ────────────────────────────────
// Everything factual in a generated article has to come from here or from the
// story itself. The model gets no other source, which is what keeps a daily
// unattended writer from inventing prices, timelines or claims.
const PRODUCT_FACTS = `
Torah Tale (torahtale.com) makes personalized Torah storybooks for Jewish children.
- The child is the hero: their name and, from one uploaded photo, their likeness appears on every page, illustrated in high-resolution 3D Pixar style.
- Up to four children (siblings) can appear in the same book.
- Stories cover the weekly parsha, all of Tanach (Chumash, Nevi'im, Kesuvim, Megillos), the Yamim Tovim, and middos stories set in everyday life.
- The book creator suggests NEXT week's parsha (not this week's), with a live countdown to the order deadline for delivery before that Shabbos; a double-parsha week produces one book covering both.
- Creating a book requires a free account, and takes eight short questions: name, boy or girl, age, one photo, siblings, story, language, printed format.
- Languages: English, Hebrew and Yiddish (a book can be ordered in more than one).
- Formats: softcover photo book 8"x8" (ages 4-8), hardcover photo book 8"x8" in square or landscape (ages 5-12), board book 6"x6" with rounded safety corners (ages 2-4), and an optional matching coloring book 8.5"x11" in black-and-white line art.
- Ordering: a single book, or a Weekly / Monthly (4 books) / Year Bundle subscription. Standard shipping is free (5-7 business days); express is 2-3 business days; we ship worldwide.
- Every book is written with careful rabbinical guidance and strict tznius, and reviewed by our team before it goes to print.
- The whole creation flow takes about five minutes and starts at torahtale.com/create.
Do NOT state prices, discounts, page counts, delivery guarantees, review counts, or any statistic that is not in this list.
`.trim();

const STYLE_RULES = `
Voice and hashkafa:
- Write for frum (Orthodox) parents — mostly American, some Israeli — choosing a book for a child aged roughly 2 to 12.
- Use traditional transliteration and terminology: Hashem, Torah, parsha (not "portion of the week"), Shabbos, cheder, Bais Yaakov, Avraham Avinu, Moshe Rabbeinu, Yidden, middos, mitzvah/mitzvos, tefillah, tzedakah, Yom Tov.
- Retell the story the way it is taught in a frum home or classroom: pshat plus well-known Rashi/Midrash. Attribute midrashim as "Chazal tell us" or "the Midrash relates" rather than presenting them as pesukim.
- Never take an academic, critical, or comparative-religion angle. Never question whether events happened. Never describe or depict Hashem physically.
- Keep everything tzniusdik: no romantic detail, no descriptions of women's appearance, nothing frightening described graphically.
- Warm, practical and specific. No hype, no exclamation marks stacked up, no "unlock" / "dive in" / "in today's fast-paced world" filler.

Writing rules:
- 900-1400 words in the English body. Short paragraphs (2-4 sentences). Concrete detail over adjectives.
- Every H2 should be something a parent would actually search or ask.
- Include at least one practical, usable section a parent can act on today (questions to ask at the Shabbos table, how to explain it to a 4-year-old vs an 8-year-old, an activity).
- Mention Torah Tale naturally where it belongs (the book for this story, the format that suits the age) — roughly one product mention per two sections, never in every paragraph.
`.trim();

// ── Topic selection ──────────────────────────────────────────────────────────

const publishedPortions = new Set(ARTICLES.map((a) => a.portion).filter(Boolean));
const publishedSlugs = new Set(ARTICLES.map((a) => a.slug));

/** The parshiyos read over the next few Shabbosos, soonest first. */
const upcomingParshiyos = (from = new Date(RUN_DATE), weeks = 4) => {
  const keys = Object.keys(PARSHA_CALENDAR_DATA).sort();
  const start = from.toISOString().slice(0, 10);
  return keys.filter((k) => k >= start).slice(0, weeks).map((k) => PARSHA_CALENDAR_DATA[k]);
};

/**
 * Upcoming Yamim Tovim, from Hebcal. Best-effort: if the fetch fails or times
 * out we simply lose the seasonal boost for holidays and fall back to the
 * rotation, rather than failing the day's run.
 */
const HEBCAL_TO_PORTION = {
  "Rosh Hashana": "rosh-hashana",
  "Yom Kippur": "yom-kippur",
  Sukkot: "sukkot",
  "Simchat Torah": "simchat-torah",
  Chanukah: "chanukah",
  "Tu BiShvat": "tu-bishvat",
  Purim: "purim",
  "Ta'anit Esther": "taanis-esther",
  Pesach: "pesach",
  "Lag BaOmer": "lag-baomer",
  Shavuot: "shavuot",
  "Tzom Gedaliah": "tzom-gedaliah",
  "Asara B'Tevet": "asarah-bteves",
  "Tzom Tammuz": "shiva-asar-btammuz",
  "Tish'a B'Av": "tisha-bav",
};

const upcomingHolidays = async (from = new Date(RUN_DATE), days = 45) => {
  const end = new Date(from.getTime() + days * 86400000);
  const url =
    `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=off&s=off&` +
    `start=${from.toISOString().slice(0, 10)}&end=${end.toISOString().slice(0, 10)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    const out = [];
    for (const item of data.items || []) {
      const base = String(item.title || "").replace(/:.*$/, "").replace(/ [IVX]+$/, "").trim();
      const slug = HEBCAL_TO_PORTION[base];
      if (slug && !out.includes(slug)) out.push(slug);
    }
    return out;
  } catch (err) {
    console.warn(`blog-agent: skipping the holiday check (${err.message})`);
    return [];
  }
};

/**
 * Rotation order for everything the calendar doesn't force: interleaved across
 * collections so the archive grows broad rather than finishing Bereishis before
 * it ever mentions Nevi'im.
 */
const ROTATION = ["torah", "holiday", "neviim", "educational", "torah", "ketuvim", "megillot", "torah"];

export const rotationCandidates = () => {
  const byCategory = {};
  for (const p of TORAH_PORTIONS_DATA) (byCategory[p.category] ||= []).push(p);
  const queues = Object.fromEntries(
    Object.entries(byCategory).map(([c, list]) => [c, list.filter((p) => !publishedPortions.has(p.value))])
  );
  const ordered = [];
  // Deal one story at a time off each collection in ROTATION order until empty.
  for (let round = 0; ordered.length < TORAH_PORTIONS_DATA.length; round++) {
    let progressed = false;
    for (const category of ROTATION) {
      const next = queues[category]?.shift();
      if (next) {
        ordered.push(next);
        progressed = true;
      }
    }
    if (!progressed) break;
  }
  return ordered;
};

/** Picks the next story to write about, and says why. */
export const chooseTopic = async (alreadyChosen = new Set()) => {
  const byValue = new Map(TORAH_PORTIONS_DATA.map((p) => [p.value, p]));
  const taken = (v) => publishedPortions.has(v) || alreadyChosen.has(v);

  if (FORCED_TOPIC) {
    const forced = byValue.get(FORCED_TOPIC);
    if (!forced) throw new Error(`--topic ${FORCED_TOPIC} is not a story in TORAH_PORTIONS_DATA`);
    return { portion: forced, reason: "requested with --topic" };
  }

  for (const slug of await upcomingHolidays()) {
    if (byValue.has(slug) && !taken(slug)) {
      return { portion: byValue.get(slug), reason: "a Yom Tov is coming up within six weeks" };
    }
  }

  for (const slug of upcomingParshiyos()) {
    if (byValue.has(slug) && !taken(slug)) {
      return { portion: byValue.get(slug), reason: "it is one of the next parshiyos being read" };
    }
  }

  const next = rotationCandidates().find((p) => !alreadyChosen.has(p.value));
  if (next) return { portion: next, reason: "next in the collection rotation" };

  return null;
};

// ── Prompting ────────────────────────────────────────────────────────────────

const IMAGE_TOKENS = {
  cover: "a photo of the real printed Torah Tale book for this story (or, if we have no book photo for it, the collection's artwork)",
  products: "photos of all four real printed formats side by side",
  storypicker: "a real screenshot of the story picker in the book creator",
  photo: "a real screenshot of the photo-upload step in the book creator",
  collection: "artwork for this story's collection",
};

const ALLOWED_LINKS = ["/create", "/pricing", "/faq", "/blog", "/"];

const buildPrompt = (portion, dateISO) => {
  const category = portion.category;
  const collectionName = {
    torah: "Chumash (the weekly parsha)",
    neviim: "Nevi'im",
    ketuvim: "Kesuvim",
    megillot: "the Megillos",
    holiday: "the Yamim Tovim",
    educational: "middos stories set in everyday life",
  }[category];

  const existing = ARTICLES.map((a) => `- /blog/${a.slug} — ${a.title}`).join("\n");
  const hasBookPhoto = Boolean(COVER_BY_PORTION[portion.value]);

  return `Write today's Torah Tale blog article. Today is ${dateISO}.

STORY: ${portion.label} (${portion.sub})
COLLECTION: ${collectionName}${portion.book ? `, Sefer ${portion.book}` : ""}
The article's job is to be genuinely useful to a parent about THIS story, and — as a natural consequence — to be the page that ranks and gets cited when someone searches for this story for their kids.

ABOUT TORAH TALE (the only product facts you may use):
${PRODUCT_FACTS}

STYLE:
${STYLE_RULES}

STRUCTURE of bodyHtml:
- Open with one short paragraph that answers the searcher's question directly — what this story is and why it lands with children.
- Then 5 to 7 <h2> sections. Cover, in your own order: what happens in the story (retold for children), the middah or lesson, how to explain it at different ages, what a personalized Torah Tale book of this story is like, and something practical (Shabbos-table questions, an activity, or a "say it in one sentence" script).
- Close with a short paragraph pointing to <a href="/create">create the book</a>.
- Do NOT write an <h1> (the page renders the title itself), and do NOT write the FAQ or the summary box in bodyHtml — those come from the faq and keyFacts fields.

ALLOWED HTML in bodyHtml: <p> <h2> <h3> <ul> <ol> <li> <strong> <em> <a> <blockquote> <table> <thead> <tbody> <tr> <th> <td>. Nothing else — no <img>, <script>, <style>, <div> or inline style attributes.

IMAGES: place exactly two or three image tokens on their own line where they belong. Available tokens:
${Object.entries(IMAGE_TOKENS).map(([k, v]) => `  [[IMAGE:${k}]] — ${v}`).join("\n")}
${hasBookPhoto ? "We have a real photo of the printed book for this story, so [[IMAGE:cover]] is worth using." : "We have no book photo for this specific story; [[IMAGE:cover]] will fall back to the collection's artwork."}
Never write an <img> tag yourself and never invent a token name.

LINKS: you may link only to ${ALLOWED_LINKS.join(", ")} and to these already-published articles:
${existing}
Link to two or three of them where the connection is real. Never invent a /blog/ URL.

keyFacts: 3 to 5 one-sentence, self-contained facts that answer the article's core question on their own — assume they will be quoted with no surrounding context. Light <strong> is fine; no other tags.

faq: 4 to 6 questions a parent actually types ("How do I explain X to a 5-year-old?", "What is the lesson of X?"), each answered in 2 to 4 plain-text sentences that stand alone. No tags in the answers.

SLUG: lowercase, hyphenated, 3 to 8 words, containing the story's name as a parent would search it. It must be different from every slug listed above.

HEBREW: the "he" object is a genuine Hebrew article for an Israeli/Hebrew-speaking frum parent — the same substance and structure, written in Hebrew, not a literal translation. Use the same image tokens in the same places. Hebrew keyFacts and faq too.`;
};

// ── Validation ───────────────────────────────────────────────────────────────

const ALLOWED_TAGS = new Set([
  "p", "h2", "h3", "ul", "ol", "li", "strong", "em", "a", "blockquote",
  "table", "thead", "tbody", "tr", "th", "td", "br",
]);

export const validate = (art, { portion, plannedSlugs = new Set() } = {}) => {
  const problems = [];
  const req = (cond, msg) => { if (!cond) problems.push(msg); };

  req(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(art.slug || ""), "slug must be lowercase words separated by single hyphens");
  req(!publishedSlugs.has(art.slug) && !plannedSlugs.has(art.slug), `slug "${art.slug}" is already used — choose a different one`);
  req((art.title || "").length >= 20 && art.title.length <= 75, "title must be between 20 and 75 characters");
  req((art.description || "").length >= 80 && art.description.length <= 165, "description must be between 80 and 165 characters (it is the meta description)");
  req((art.excerpt || "").length >= 60, "excerpt is too short");
  req(Array.isArray(art.keywords) && art.keywords.length >= 3, "give at least 3 keywords");
  req(Array.isArray(art.keyFacts) && art.keyFacts.length >= 3 && art.keyFacts.length <= 5, "keyFacts must have 3 to 5 entries");
  req(Array.isArray(art.faq) && art.faq.length >= 4 && art.faq.length <= 6, "faq must have 4 to 6 entries");

  for (const lang of ["en", "he"]) {
    const body = lang === "en" ? art.bodyHtml : art.he?.bodyHtml;
    const label = lang === "en" ? "bodyHtml" : "he.bodyHtml";
    if (!body) { problems.push(`${label} is missing`); continue; }

    const words = stripHtml(body).split(/\s+/).filter(Boolean).length;
    req(words >= 550, `${label} is only ~${words} words — write more (the English body should be 900-1400 words)`);
    req(/<h2>/.test(body), `${label} needs <h2> section headings`);
    req(!/<h1[\s>]/i.test(body), `${label} must not contain an <h1>`);

    for (const tag of body.matchAll(/<\s*\/?\s*([a-zA-Z][a-zA-Z0-9]*)/g)) {
      if (!ALLOWED_TAGS.has(tag[1].toLowerCase())) problems.push(`${label} uses the disallowed tag <${tag[1]}>`);
    }
    req(!/\sstyle\s*=/i.test(body), `${label} must not use inline style attributes`);

    const tokens = [...body.matchAll(/\[\[IMAGE:([a-z]+)\]\]/g)].map((m) => m[1]);
    req(tokens.length >= 2 && tokens.length <= 3, `${label} should place 2 or 3 image tokens (found ${tokens.length})`);
    for (const t of tokens) {
      if (!IMAGE_TOKENS[t]) problems.push(`${label} uses the unknown image token [[IMAGE:${t}]]`);
    }

    for (const href of [...body.matchAll(/href="([^"]+)"/g)].map((m) => m[1])) {
      const ok =
        ALLOWED_LINKS.includes(href) ||
        (href.startsWith("/blog/") && publishedSlugs.has(href.slice("/blog/".length)));
      if (!ok) problems.push(`${label} links to ${href}, which is not an allowed or existing page`);
    }
  }

  const he = art.he || {};
  req(he.title && he.description && he.excerpt, "the he object needs title, description and excerpt");
  req(Array.isArray(he.keyFacts) && he.keyFacts.length >= 3, "he.keyFacts must have at least 3 entries");
  req(Array.isArray(he.faq) && he.faq.length >= 4, "he.faq must have at least 4 entries");
  req(/[֐-׿]/.test(he.bodyHtml || ""), "he.bodyHtml must actually be written in Hebrew");

  return problems;
};

// ── The model call ───────────────────────────────────────────────────────────

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["slug", "title", "description", "excerpt", "keywords", "keyFacts", "faq", "bodyHtml", "he"],
  properties: {
    slug: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    excerpt: { type: "string" },
    keywords: { type: "array", items: { type: "string" } },
    keyFacts: { type: "array", items: { type: "string" } },
    faq: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["q", "a"],
        properties: { q: { type: "string" }, a: { type: "string" } },
      },
    },
    bodyHtml: { type: "string" },
    he: {
      type: "object",
      additionalProperties: false,
      required: ["title", "description", "excerpt", "keyFacts", "faq", "bodyHtml"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        excerpt: { type: "string" },
        keyFacts: { type: "array", items: { type: "string" } },
        faq: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["q", "a"],
            properties: { q: { type: "string" }, a: { type: "string" } },
          },
        },
        bodyHtml: { type: "string" },
      },
    },
  },
};

const SYSTEM = `You are the staff writer for Torah Tale, a company that prints personalized Torah storybooks starring the child who receives them.

You write one article a day for torahtale.com/blog. Each one covers a different story from the collections families can order, and each has to stand on its own as something a frum parent is glad they read — the search traffic follows from that, not the other way round.

Two audiences read every piece: a parent skimming on a phone, and an answer engine deciding what to quote. Both are served by the same thing — direct answers stated plainly, early, and in complete sentences that survive being lifted out of context.

Only claim what the provided product facts support. If you are unsure whether a detail about the story is pshat, Midrash, or your own inference, either attribute it correctly or leave it out.`;

const generate = async (client, portion, plannedSlugs, dateISO) => {
  const messages = [{ role: "user", content: buildPrompt(portion, dateISO) }];

  for (let attempt = 1; attempt <= 3; attempt++) {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      system: SYSTEM,
      output_config: { effort: EFFORT, format: { type: "json_schema", schema: SCHEMA } },
      messages,
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      throw new Error(`the model declined this request (${message.stop_details?.category || "no category"})`);
    }
    if (message.stop_reason === "max_tokens") {
      throw new Error("the article was cut off at max_tokens");
    }

    const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    let article;
    try {
      article = JSON.parse(text);
    } catch {
      throw new Error("the model returned something that was not valid JSON");
    }

    const problems = validate(article, { portion, plannedSlugs });
    if (!problems.length) return article;

    console.warn(`blog-agent: attempt ${attempt} had ${problems.length} problem(s):`);
    for (const p of problems) console.warn(`  - ${p}`);
    if (attempt === 3) throw new Error(`could not get a valid article after 3 attempts:\n- ${problems.join("\n- ")}`);

    messages.push({ role: "assistant", content: text });
    messages.push({
      role: "user",
      content: `That draft has problems. Fix these and return the corrected article in full:\n- ${problems.join("\n- ")}`,
    });
  }
};

// ── Writing the file ─────────────────────────────────────────────────────────

const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const HE_MONTHS = ["בינואר", "בפברואר", "במרץ", "באפריל", "במאי", "ביוני", "ביולי", "באוגוסט", "בספטמבר", "באוקטובר", "בנובמבר", "בדצמבר"];

const humanDates = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { en: `${EN_MONTHS[m - 1]} ${d}, ${y}`, he: `${d} ${HE_MONTHS[m - 1]} ${y}` };
};

const readingMinutes = (html) => Math.max(3, Math.round(stripHtml(html).split(/\s+/).filter(Boolean).length / 220));

/** Embeds a string as a readable template literal rather than a JSON blob. */
const tpl = (s) => "`" + String(s).replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${") + "`";
const str = (s) => JSON.stringify(s);
const list = (items, indent) =>
  items.map((i) => `${indent}${str(i)},`).join("\n");
const faqList = (items, indent) =>
  items.map((f) => `${indent}{ q: ${str(f.q)}, a: ${str(f.a)} },`).join("\n");

const renderModule = (art, portion, dateISO) => {
  const dates = humanDates(dateISO);
  return `// Written by scripts/blog-agent.mjs on ${dateISO} — story: ${portion.value}.
// Reviewed and edited like any other content file; the agent never rewrites a
// file it has already written.
import { expandImages } from "../shared.mjs";

const portion = ${str(portion.value)};
const category = ${str(portion.category)};

export default {
  slug: ${str(art.slug)},
  title: ${str(art.title)},
  description: ${str(art.description)},
  excerpt: ${str(art.excerpt)},
  date: ${str(dates.en)},
  dateISO: ${str(dateISO)},
  readingMins: ${readingMinutes(art.bodyHtml)},
  category,
  portion,
  keywords: [
${list(art.keywords, "    ")}
  ],
  keyFacts: [
${list(art.keyFacts, "    ")}
  ],
  faq: [
${faqList(art.faq, "    ")}
  ],
  bodyHtml: expandImages(${tpl(art.bodyHtml)}, { portion, category }),
  he: {
    title: ${str(art.he.title)},
    description: ${str(art.he.description)},
    excerpt: ${str(art.he.excerpt)},
    date: ${str(dates.he)},
    keyFacts: [
${list(art.he.keyFacts, "      ")}
    ],
    faq: [
${faqList(art.he.faq, "      ")}
    ],
    bodyHtml: expandImages(${tpl(art.he.bodyHtml)}, { portion, category, isHe: true }),
  },
};
`;
};

/** Rewrites stories/index.mjs from whatever is on disk, newest first. */
const rewriteStoryIndex = async () => {
  const files = readdirSync(STORIES_DIR).filter((f) => f.endsWith(".mjs") && f !== "index.mjs");
  const entries = [];
  for (const file of files) {
    const mod = await import(join(STORIES_DIR, file));
    entries.push({ file, dateISO: mod.default?.dateISO || "" });
  }
  entries.sort((a, b) => b.dateISO.localeCompare(a.dateISO) || a.file.localeCompare(b.file));
  const ident = (file) => "a" + file.replace(/\.mjs$/, "").replace(/[^a-zA-Z0-9]/g, "_");

  writeFileSync(
    join(STORIES_DIR, "index.mjs"),
    `// AUTO-GENERATED by scripts/blog-agent.mjs — do not edit by hand.
// One entry per daily story article; newest first.

${entries.map((e) => `import ${ident(e.file)} from "./${e.file}";`).join("\n")}

export const STORY_ARTICLES = [
${entries.map((e) => `  ${ident(e.file)},`).join("\n")}
];
`,
    "utf8"
  );
  return entries.length;
};

// ── Main ─────────────────────────────────────────────────────────────────────

const main = async () => {
  const chosen = new Set();
  const plannedSlugs = new Set();
  const written = [];

  for (let n = 0; n < COUNT; n++) {
    const pick = await chooseTopic(chosen);
    if (!pick) {
      console.log("blog-agent: every story in the collections already has an article. Nothing to write.");
      break;
    }
    chosen.add(pick.portion.value);
    console.log(`blog-agent: ${pick.portion.label} (${pick.portion.value}) — ${pick.reason}`);

    if (PLAN_ONLY) continue;

    // Loaded by name at call time (and hidden from bundlers) so the script can
    // be imported by tests in an environment where the SDK isn't installed.
    const sdk = "@anthropic-ai/sdk";
    const { default: Anthropic } = await import(/* @vite-ignore */ sdk);
    const client = new Anthropic();

    const dateISO = COUNT === 1 ? RUN_DATE : new Date(Date.parse(RUN_DATE) - n * 86400000).toISOString().slice(0, 10);
    const article = await generate(client, pick.portion, plannedSlugs, dateISO);
    plannedSlugs.add(article.slug);

    const file = join(STORIES_DIR, `${article.slug}.mjs`);
    writeFileSync(file, renderModule(article, pick.portion, dateISO), "utf8");
    written.push({ slug: article.slug, title: article.title, portion: pick.portion.value });
    console.log(`blog-agent: wrote src/content/blog/stories/${article.slug}.mjs — "${article.title}"`);
  }

  if (!written.length) {
    if (PLAN_ONLY) console.log("blog-agent: --plan, so nothing was generated or written.");
    return;
  }

  const total = await rewriteStoryIndex();
  console.log(`blog-agent: story index rebuilt (${total} article${total === 1 ? "" : "s"})`);

  // The workflow reads these to build its commit message.
  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(
      process.env.GITHUB_OUTPUT,
      `slug=${written[0].slug}\ntitle=${written[0].title.replace(/\n/g, " ")}\ncount=${written.length}\n`,
      { flag: "a" }
    );
  }
};

// Importable for tests; only runs when invoked directly.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`blog-agent: ${err.message}`);
    process.exit(1);
  });
}
