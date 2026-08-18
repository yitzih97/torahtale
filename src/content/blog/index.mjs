// Blog content — single source of truth shared by the React blog pages
// (src/pages/Blog.tsx, BlogArticle.tsx), the static prerender script
// (scripts/prerender.mjs) and the daily blog agent (scripts/blog-agent.mjs).
// Plain ESM so both Vite and Node can import it.
//
// Articles come from two places:
//   core/     — hand-authored evergreen guides (how it works, gift guides…)
//   stories/  — one article per story in our collections, written daily by the
//               blog agent and committed to the repo like any other content.
//
// bodyHtml is trusted HTML: hand-authored in core/, and assembled from a fixed
// set of allowed tags plus real-asset image tokens in stories/.
//
// Each article carries top-level ENGLISH fields (used by the prerender/SEO
// layer) plus a `he` object with the Hebrew version of every reader-facing
// field. Use `localizeArticle(article, lang)` to get the right variant —
// Yiddish falls back to Hebrew.

import howToCreate from "./core/how-to-create-a-personalized-torah-storybook.mjs";
import howToChoose from "./core/how-to-choose-the-weekly-parsha-for-your-childs-book.mjs";
import bestGifts from "./core/best-personalized-jewish-gifts-for-kids.mjs";
import { STORY_ARTICLES } from "./stories/index.mjs";

export * from "./shared.mjs";

/**
 * @typedef {Object} Article
 * @property {string} slug
 * @property {string} title
 * @property {string} description
 * @property {string} excerpt
 * @property {string} date          // human-readable
 * @property {string} dateISO       // YYYY-MM-DD
 * @property {string} [updatedISO]  // YYYY-MM-DD, when revised after publishing
 * @property {number} readingMins
 * @property {string} [category]    // guide | gifts | torah | neviim | ketuvim | megillot | holiday | educational
 * @property {string} [portion]     // TORAH_PORTIONS value this article covers, when it covers one
 * @property {string[]} [keywords]
 * @property {string[]} [keyFacts]  // short, quotable answers — rendered up top, also fed to answer engines
 * @property {{q: string, a: string}[]} [faq]  // rendered as a FAQ section + FAQPage structured data
 * @property {string} bodyHtml
 * @property {Object} he
 */

export const CORE_ARTICLES = [howToCreate, howToChoose, bestGifts];

/** Newest first: the daily story articles, then the evergreen guides. */
/** @type {Article[]} */
export const ARTICLES = [...STORY_ARTICLES, ...CORE_ARTICLES].sort((a, b) =>
  (b.dateISO || "").localeCompare(a.dateISO || "")
);

export const getArticle = (slug) => ARTICLES.find((a) => a.slug === slug);

/** Every distinct category present, in display order. */
export const CATEGORY_ORDER = [
  "guide",
  "gifts",
  "torah",
  "neviim",
  "ketuvim",
  "megillot",
  "holiday",
  "educational",
];

export const CATEGORY_LABELS = {
  guide: { en: "Guides", he: "מדריכים" },
  gifts: { en: "Gift ideas", he: "רעיונות למתנה" },
  torah: { en: "Parsha stories", he: "סיפורי פרשה" },
  neviim: { en: "Nevi'im", he: "נביאים" },
  ketuvim: { en: "Kesuvim", he: "כתובים" },
  megillot: { en: "Megillos", he: "מגילות" },
  holiday: { en: "Yom Tov", he: "ימים טובים" },
  educational: { en: "Middos", he: "מידות" },
};

/**
 * Returns the article with reader-facing fields swapped for the requested
 * language. Hebrew and Yiddish both get the Hebrew version; anything else
 * (or a missing translation) falls back to English.
 */
export const localizeArticle = (article, lang) => {
  if (!article) return article;
  if ((lang === "he" || lang === "yi") && article.he) {
    return {
      ...article,
      title: article.he.title,
      description: article.he.description,
      excerpt: article.he.excerpt,
      date: article.he.date,
      bodyHtml: article.he.bodyHtml,
      keyFacts: article.he.keyFacts || article.keyFacts,
      faq: article.he.faq || article.faq,
      keywords: article.he.keywords || article.keywords,
      readingMins: article.he.readingMins || article.readingMins,
    };
  }
  return article;
};

/** Related reading: same category first, then anything else. */
export const relatedArticles = (article, count = 3) => {
  const others = ARTICLES.filter((a) => a.slug !== article.slug);
  const sameCategory = others.filter((a) => a.category && a.category === article.category);
  const rest = others.filter((a) => !sameCategory.includes(a));
  return [...sameCategory, ...rest].slice(0, count);
};
