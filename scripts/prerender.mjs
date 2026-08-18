// Post-build static pre-rendering for the SPA.
//
// GitHub Pages serves a static shell for every route, and crawlers index
// whatever HTML they get FIRST — before React boots. This script takes the
// built dist/index.html and, for each public route, writes a dedicated
// dist/<route>/index.html with (a) the correct per-route <title>, description,
// canonical + OG/Twitter tags, (b) route-specific JSON-LD, and (c) real
// pre-rendered body content inside #root. React replaces #root on mount, so
// users still get the full SPA — but Google sees a proper, unique page per URL.
//
// Runs as part of `npm run build` (vite build && node scripts/prerender.mjs),
// so both local builds and CI produce the static pages.

// It also emits the crawl/answer-engine surface that has to stay in step with
// the article list: sitemap.xml, rss.xml, llms.txt and llms-full.txt. Those are
// generated from ARTICLES rather than hand-maintained, so a blog post the daily
// agent commits is discoverable the moment it deploys.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ARTICLES, renderArticleHtml, stripHtml } from "../src/content/blog/index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "dist");
const SITE = "https://torahtale.com";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const template = readFileSync(join(DIST, "index.html"), "utf8");

// ── Static per-route body content (crawlable; replaced by React on mount) ────
const HOME_HTML = `
  <main>
    <h1>Personalized Torah Storybooks Starring Your Child</h1>
    <p>Torah Tale creates one-of-a-kind, AI-personalized Torah storybooks where your own child is the hero of the weekly parsha — made with careful rabbinical guidance and strict tznius, illustrated in high-resolution 3D Pixar style, and printed and delivered to your door.</p>
    <h2>How it works</h2>
    <ol>
      <li>Add your child's name, age, and a photo.</li>
      <li>Choose this week's parsha (selected automatically) or any Torah story or Yom Tov.</li>
      <li>Pick English, Hebrew, or Yiddish.</li>
      <li>We generate a complete, kosher story with your child as the hero — illustrated in movie-quality 3D Pixar style.</li>
      <li>Order a softcover, hardcover keepsake, or board book (with an optional matching coloring book) — or subscribe for a new book every week.</li>
    </ol>
    <p><a href="/create">Create your child's book</a> · <a href="/pricing">See pricing</a> · <a href="/blog">Read our guides</a></p>
  </main>`;

const blogIndexHtml = () => `
  <main>
    <h1>Torah Tale Blog — Guides to Personalized Torah Storybooks</h1>
    <p>Step-by-step guides and ideas for making personalized Torah storybooks for Jewish children.</p>
    <ul>
      ${ARTICLES.map((a) => `<li><a href="/blog/${a.slug}">${esc(a.title)}</a> — <time datetime="${esc(a.dateISO)}">${esc(a.date)}</time> — ${esc(a.excerpt)}</li>`).join("\n      ")}
    </ul>
  </main>`;

const articleHtml = (a) => `
  <main>
    <article>
      <h1>${esc(a.title)}</h1>
      <p>${esc(a.excerpt)}</p>
      <p>Published <time datetime="${esc(a.dateISO)}">${esc(a.date)}</time> by Torah Tale.</p>
      ${renderArticleHtml(a)}
      <p><a href="/create">Create a personalized Torah storybook</a></p>
    </article>
  </main>`;

const articleJsonLd = (a) => {
  const url = `${SITE}/blog/${a.slug}`;
  const graph = [
    {
      "@type": "BlogPosting",
      headline: a.title,
      description: a.description,
      datePublished: a.dateISO,
      dateModified: a.updatedISO || a.dateISO,
      image: `${SITE}/og-image.jpg`,
      url,
      keywords: a.keywords?.join(", "),
      inLanguage: "en",
      isAccessibleForFree: true,
      author: { "@type": "Organization", name: "Torah Tale", url: SITE },
      publisher: { "@type": "Organization", name: "Torah Tale", logo: { "@type": "ImageObject", url: `${SITE}/apple-touch-icon.png` } },
      mainEntityOfPage: url,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
        { "@type": "ListItem", position: 3, name: a.title, item: url },
      ],
    },
  ];
  if (a.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: a.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: stripHtml(f.a) },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
};

// ── Routes ───────────────────────────────────────────────────────────────────
const routes = [
  { path: "/", title: "Torah Tale — Personalized Torah Storybooks for Jewish Kids", description: "AI-personalized Torah storybooks starring your child, aligned with the weekly parsha and made with rabbinical guidance. Delivered to your door.", content: HOME_HTML },
  { path: "/about", title: "About Torah Tale — Our Story & Mission", description: "Meet the team behind Torah Tale. Learn how we craft AI-personalized Torah storybooks for Orthodox Jewish families with kedushah and care." },
  { path: "/pricing", title: "Pricing — Torah Tale Personalized Storybooks", description: "Simple pricing for personalized Torah storybooks — softcover, hardcover keepsakes, and board books, plus weekly, monthly, and yearly parsha subscriptions." },
  { path: "/faq", title: "FAQ — Torah Tale", description: "Answers to common questions about Torah Tale's personalized Torah storybooks: how they're made, tznius and rabbinical guidance, shipping, and subscriptions." },
  { path: "/testimonials", title: "Reviews — What Families Say About Torah Tale", description: "Read what frum families say about their personalized Torah Tale storybooks for their children." },
  { path: "/contact", title: "Contact Torah Tale", description: "Get in touch with the Torah Tale team. We're happy to help with your personalized Torah storybook order." },
  { path: "/affiliates", title: "Affiliate Program — Torah Tale", description: "Earn by sharing Torah Tale's personalized Torah storybooks with your community. Join the affiliate program." },
  { path: "/create", title: "Create Your Child's Torah Storybook — Torah Tale", description: "Start building a personalized Torah storybook starring your child in about five minutes. Choose the parsha, language, and book format." },
  { path: "/blog", title: "Torah Tale Blog — Guides to Personalized Torah Storybooks", description: "Step-by-step guides and ideas for making personalized Torah storybooks for Jewish kids — choosing the weekly parsha, gift ideas, and how it works.", content: blogIndexHtml() },
  { path: "/terms", title: "Terms of Service — Torah Tale", description: "Torah Tale's terms of service." },
  { path: "/privacy", title: "Privacy Policy — Torah Tale", description: "How Torah Tale handles your data and your child's photos with care." },
  ...ARTICLES.map((a) => ({
    path: `/blog/${a.slug}`,
    title: `${a.title} — Torah Tale`,
    description: a.description,
    content: articleHtml(a),
    ogType: "article",
    jsonLd: articleJsonLd(a),
  })),
];

const replaceTag = (html, re, replacement) => {
  if (re.test(html)) return html.replace(re, replacement);
  // If the tag is missing, inject before </head>.
  return html.replace("</head>", `    ${replacement}\n  </head>`);
};

let written = 0;
for (const r of routes) {
  const url = `${SITE}${r.path === "/" ? "/" : r.path}`;
  const title = esc(r.title);
  const desc = esc(r.description);
  let html = template;

  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = replaceTag(html, /<meta name="description"[^>]*>/, `<meta name="description" content="${desc}" />`);
  html = replaceTag(html, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);
  html = replaceTag(html, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}" />`);
  html = replaceTag(html, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${desc}" />`);
  html = replaceTag(html, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
  html = replaceTag(html, /<meta property="og:type"[^>]*>/, `<meta property="og:type" content="${r.ogType || "website"}" />`);
  html = replaceTag(html, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${title}" />`);
  html = replaceTag(html, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${desc}" />`);

  // Route-specific JSON-LD (the global Org/WebSite already lives in index.html head).
  if (r.jsonLd) {
    html = html.replace("</head>", `    <script type="application/ld+json">${JSON.stringify(r.jsonLd)}</script>\n  </head>`);
  }

  // Pre-rendered body content inside #root (React replaces it on mount).
  // Visually hidden so users never see raw text while the app boots —
  // crawlers still read it from the HTML.
  if (r.content) {
    const hidden = `<div style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0">${r.content}</div>`;
    html = html.replace(/<div id="root">\s*<\/div>/, `<div id="root">${hidden}</div>`);
  }

  const outPath = r.path === "/" ? join(DIST, "index.html") : join(DIST, r.path, "index.html");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, "utf8");
  written++;
}

console.log(`prerender: wrote ${written} static route pages`);

// ── Crawl + answer-engine surface ────────────────────────────────────────────
// All four files below are derived from `routes`/`ARTICLES`, so they can never
// fall behind the articles the daily blog agent commits. They overwrite the
// copies Vite lifted out of /public.

const today = new Date().toISOString().slice(0, 10);
const lastPost = ARTICLES[0]?.updatedISO || ARTICLES[0]?.dateISO || today;

const STATIC_PRIORITY = {
  "/": ["1.0", "weekly"],
  "/create": ["0.9", "weekly"],
  "/pricing": ["0.9", "weekly"],
  "/blog": ["0.8", "daily"],
  "/about": ["0.7", "monthly"],
  "/faq": ["0.7", "monthly"],
  "/affiliates": ["0.7", "monthly"],
  "/testimonials": ["0.6", "monthly"],
  "/contact": ["0.6", "monthly"],
  "/terms": ["0.3", "yearly"],
  "/privacy": ["0.3", "yearly"],
};

const sitemapUrls = [
  ...Object.entries(STATIC_PRIORITY).map(([path, [priority, changefreq]]) => ({
    loc: `${SITE}${path}`,
    lastmod: path === "/blog" ? lastPost : today,
    changefreq,
    priority,
  })),
  ...ARTICLES.map((a) => ({
    loc: `${SITE}/blog/${a.slug}`,
    lastmod: a.updatedISO || a.dateISO,
    changefreq: "monthly",
    priority: "0.8",
  })),
];

writeFileSync(
  join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
  )
  .join("\n")}
</urlset>\n`,
  "utf8"
);

const rfc822 = (iso) => new Date(`${iso}T12:00:00Z`).toUTCString();

writeFileSync(
  join(DIST, "rss.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Torah Tale Blog</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Guides, parsha stories, and gift ideas for personalized Torah storybooks starring your own child.</description>
    <language>en</language>
    <lastBuildDate>${rfc822(lastPost)}</lastBuildDate>
${ARTICLES.map(
  (a) => `    <item>
      <title>${esc(a.title)}</title>
      <link>${SITE}/blog/${a.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${a.slug}</guid>
      <pubDate>${rfc822(a.dateISO)}</pubDate>
      <description>${esc(a.description)}</description>
    </item>`
).join("\n")}
  </channel>
</rss>\n`,
  "utf8"
);

// llms.txt — the map an answer engine reads first.
writeFileSync(
  join(DIST, "llms.txt"),
  `# Torah Tale

> AI-personalized Torah storybooks for frum Yiddishe kinderlach. Each book stars your own child — by name and likeness — as the hero of a real Torah story, illustrated in high-resolution 3D Pixar style, written under rabbinical guidance with strict tznius, then printed and shipped worldwide.

Torah Tale (https://torahtale.com) creates custom hardcover, softcover and board books in English, Hebrew and Yiddish. Stories cover the weekly parsha, all of Tanach (Chumash, Nevi'im, Kesuvim, Megillos), the Yamim Tovim, and middos stories for everyday life. Books can be ordered one at a time or by weekly, monthly and yearly subscription. Standard shipping is free (5–7 business days); express is 2–3 business days.

## Pages

- [Home](${SITE}/): Overview, gallery, and how it works.
- [About](${SITE}/about): The story and values behind Torah Tale.
- [Pricing](${SITE}/pricing): Book formats, subscription plans, and one-time options.
- [Create](${SITE}/create): The personalization wizard — name, photo, story, language, format.
- [FAQ](${SITE}/faq): Shipping, customization, billing, and content questions.
- [Testimonials](${SITE}/testimonials): Reviews from families.
- [Contact](${SITE}/contact): Get in touch with the team.

## Blog

${ARTICLES.map((a) => `- [${a.title}](${SITE}/blog/${a.slug}): ${a.description}`).join("\n")}

## Optional

- [Full blog text](${SITE}/llms-full.txt): Every article in plain text.
- [RSS](${SITE}/rss.xml): New articles as they publish.
- [Terms](${SITE}/terms): Terms of service.
- [Privacy](${SITE}/privacy): Privacy policy.
`,
  "utf8"
);

// llms-full.txt — the whole blog corpus as plain text, so a model that follows
// the map above can read the substance without executing our JavaScript.
writeFileSync(
  join(DIST, "llms-full.txt"),
  `# Torah Tale — full blog text

Source: ${SITE}/blog
Generated: ${today}

${ARTICLES.map((a) =>
  [
    `## ${a.title}`,
    `URL: ${SITE}/blog/${a.slug}`,
    `Published: ${a.dateISO}${a.updatedISO ? ` (updated ${a.updatedISO})` : ""}`,
    `Summary: ${a.description}`,
    a.keyFacts?.length ? `Key facts:\n${a.keyFacts.map((f) => `- ${stripHtml(f)}`).join("\n")}` : "",
    stripHtml(a.bodyHtml),
    a.faq?.length
      ? `FAQ:\n${a.faq.map((f) => `Q: ${stripHtml(f.q)}\nA: ${stripHtml(f.a)}`).join("\n\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n")
).join("\n\n---\n\n")}
`,
  "utf8"
);

console.log(
  `prerender: wrote sitemap.xml (${sitemapUrls.length} urls), rss.xml, llms.txt, llms-full.txt`
);
