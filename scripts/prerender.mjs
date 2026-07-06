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

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ARTICLES } from "../src/content/blog.mjs";

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
      ${ARTICLES.map((a) => `<li><a href="/blog/${a.slug}">${esc(a.title)}</a> — ${esc(a.excerpt)}</li>`).join("\n      ")}
    </ul>
  </main>`;

const articleHtml = (a) => `
  <main>
    <article>
      <h1>${esc(a.title)}</h1>
      <p>${esc(a.excerpt)}</p>
      ${a.bodyHtml}
      <p><a href="/create">Create a personalized Torah storybook</a></p>
    </article>
  </main>`;

const articleJsonLd = (a) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: a.title,
  description: a.description,
  datePublished: a.dateISO,
  dateModified: a.dateISO,
  image: `${SITE}/og-image.jpg`,
  url: `${SITE}/blog/${a.slug}`,
  author: { "@type": "Organization", name: "Torah Tale" },
  publisher: { "@type": "Organization", name: "Torah Tale", logo: { "@type": "ImageObject", url: `${SITE}/apple-touch-icon.png` } },
  mainEntityOfPage: `${SITE}/blog/${a.slug}`,
});

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
