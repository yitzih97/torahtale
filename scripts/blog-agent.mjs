/**
 * The daily blog agent.
 *
 * Once a day (see .github/workflows/daily-blog.yml) this picks a story from the
 * Torah Tale collections that the blog hasn't covered yet, has Claude write a
 * bilingual, SEO- and GEO-shaped article about it, validates the result, and
 * writes it into src/content/blog/stories/. The commit triggers the normal
 * Pages build, which regenerates sitemap.xml / rss.xml / llms.txt from the
 * article list - so a new post is live and discoverable without any other step.
 *
 * Usage:
 *   node scripts/blog-agent.mjs                  # write today's article
 *   node scripts/blog-agent.mjs --count 5        # backfill five articles
 *   node scripts/blog-agent.mjs --topic noach    # force a specific story
 *   node scripts/blog-agent.mjs --plan           # print what it would write, call nothing
 *   node scripts/blog-agent.mjs --rewrite-hebrew <slug>   # rewrite one article's Hebrew from scratch
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
const REWRITE_HEBREW = value("rewrite-hebrew", null);
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
- Every book ends with a dedicated discussion page carrying 10 questions about the story, mixing comprehension with middos - what happened, and what it asks of the child. This is what turns the book from something read to a child into something talked about at the table, and it is worth mentioning.
- Every book is written with careful rabbinical guidance and strict tznius, and reviewed by our team before it goes to print.
- The whole creation flow takes about five minutes and starts at torahtale.com/create.
Do NOT state prices, discounts, page counts, delivery guarantees, review counts, or any statistic that is not in this list.

HALACHA - this is not a style preference, it is a correctness rule:
- Coloring, drawing and writing are melacha. NEVER present the coloring book as something to do on Shabbos or on Yom Tov, and never as a way to occupy children during either. It is a WEEKDAY activity - erev Shabbos, a weekday afternoon, the days before a Yom Tov, or Chol HaMoed (which is permitted).
- The STORYBOOKS are the opposite: reading is entirely appropriate on Shabbos and Yom Tov, and saying so is good - a book to read at the Shabbos table, or on a long Yom Tov afternoon, is exactly right.
`.trim();

// The same sheet in Hebrew, so the Hebrew writer isn't reading English facts and
// rendering them - which is where translated-sounding product copy comes from.
const PRODUCT_FACTS_HE = `
טורה־טייל (torahtale.com) מייצרת ספרי סיפורי תורה מותאמים אישית לילדים.
- הילד הוא הגיבור: השם שלו, ומתמונה אחת שמעלים - גם הדמות שלו - מופיעים בכל עמוד, מאוירים בתלת־ממד ברזולוציה גבוהה בסגנון פיקסאר.
- אפשר להכניס עד ארבעה ילדים (אחים) לאותו ספר.
- הסיפורים מכסים את פרשת השבוע, את כל התנ״ך (חומש, נביאים, כתובים, מגילות), את הימים הטובים, וסיפורי מידות מחיי היום־יום.
- יוצר הספרים מציע את פרשת השבוע הבא (לא של השבוע הנוכחי), עם ספירה לאחור עד מועד ההזמנה האחרון למשלוח לפני אותה שבת; בשבוע של פרשה כפולה נוצר ספר אחד שמכסה את שתיהן.
- יצירת ספר דורשת חשבון חינם, ולוקחת שמונה שאלות קצרות: שם, בן או בת, גיל, תמונה אחת, אחים, סיפור, שפה ופורמט הדפסה.
- שפות: עברית, אנגלית ויידיש (אפשר להזמין ספר ביותר משפה אחת).
- פורמטים: כריכה רכה 8"x8" (גילאי 4-8), כריכה קשה 8"x8" מרובע או לרוחב (גילאי 5-12), ספר קרטון 6"x6" עם פינות מעוגלות ובטוחות (גילאי 2-4), וחוברת צביעה תואמת 8.5"x11" בקווי מתאר בשחור־לבן כתוספת.
- הזמנה: ספר בודד, או מנוי שבועי / חודשי (4 ספרים) / חבילה שנתית. משלוח רגיל חינם (5-7 ימי עסקים), משלוח מהיר 2-3 ימי עסקים, ואנחנו שולחים לכל העולם.
- בסוף כל ספר יש עמוד דיון ייעודי עם 10 שאלות על הסיפור, שמשלבות שאלות הבנה עם שאלות במידות - מה קרה, ומה זה מבקש מהילד. זה מה שהופך את הספר ממשהו שקוראים לילד למשהו שמדברים עליו סביב השולחן, וכדאי להזכיר את זה.
- כל ספר נכתב בליווי רבני קפדני ובצניעות מלאה, והצוות עובר עליו לפני ההדפסה.
- כל התהליך אורך כחמש דקות ומתחיל ב־torahtale.com/create.
אסור לציין מחירים, הנחות, מספר עמודים, התחייבות לזמן אספקה, מספר ביקורות או כל נתון שלא מופיע ברשימה הזו.

הלכה - זה לא עניין של סגנון אלא של נכונות:
- צביעה, ציור וכתיבה הם מלאכה. לעולם אל תציג את חוברת הצביעה כפעילות לשבת או ליום טוב, וגם לא כדרך להעסיק ילדים בשבת או בחג. זו פעילות של יום חול - ערב שבת, אחר צהריים של יום חול, הימים שלפני החג, או חול המועד (שמותר).
- הספרים עצמם הם ההפך: קריאה מתאימה לגמרי לשבת וליום טוב, וכדאי לומר את זה - ספר לקרוא בשולחן שבת או באחר צהריים ארוך של יום טוב זה בדיוק הרעיון.
`.trim();

const STYLE_RULES = `
Voice and hashkafa:
- Write for frum (Orthodox) parents - mostly American, some Israeli - choosing a book for a child aged roughly 2 to 12.
- Use traditional transliteration and terminology: Hashem, Torah, parsha (not "portion of the week"), Shabbos, cheder, Bais Yaakov, Avraham Avinu, Moshe Rabbeinu, Yidden, middos, mitzvah/mitzvos, tefillah, tzedakah, Yom Tov.
- Retell the story the way it is taught in a frum home or classroom: pshat plus well-known Rashi/Midrash. Attribute midrashim as "Chazal tell us" or "the Midrash relates" rather than presenting them as pesukim.
- Never take an academic, critical, or comparative-religion angle. Never question whether events happened. Never describe or depict Hashem physically.
- Keep everything tzniusdik: no romantic detail, no descriptions of women's appearance, nothing frightening described graphically.
- Warm, practical and specific. No hype, no exclamation marks stacked up, no "unlock" / "dive in" / "in today's fast-paced world" filler.
- Never use a long dash of any kind (em dash or en dash), in either language. A plain hyphen "-", a comma or a full stop instead.

Writing rules:
- 900-1400 words in the English body. Short paragraphs (2-4 sentences). Concrete detail over adjectives.
- Every H2 should be something a parent would actually search or ask.
- Include at least one practical, usable section a parent can act on today (questions to ask at the Shabbos table, how to explain it to a 4-year-old vs an 8-year-old, an activity).
- Mention Torah Tale naturally where it belongs (the book for this story, the format that suits the age) - roughly one product mention per two sections, never in every paragraph.
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

const IMAGE_TOKENS_HE = {
  cover: "האיור של הכריכה של ספר טורה־טייל האמיתי לסיפור הזה",
  products: "תמונות של ארבעת הפורמטים המודפסים זה לצד זה",
  storypicker: "צילום מסך אמיתי של בוחר הסיפורים ביוצר הספרים",
  photo: "צילום מסך אמיתי של שלב העלאת התמונה ביוצר הספרים",
  collection: "האיור של האוסף שאליו הסיפור שייך",
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

  const existing = ARTICLES.map((a) => `- /blog/${a.slug} - ${a.title}`).join("\n");
  const hasBookPhoto = Boolean(COVER_BY_PORTION[portion.value]);

  return `Write today's Torah Tale blog article. Today is ${dateISO}.

STORY: ${portion.label} (${portion.sub})
COLLECTION: ${collectionName}${portion.book ? `, Sefer ${portion.book}` : ""}
The article's job is to be genuinely useful to a parent about THIS story, and - as a natural consequence - to be the page that ranks and gets cited when someone searches for this story for their kids.

ABOUT TORAH TALE (the only product facts you may use):
${PRODUCT_FACTS}

STYLE:
${STYLE_RULES}

STRUCTURE of bodyHtml:
- Open with one short paragraph that answers the searcher's question directly - what this story is and why it lands with children.
- Then 5 to 7 <h2> sections. Cover, in your own order: what happens in the story (retold for children), the middah or lesson, how to explain it at different ages, what a personalized Torah Tale book of this story is like, and something practical (Shabbos-table questions, an activity, or a "say it in one sentence" script).
- Close with a short paragraph pointing to <a href="/create">create the book</a>.
- Do NOT write an <h1> (the page renders the title itself), and do NOT write the FAQ or the summary box in bodyHtml - those come from the faq and keyFacts fields.

ALLOWED HTML in bodyHtml: <p> <h2> <h3> <ul> <ol> <li> <strong> <em> <a> <blockquote> <table> <thead> <tbody> <tr> <th> <td>. Nothing else - no <img>, <script>, <style>, <div> or inline style attributes.

IMAGES: place exactly two or three image tokens on their own line where they belong. Available tokens:
${Object.entries(IMAGE_TOKENS).map(([k, v]) => `  [[IMAGE:${k}]] - ${v}`).join("\n")}
${hasBookPhoto ? "We have a real photo of the printed book for this story, so [[IMAGE:cover]] is worth using." : "We have no book photo for this specific story; [[IMAGE:cover]] will fall back to the collection's artwork."}
Never write an <img> tag yourself and never invent a token name.

LINKS: you may link only to ${ALLOWED_LINKS.join(", ")} and to these already-published articles:
${existing}
Link to two or three of them where the connection is real. Never invent a /blog/ URL.

keyFacts: 3 to 5 one-sentence, self-contained facts that answer the article's core question on their own - assume they will be quoted with no surrounding context. Light <strong> is fine; no other tags.

faq: 4 to 6 questions a parent actually types ("How do I explain X to a 5-year-old?", "What is the lesson of X?"), each answered in 2 to 4 plain-text sentences that stand alone. No tags in the answers.

SLUG: lowercase, hyphenated, 3 to 8 words, containing the story's name as a parent would search it. It must be different from every slug listed above.`;
};

/**
 * The Hebrew article is written from scratch by its own call, in Hebrew, for an
 * Israeli frum parent - it never sees the English one. Written as a translation
 * job it would inherit English phrasing, English-shaped headings and the search
 * terms an American types; an Israeli parent searches "פרשת נח לילדים", not a
 * rendering of "Parshas Noach for kids".
 */
const buildHebrewPrompt = (portion, dateISO) => {
  const collectionName = {
    torah: "חומש - פרשת השבוע",
    neviim: "נביאים",
    ketuvim: "כתובים",
    megillot: "מגילות",
    holiday: "ימים טובים",
    educational: "סיפורי מידות מחיי היום־יום",
  }[portion.category];

  const existing = ARTICLES.map((a) => `- /blog/${a.slug} - ${a.he?.title || a.title}`).join("\n");
  const existingTitles = ARTICLES.map((a) => a.he?.title).filter(Boolean);

  return `כתוב את מאמר הבלוג של טורה־טייל להיום. התאריך: ${dateISO}.

הסיפור: ${portion.sub} (${portion.label})
האוסף: ${collectionName}${portion.book ? `, ספר ${portion.book}` : ""}

זהו מאמר עצמאי בעברית - לא תרגום. אתה כותב מאפס, בעברית, עבור הורה חרדי/דתי דובר עברית בישראל שמחפש בגוגל על הסיפור הזה עבור הילדים שלו. המבנה, הכותרות, הדוגמאות ומילות החיפוש צריכים להיות של קורא ישראלי - לא גרסה עברית של מאמר אנגלי.

על טורה־טייל (אלה העובדות היחידות שמותר להשתמש בהן):
${PRODUCT_FACTS_HE}

סגנון והשקפה:
- כתוב לאבא או אמא שבוחרים ספר לילד בגיל 2 עד 12. עברית טבעית וזורמת, לא מתורגמת ולא מליצית.
- מונחים כמו שמדברים בבית חרדי בארץ: הקב״ה, פרשת השבוע, שבת קודש, חז״ל, רש״י, המדרש, מידות טובות, תלמוד תורה או חיידר, בית יעקב, יום טוב, סבא וסבתא, אבא ואמא.
- ספר את הסיפור כפי שמלמדים אותו בבית ובכיתה: פשט וגם מדרשים מוכרים. ייחוס נכון - "חז״ל מספרים", "המדרש מביא" - ולא כאילו זה פסוק.
- בלי זווית אקדמית או ביקורתית, בלי להטיל ספק, בלי תיאור גשמי של הקב״ה.
- הכל בצניעות: בלי תיאורי מראה, בלי רומנטיקה, בלי תיאורים מפחידים לילדים.
- חם, מעשי וקונקרטי. בלי סופרלטיבים, בלי "בעולם המהיר של ימינו", בלי סימני קריאה מיותרים.

אורך: 700 עד 1100 מילים בגוף המאמר. פסקאות קצרות (2-4 משפטים).

מבנה bodyHtml:
- פסקה ראשונה קצרה שעונה ישירות: מה הסיפור הזה, ולמה הוא עובד עם ילדים.
- אחר כך 5 עד 7 כותרות <h2>. הכותרות צריכות להיות שאלות או ניסוחים שהורה ישראלי באמת מקליד בחיפוש. כסה: מה קורה בסיפור (מסופר לילדים), המידה או הלקח, איך מסבירים בגילאים שונים, איך נראה ספר טורה־טייל מותאם אישית של הסיפור הזה, ומשהו מעשי (שאלות לשולחן שבת, פעילות, או משפט אחד להסביר בו את הסיפור).
- סיים בפסקה קצרה עם קישור <a href="/create">ליצירת הספר</a>.
- אל תכתוב <h1> (הכותרת מוצגת על ידי הדף), ואל תכתוב את השאלות הנפוצות או את תיבת הסיכום בתוך bodyHtml - הן מגיעות מהשדות faq ו־keyFacts.

תגיות HTML מותרות ב־bodyHtml: <p> <h2> <h3> <ul> <ol> <li> <strong> <em> <a> <blockquote> <table> <thead> <tbody> <tr> <th> <td>. שום דבר אחר - בלי <img>, <script>, <style>, <div> ובלי style בתוך תגית.

תמונות: שבץ בדיוק שניים או שלושה טוקנים של תמונה, כל אחד בשורה משלו, במקום שבו הם שייכים. הטוקנים הזמינים:
${Object.entries(IMAGE_TOKENS_HE).map(([k, v]) => `  [[IMAGE:${k}]] - ${v}`).join("\n")}
לעולם אל תכתוב תגית <img> בעצמך ואל תמציא שם טוקן.

קישורים: מותר לקשר רק אל ${ALLOWED_LINKS.join(", ")} ואל המאמרים שכבר פורסמו:
${existing}
קשר לשניים או שלושה מהם היכן שהקשר אמיתי. אל תמציא כתובת /blog/.

title: כותרת בעברית, 20 עד 70 תווים, שאדם היה מקליד או לוחץ עליה.
הכותרות שכבר קיימות בבלוג:
${existingTitles.map((t) => `  - ${t}`).join("\n")}
הכותרת שלך חייבת להיות שונה מהן באמת - לא אותה תבנית עם שם חג או פרשה אחרים. אם הכותרת שלך נראית כמו אחת מהן אחרי הנקודתיים או המקף, כתוב אותה מחדש. חשוב על מה ייחודי דווקא בסיפור הזה, ותן לזה להוביל.
description: תיאור מטא בעברית, 80 עד 165 תווים.
excerpt: משפט או שניים שמופיעים מתחת לכותרת בדף המאמר.
keywords: 3 עד 8 ביטויי חיפוש בעברית שהורה ישראלי באמת מקליד.
keyFacts: 3 עד 5 עובדות של משפט אחד, שעומדות בפני עצמן וגם אם יצוטטו לבד יהיו נכונות ומובנות. מותר <strong> קל, בלי תגיות אחרות.
faq: 4 עד 6 שאלות שהורה באמת שואל, כל אחת עם תשובה של 2 עד 4 משפטים בטקסט רגיל, בלי תגיות.`;
};

// ── Validation ───────────────────────────────────────────────────────────────

const ALLOWED_TAGS = new Set([
  "p", "h2", "h3", "ul", "ol", "li", "strong", "em", "a", "blockquote",
  "table", "thead", "tbody", "tr", "th", "td", "br",
]);

/**
 * Coloring, drawing and writing are melacha, so the coloring book must never be
 * offered as something to do on Shabbos or Yom Tov. Five of the first six story
 * articles shipped with exactly that ("a good answer for a long Yom Tov
 * afternoon"), because nothing had told the model otherwise.
 *
 * A sentence is only a problem when it puts the two together with no weekday
 * framing - saying the coloring book is for the days *before* Yom Tov, or for
 * Chol HaMoed, is correct and must stay allowed.
 */
const COLORING = /coloring|colouring|צביעה|לצבוע|לצייר/i;
const HOLY_DAY = /shabbos|shabbat|shabbat|yom tov|yontif|yom kippur|rosh hashanah|the chag|שבת|יום טוב|יום כיפור|ראש השנה|בחג/i;
const WEEKDAY_FRAMING = /weekday|week day|during the week|before|run-?up|erev|lead-?up|chol hamoed|יום חול|ימי החול|לפני|ערב שבת|חול המועד|באמצע השבוע/i;

const halachicProblems = (body, label) => {
  const problems = [];
  for (const sentence of stripHtml(body).split(/(?<=[.!?])\s+|\n/)) {
    if (!COLORING.test(sentence) || !HOLY_DAY.test(sentence)) continue;
    if (WEEKDAY_FRAMING.test(sentence)) continue;
    problems.push(
      `${label} offers the coloring book on Shabbos or Yom Tov, which is melacha: "${sentence.trim().slice(0, 120)}". Coloring is a weekday activity - erev Shabbos, a weekday afternoon, the days before Yom Tov, or Chol HaMoed. The storybooks themselves are fine to read on Shabbos and Yom Tov.`
    );
  }
  return problems;
};

/** Checks one language's body: structure, tags, image tokens and links. */
const validateBody = (body, label, { minWords }) => {
  const problems = [];
  if (!body) return [`${label} is missing`];

  const words = stripHtml(body).split(/\s+/).filter(Boolean).length;
  if (words < minWords) problems.push(`${label} is only ~${words} words - write more`);
  if (!/<h2>/.test(body)) problems.push(`${label} needs <h2> section headings`);
  if (/<h1[\s>]/i.test(body)) problems.push(`${label} must not contain an <h1>`);
  if (/\sstyle\s*=/i.test(body)) problems.push(`${label} must not use inline style attributes`);

  for (const tag of body.matchAll(/<\s*\/?\s*([a-zA-Z][a-zA-Z0-9]*)/g)) {
    if (!ALLOWED_TAGS.has(tag[1].toLowerCase())) problems.push(`${label} uses the disallowed tag <${tag[1]}>`);
  }

  const tokens = [...body.matchAll(/\[\[IMAGE:([a-z]+)\]\]/g)].map((m) => m[1]);
  if (tokens.length < 2 || tokens.length > 3) {
    problems.push(`${label} should place 2 or 3 image tokens (found ${tokens.length})`);
  }
  for (const t of tokens) {
    if (!IMAGE_TOKENS[t]) problems.push(`${label} uses the unknown image token [[IMAGE:${t}]]`);
  }

  for (const href of [...body.matchAll(/href="([^"]+)"/g)].map((m) => m[1])) {
    const ok =
      ALLOWED_LINKS.includes(href) ||
      (href.startsWith("/blog/") && publishedSlugs.has(href.slice("/blog/".length)));
    if (!ok) problems.push(`${label} links to ${href}, which is not an allowed or existing page`);
  }
  return [...problems, ...halachicProblems(body, label)];
};

export const validateEnglish = (art, { plannedSlugs = new Set() } = {}) => {
  const problems = [];
  const req = (cond, msg) => { if (!cond) problems.push(msg); };

  req(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(art.slug || ""), "slug must be lowercase words separated by single hyphens");
  req(!publishedSlugs.has(art.slug) && !plannedSlugs.has(art.slug), `slug "${art.slug}" is already used - choose a different one`);
  req((art.title || "").length >= 20 && art.title.length <= 75, "title must be between 20 and 75 characters");
  req((art.description || "").length >= 80 && art.description.length <= 165, "description must be between 80 and 165 characters (it is the meta description)");
  req((art.excerpt || "").length >= 60, "excerpt is too short");
  req(Array.isArray(art.keywords) && art.keywords.length >= 3, "give at least 3 keywords");
  req(Array.isArray(art.keyFacts) && art.keyFacts.length >= 3 && art.keyFacts.length <= 5, "keyFacts must have 3 to 5 entries");
  req(Array.isArray(art.faq) && art.faq.length >= 4 && art.faq.length <= 6, "faq must have 4 to 6 entries");

  for (const [i, f] of (art.faq || []).entries()) {
    problems.push(...halachicProblems(f.a, `faq[${i}] answer`));
  }
  return [...problems, ...validateBody(art.bodyHtml, "bodyHtml", { minWords: 700 })];
};

/** The half of a title after its colon or dash - the part that goes templated. */
const titleTail = (t) =>
  String(t || "")
    .split(/[:-]/)
    .slice(1)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

export const validateHebrew = (he, { publishedTitles = ARTICLES.map((a) => a.he?.title).filter(Boolean) } = {}) => {
  const problems = [];
  const req = (cond, msg) => { if (!cond) problems.push(msg); };
  const hebrew = (s) => /[\u0590-\u05FF]/.test(s || "");
  // Latin letters in prose are the tell of a half-translated draft; the odd
  // brand name or dimension is fine, a Latin sentence is not.
  const latinRun = (s) => /[A-Za-z]{4,}(\s+[A-Za-z]{4,}){3,}/.test(stripHtml(s || ""));

  req(hebrew(he.title) && (he.title || "").length >= 15 && he.title.length <= 80, "he.title must be Hebrew, 15 to 80 characters");
  req(hebrew(he.description) && (he.description || "").length >= 60 && he.description.length <= 175, "he.description must be Hebrew, 60 to 175 characters");
  req(hebrew(he.excerpt), "he.excerpt must be written in Hebrew");
  req(Array.isArray(he.keywords) && he.keywords.length >= 3 && he.keywords.every(hebrew), "he.keywords must be at least 3 Hebrew search phrases");
  req(Array.isArray(he.keyFacts) && he.keyFacts.length >= 3 && he.keyFacts.length <= 5 && he.keyFacts.every(hebrew), "he.keyFacts must be 3 to 5 entries, all in Hebrew");
  req(Array.isArray(he.faq) && he.faq.length >= 4 && he.faq.length <= 6 && he.faq.every((f) => hebrew(f.q) && hebrew(f.a)), "he.faq must be 4 to 6 Hebrew question/answer pairs");
  req(hebrew(he.bodyHtml), "he.bodyHtml must be written in Hebrew");

  // Three holiday articles once shipped with the identical tail
  // "איך מספרים את הסיפור בבית" - distinct bodies under templated titles, which
  // is what a search engine reads as filler.
  const tail = titleTail(he.title);
  const clash = publishedTitles.find((t) => t !== he.title && tail && titleTail(t) === tail);
  if (clash) {
    problems.push(
      `he.title repeats the shape of an existing title ("${clash}") - the part after the colon must not be reused, write a title specific to this story`
    );
  }
  req(!latinRun(he.bodyHtml), "he.bodyHtml contains a run of English prose - write the article in Hebrew, do not translate");

  for (const [i, f] of (he.faq || []).entries()) {
    problems.push(...halachicProblems(f.a, `he.faq[${i}] answer`));
  }
  // Hebrew says the same thing in fewer words than English, so the floor is lower.
  return [...problems, ...validateBody(he.bodyHtml, "he.bodyHtml", { minWords: 450 })];
};

// ── The model call ───────────────────────────────────────────────────────────

const FAQ_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["q", "a"],
    properties: { q: { type: "string" }, a: { type: "string" } },
  },
};

const EN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["slug", "title", "description", "excerpt", "keywords", "keyFacts", "faq", "bodyHtml"],
  properties: {
    slug: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    excerpt: { type: "string" },
    keywords: { type: "array", items: { type: "string" } },
    keyFacts: { type: "array", items: { type: "string" } },
    faq: FAQ_SCHEMA,
    bodyHtml: { type: "string" },
  },
};

// The Hebrew article is its own document, with its own title, description and
// search phrases - not a `he` block hanging off the English one.
const HE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "excerpt", "keywords", "keyFacts", "faq", "bodyHtml"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    excerpt: { type: "string" },
    keywords: { type: "array", items: { type: "string" } },
    keyFacts: { type: "array", items: { type: "string" } },
    faq: FAQ_SCHEMA,
    bodyHtml: { type: "string" },
  },
};

const SYSTEM = `You are the staff writer for Torah Tale, a company that prints personalized Torah storybooks starring the child who receives them.

You write one article a day for torahtale.com/blog. Each one covers a different story from the collections families can order, and each has to stand on its own as something a frum parent is glad they read - the search traffic follows from that, not the other way round.

Two audiences read every piece: a parent skimming on a phone, and an answer engine deciding what to quote. Both are served by the same thing - direct answers stated plainly, early, and in complete sentences that survive being lifted out of context.

Only claim what the provided product facts support. If you are unsure whether a detail about the story is pshat, Midrash, or your own inference, either attribute it correctly or leave it out.`;

// Hebrew has its own writer, briefed in Hebrew. The point is not politeness: a
// model asked in English to "also write it in Hebrew" produces English thinking
// in Hebrew words - English sentence rhythm, American examples, and headings
// that answer questions an Israeli parent never typed.
const SYSTEM_HE = `אתה הכותב של טורה־טייל, חברה שמדפיסה ספרי סיפורי תורה מותאמים אישית שבהם הילד שמקבל את הספר הוא הגיבור.

אתה כותב את המאמר היומי לגרסה העברית של torahtale.com/blog, עבור הורים חרדים ודתיים דוברי עברית בישראל. אתה לא מתרגם ולא מעבד מאמר קיים - אתה כותב מאמר מקורי בעברית, מהתחלה, כפי שהיית כותב אותו לולא היה קיים שום מאמר אחר.

עברית טבעית של דובר ילידי: משפטים קצרים, סדר מילים עברי, דימויים ודוגמאות מהחיים בארץ. אם משפט נשמע כמו תרגום מאנגלית - כתוב אותו מחדש.

שני קהלים קוראים כל מאמר: הורה שמדפדף בטלפון, ומנוע תשובות שמחליט מה לצטט. שניהם מרוויחים מאותו דבר - תשובה ישירה, מוקדם, במשפטים שלמים שנשארים נכונים גם כשמצטטים אותם לבד.

אל תטען דבר שלא מופיע בעובדות המוצר שקיבלת. אם אינך בטוח אם פרט הוא פשט, מדרש או פרשנות שלך - ייחס אותו נכון או השמט אותו.`;

/** Every layer of an error, since a dropped stream surfaces as a bare "terminated". */
const describeError = (err) => {
  const parts = [];
  for (let e = err, depth = 0; e && depth < 4; e = e.cause, depth++) {
    const bits = [e.name, e.message].filter(Boolean).join(": ");
    const extra = [
      e.status !== undefined && `status ${e.status}`,
      e.request_id && `request ${e.request_id}`,
      e.code && `code ${e.code}`,
    ].filter(Boolean);
    parts.push(extra.length ? `${bits} (${extra.join(", ")})` : bits);
  }
  return parts.filter(Boolean).join(" ← ");
};

/**
 * One model call. The SDK retries a request that never connected, but a stream
 * that dies partway through is ours to redo - and on a long article that is the
 * failure that actually happens.
 */
const requestArticle = async (client, { messages, system, schema }) => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 32000,
        system,
        output_config: { effort: EFFORT, format: { type: "json_schema", schema } },
        messages,
      });
      return await stream.finalMessage();
    } catch (err) {
      const detail = describeError(err);
      if (attempt === 3) throw new Error(`the model call failed 3 times - ${detail}`);
      console.warn(`blog-agent: model call failed (${detail}); retrying in ${attempt * 20}s`);
      await new Promise((r) => setTimeout(r, attempt * 20_000));
    }
  }
};

/**
 * No long dashes anywhere in Torah Tale copy - the site and the printed books
 * use a plain hyphen. The style rules say so, but a model reaches for the em
 * dash by habit, so every string in the draft is normalized before it is
 * validated or written. Escapes, not the characters themselves: they are not
 * allowed in this codebase either.
 */
const plainDashes = (val) =>
  typeof val === "string" ? val.replace(/[\u2014\u2013]/g, "-")
  : Array.isArray(val) ? val.map(plainDashes)
  : val && typeof val === "object"
    ? Object.fromEntries(Object.entries(val).map(([k, v]) => [k, plainDashes(v)]))
  : val;

/**
 * Drives one language to a valid article: ask, validate, and hand the problems
 * back for repair rather than accepting a draft that breaks the rules.
 */
const writeInLanguage = async (client, { label, system, prompt, schema, check, repairPrompt }) => {
  const messages = [{ role: "user", content: prompt }];

  for (let attempt = 1; attempt <= 3; attempt++) {
    const message = await requestArticle(client, { messages, system, schema });

    if (message.stop_reason === "refusal") {
      throw new Error(`the model declined the ${label} article (${message.stop_details?.category || "no category"})`);
    }
    if (message.stop_reason === "max_tokens") {
      throw new Error(`the ${label} article was cut off at max_tokens`);
    }

    const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    let article;
    try {
      article = plainDashes(JSON.parse(text));
    } catch {
      throw new Error(`the ${label} call returned something that was not valid JSON`);
    }

    const problems = check(article);
    if (!problems.length) return article;

    console.warn(`blog-agent: ${label} attempt ${attempt} had ${problems.length} problem(s):`);
    for (const p of problems) console.warn(`  - ${p}`);
    if (attempt === 3) {
      throw new Error(`could not get a valid ${label} article after 3 attempts:\n- ${problems.join("\n- ")}`);
    }

    messages.push({ role: "assistant", content: text });
    messages.push({ role: "user", content: `${repairPrompt}\n- ${problems.join("\n- ")}` });
  }
};

/**
 * English and Hebrew are written by two independent calls that never see each
 * other's output. They cover the same story and share a URL; everything else -
 * headings, examples, search phrases, FAQ - each language works out for itself.
 */
const generate = async (client, portion, plannedSlugs, dateISO) => {
  const [en, he] = await Promise.all([
    writeInLanguage(client, {
      label: "English",
      system: SYSTEM,
      prompt: buildPrompt(portion, dateISO),
      schema: EN_SCHEMA,
      check: (a) => validateEnglish(a, { plannedSlugs }),
      repairPrompt: "That draft has problems. Fix these and return the corrected article in full:",
    }),
    writeInLanguage(client, {
      label: "Hebrew",
      system: SYSTEM_HE,
      prompt: buildHebrewPrompt(portion, dateISO),
      schema: HE_SCHEMA,
      check: validateHebrew,
      repairPrompt: "בטיוטה הזו יש בעיות. תקן אותן והחזר את המאמר המלא המתוקן:",
    }),
  ]);

  return { ...en, he };
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

/**
 * The `he` half of a story module. Always last in the file, which is what lets
 * --rewrite-hebrew swap it without touching the English.
 */
const hebrewBlock = (he, humanDate) => `  he: {
    title: ${str(he.title)},
    description: ${str(he.description)},
    excerpt: ${str(he.excerpt)},
    date: ${str(humanDate)},
    readingMins: ${readingMinutes(he.bodyHtml)},
    keywords: [
${list(he.keywords, "      ")}
    ],
    keyFacts: [
${list(he.keyFacts, "      ")}
    ],
    faq: [
${faqList(he.faq, "      ")}
    ],
    bodyHtml: expandImages(${tpl(he.bodyHtml)}, { portion, category, isHe: true }),
  },
};
`;

const renderModule = (art, portion, dateISO) => {
  const dates = humanDates(dateISO);
  return `// Written by scripts/blog-agent.mjs on ${dateISO} - story: ${portion.value}.
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
${hebrewBlock(art.he, dates.he)}`;
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
    `// AUTO-GENERATED by scripts/blog-agent.mjs - do not edit by hand.
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

/**
 * Rewrites one article's Hebrew from scratch - for articles written before
 * Hebrew got its own call, whose `he` block reads like a translation because
 * that is effectively what it was.
 */
const rewriteHebrew = async (client, slug) => {
  const files = readdirSync(STORIES_DIR).filter((f) => f.endsWith(".mjs") && f !== "index.mjs");
  for (const file of files) {
    const mod = await import(join(STORIES_DIR, file));
    const art = mod.default;
    if (art?.slug !== slug) continue;

    const portion = TORAH_PORTIONS_DATA.find((p) => p.value === art.portion);
    if (!portion) throw new Error(`${slug} has no portion I recognise (${art.portion})`);

    const he = await writeInLanguage(client, {
      label: "Hebrew",
      system: SYSTEM_HE,
      prompt: buildHebrewPrompt(portion, art.dateISO),
      schema: HE_SCHEMA,
      check: validateHebrew,
      repairPrompt: "בטיוטה הזו יש בעיות. תקן אותן והחזר את המאמר המלא המתוקן:",
    });

    // The `he` block is always last in a generated module, so replacing from
    // its opening brace to the end of the file swaps the Hebrew and nothing else.
    const path = join(STORIES_DIR, file);
    const source = readFileSync(path, "utf8");
    const marker = source.indexOf("\n  he: {");
    if (marker < 0) throw new Error(`${file} has no he block to replace`);
    writeFileSync(path, source.slice(0, marker) + "\n" + hebrewBlock(he, humanDates(art.dateISO).he), "utf8");
    return { file, title: he.title };
  }
  throw new Error(`no story article has the slug "${slug}"`);
};

const main = async () => {
  if (REWRITE_HEBREW) {
    if (PLAN_ONLY) {
      console.log(`blog-agent: would rewrite the Hebrew of ${REWRITE_HEBREW}`);
      return;
    }
    const sdk = "@anthropic-ai/sdk";
    const { default: Anthropic } = await import(/* @vite-ignore */ sdk);
    const client = new Anthropic({ timeout: 20 * 60 * 1000, maxRetries: 3 });
    const done = await rewriteHebrew(client, REWRITE_HEBREW);
    console.log(`blog-agent: rewrote the Hebrew of ${done.file} - "${done.title}"`);
    return;
  }

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
    console.log(`blog-agent: ${pick.portion.label} (${pick.portion.value}) - ${pick.reason}`);

    if (PLAN_ONLY) continue;

    // Loaded by name at call time (and hidden from bundlers) so the script can
    // be imported by tests in an environment where the SDK isn't installed.
    const sdk = "@anthropic-ai/sdk";
    const { default: Anthropic } = await import(/* @vite-ignore */ sdk);
    // A bilingual article at high effort is a long single response; give the
    // request room rather than letting the default timeout cut the stream.
    const client = new Anthropic({ timeout: 20 * 60 * 1000, maxRetries: 3 });

    // Everything written in one run carries that run's date. A backfill used to
    // spread the articles back across previous days so the archive looked
    // gradual, which was just a lie about when they were written - and it went
    // into the sitemap's lastmod and the RSS pubDate.
    const article = await generate(client, pick.portion, plannedSlugs, RUN_DATE);
    plannedSlugs.add(article.slug);

    const file = join(STORIES_DIR, `${article.slug}.mjs`);
    writeFileSync(file, renderModule(article, pick.portion, RUN_DATE), "utf8");
    written.push({ slug: article.slug, title: article.title, portion: pick.portion.value });
    console.log(`blog-agent: wrote src/content/blog/stories/${article.slug}.mjs - "${article.title}"`);
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
    console.error(`blog-agent: ${describeError(err)}`);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  });
}
