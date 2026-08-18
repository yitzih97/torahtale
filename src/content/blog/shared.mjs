// Shared building blocks for every blog article — hand-authored and generated
// alike. Plain ESM so both Vite (the React blog pages) and Node (the prerender
// script and the daily blog agent) can import it.
//
// Everything in here emits trusted, hand-shaped HTML. Generated articles never
// write raw <img> tags: the agent emits [[IMAGE:key]] tokens and `expandImages`
// swaps in one of the real, in-repo assets below. That way a generated article
// can only ever point at a photo or screenshot we actually have.

export const SITE = "https://torahtale.com";

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Strips tags — used for the plain-text corpus (llms-full.txt) and RSS. */
export const stripHtml = (html) =>
  String(html)
    .replace(/<figure[\s\S]*?<\/figure>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// ── Real screenshots of the Torah Tale creation wizard ──────────────────────
// Captured from the live product in each language, stored in /public/blog/wizard/.
export const SHOT = (file, alt, caption, rtl = false) => `
  <figure style="margin:1.35rem auto;max-width:560px"${rtl ? ' dir="rtl"' : ""}>
    <img src="/blog/wizard/${file}" alt="${esc(alt)}" loading="lazy"
      style="width:100%;height:auto;display:block;border:1px solid #e8e3d5;border-radius:14px;box-shadow:0 10px 30px -18px rgba(60,45,15,.25)" />
    ${caption ? `<figcaption style="margin-top:.5rem;text-align:center;font-size:.8rem;color:#8a8578">${esc(caption)}</figcaption>` : ""}
  </figure>`;

/** A real printed Torah Tale cover (photographed book art from /public/blog/covers/). */
export const COVER = (file, alt, caption, rtl = false) => `
  <figure style="margin:1.35rem auto;max-width:460px"${rtl ? ' dir="rtl"' : ""}>
    <img src="/blog/covers/${file}" alt="${esc(alt)}" loading="lazy"
      style="width:100%;height:auto;display:block;border:1px solid #e8e3d5;border-radius:14px;box-shadow:0 14px 36px -20px rgba(60,45,15,.35)" />
    ${caption ? `<figcaption style="margin-top:.5rem;text-align:center;font-size:.8rem;color:#8a8578">${esc(caption)}</figcaption>` : ""}
  </figure>`;

// The four real book products, side by side (photos of the actual printed books).
const PRODUCT_GRID_ITEMS = [
  ["mockup-softcover.jpg", "Softcover photo book — the printed Torah Tale product", "Softcover 8″×8″", "כריכה רכה 8″×8″"],
  ["mockup-hardcover.jpg", "Hardcover photo book — the printed Torah Tale product", "Hardcover 8″×8″", "כריכה קשה 8″×8″"],
  ["mockup-board.jpg", "Board book — the printed Torah Tale product", "Board book 6″×6″", "ספר קרטון 6″×6″"],
  ["mockup-coloring.jpg", "Matching coloring book — the printed Torah Tale product", "Coloring book 8.5″×11″", "חוברת צביעה 8.5″×11″"],
];

const PRODUCT_GRID_FOR = (he) => `
  <figure style="margin:1.35rem auto;max-width:620px"${he ? ' dir="rtl"' : ""}>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${PRODUCT_GRID_ITEMS.map(([f, alt, en, heLabel]) => `
        <div>
          <img src="/blog/wizard/${f}" alt="${esc(alt)}" loading="lazy"
            style="width:100%;height:auto;display:block;border:1px solid #e8e3d5;border-radius:12px" />
          <p style="margin:.35rem 0 0;text-align:center;font-size:.78rem;color:#8a8578">${he ? heLabel : en}</p>
        </div>`).join("")}
    </div>
    <figcaption style="margin-top:.6rem;text-align:center;font-size:.8rem;color:#8a8578">${
      he
        ? "הספרים המודפסים האמיתיים — כל פורמט מספר את אותו סיפור אישי."
        : "The real printed books — every format tells the same personalized story."
    }</figcaption>
  </figure>`;

export const PRODUCT_GRID = PRODUCT_GRID_FOR(false);
export const PRODUCT_GRID_HE = PRODUCT_GRID_FOR(true);

// ── Image tokens available to generated articles ────────────────────────────
// Ten of these are photographs of real printed Torah Tale books (the same ones
// on the home-page gallery), so a story article about, say, Parshas Noach can
// show the actual Noach book. The rest are real wizard screenshots.
export const COVER_BY_PORTION = {
  bereishit: ["s1-cover.jpg", "The Wonders of Gan Eden — a real printed Torah Tale book for Parshas Bereishis"],
  noach: ["s2-cover.jpg", "Noach's Incredible Teivah — a real printed Torah Tale book for Parshas Noach"],
  "lech-lecha": ["s4-cover.jpg", "Avraham Counts the Stars — a real printed Torah Tale book for Parshas Lech Lecha"],
  vayeshev: ["s5-cover.jpg", "Yosef's Coat of Colors — a real printed Torah Tale book for Parshas Vayeishev"],
  shemot: ["s6-cover.jpg", "Baby Moshe on the Nile — a real printed Torah Tale book for Parshas Shemos"],
  beshalach: ["s7-cover.jpg", "Krias Yam Suf — a real printed Torah Tale book for Parshas Beshalach"],
  yitro: ["s8-cover.jpg", "Matan Torah on Har Sinai — a real printed Torah Tale book for Parshas Yisro"],
  "david-goliath": ["s9-cover.jpg", "Dovid and Golyas — a real printed Torah Tale book from Sefer Shmuel"],
  yonah: ["s10-cover.jpg", "Yonah and the Great Dag — a real printed Torah Tale book from Sefer Yonah"],
};

/** Fallback hero art per collection, from the real wizard category tiles. */
const CATEGORY_IMAGE = {
  torah: ["torah.jpg", "Chumash story books from the Torah Tale collection"],
  neviim: ["neviim.jpg", "Nevi'im story books from the Torah Tale collection"],
  ketuvim: ["ketuvim.jpg", "Kesuvim story books from the Torah Tale collection"],
  megillot: ["megillot.jpg", "Megillos story books from the Torah Tale collection"],
  holiday: ["holiday.jpg", "Yom Tov story books from the Torah Tale collection"],
  educational: ["educational.jpg", "Middos story books from the Torah Tale collection"],
};

const CATEGORY_FIG = (category, rtl) => {
  const entry = CATEGORY_IMAGE[category] || CATEGORY_IMAGE.torah;
  return `
  <figure style="margin:1.35rem auto;max-width:520px"${rtl ? ' dir="rtl"' : ""}>
    <img src="/blog/categories/${entry[0]}" alt="${esc(entry[1])}" loading="lazy"
      style="width:100%;height:auto;display:block;border:1px solid #e8e3d5;border-radius:14px" />
  </figure>`;
};

/**
 * Replaces [[IMAGE:key]] tokens in generated body HTML with real figures.
 * Unknown tokens are dropped rather than rendered, so a hallucinated key can
 * never leave a broken image on the page.
 */
export const expandImages = (html, { portion, category, isHe = false } = {}) => {
  const cover = COVER_BY_PORTION[portion];
  const replacements = {
    cover: cover ? COVER(cover[0], cover[1], isHe ? "ספר טורה־טייל מודפס אמיתי." : "A real printed Torah Tale book.", isHe) : CATEGORY_FIG(category, isHe),
    collection: CATEGORY_FIG(category, isHe),
    products: isHe ? PRODUCT_GRID_HE : PRODUCT_GRID,
    storypicker: isHe
      ? SHOT("step-5-story-he.jpg", "בוחר הסיפורים של טורה־טייל", "בוחר הסיפורים האמיתי — כל התנ״ך בלחיצה.", true)
      : SHOT("step-5-story.jpg", "The Torah Tale story picker", "The real story picker — the whole Tanach, one tap away."),
    photo: isHe
      ? SHOT("step-4-photo-he.jpg", "העלאת תמונת הילד ביוצר הספרים", "תמונה אחת ברורה מלפנים וזה הכל.", true)
      : SHOT("step-4-photo.jpg", "Uploading the child's photo in the book creator", "One clear, front-facing photo is all it takes."),
  };
  return String(html).replace(/\[\[IMAGE:([a-z]+)\]\]/g, (_, key) => replacements[key] ?? "");
};

// ── GEO / SEO blocks ────────────────────────────────────────────────────────
// Answer engines (and skimming readers) pull short, self-contained, factual
// statements. Every article opens with a key-facts block and closes with a FAQ,
// which also feed the FAQPage structured data in the prerender + React pages.

export const KEY_FACTS_HTML = (facts, isHe = false) => {
  if (!facts?.length) return "";
  return `
  <aside class="blog-keyfacts"${isHe ? ' dir="rtl"' : ""}>
    <p class="blog-keyfacts-title">${isHe ? "בקצרה" : "The short answer"}</p>
    <ul>
      ${facts.map((f) => `<li>${f}</li>`).join("\n      ")}
    </ul>
  </aside>`;
};

export const FAQ_HTML = (faq, isHe = false) => {
  if (!faq?.length) return "";
  return `
  <section class="blog-faq"${isHe ? ' dir="rtl"' : ""}>
    <h2>${isHe ? "שאלות נפוצות" : "Frequently asked questions"}</h2>
    ${faq
      .map(
        (item) => `<div class="blog-faq-item">
      <h3>${item.q}</h3>
      <p>${item.a}</p>
    </div>`
      )
      .join("\n    ")}
  </section>`;
};

/**
 * The full reader-facing HTML for an article: key facts, the body, then the FAQ.
 * Both the React article page and the static prerender go through this, so the
 * crawled HTML and the rendered page never drift apart.
 */
export const renderArticleHtml = (article, isHe = false) =>
  [KEY_FACTS_HTML(article.keyFacts, isHe), article.bodyHtml, FAQ_HTML(article.faq, isHe)]
    .filter(Boolean)
    .join("\n");
