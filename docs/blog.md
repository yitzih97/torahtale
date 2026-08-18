# The blog

`/blog` is part hand-written and part written daily by an agent. Both kinds of
article are ordinary files in `src/content/blog/`, so everything — review, edit,
revert — works the way it does for any other content.

```
src/content/blog/
  index.mjs      assembles ARTICLES, exports getArticle / localizeArticle / relatedArticles
  shared.mjs     figure helpers, the [[IMAGE:…]] token table, key-facts + FAQ rendering
  core/          hand-authored evergreen guides
  stories/       one article per story in the collections, written by the agent
```

Each article carries English fields at the top level and a `he` object with the
Hebrew version of everything a reader sees. `localizeArticle(article, lang)`
picks the right one (Yiddish falls back to Hebrew).

## The daily agent

`scripts/blog-agent.mjs` picks a story nobody has written about yet, has Claude
write it in English and Hebrew, validates the draft, and writes
`src/content/blog/stories/<slug>.mjs`.

**The Hebrew is written, not translated.** English and Hebrew come from two
independent calls that run concurrently and never see each other's output. The
Hebrew one is briefed in Hebrew, with its own product-fact sheet in Hebrew, and
is asked for its own title, meta description, headings, FAQ and search phrases —
because an Israeli parent searches `פרשת נח לילדים`, not a rendering of "Parshas
Noach for kids". Validation enforces it: Hebrew keywords must be Hebrew, and a
run of English prose in the Hebrew body is rejected outright.

It picks in this order:

1. a Yom Tov inside the next six weeks (from Hebcal — best-effort; a failed
   fetch just skips this step),
2. a parsha being read over the next four Shabbosos,
3. the next story in a rotation that interleaves Chumash, Yamim Tovim,
   Nevi'im, middos, Kesuvim and Megillos, so the archive grows broad rather
   than finishing Bereishis before it mentions Nevi'im.

```bash
node scripts/blog-agent.mjs --plan            # what would it write? (no API call)
node scripts/blog-agent.mjs                   # write today's article
node scripts/blog-agent.mjs --count 5         # backfill five
node scripts/blog-agent.mjs --topic noach     # force one story
node scripts/blog-agent.mjs --rewrite-hebrew <slug>   # rewrite one article's Hebrew from scratch
```

Needs `ANTHROPIC_API_KEY` and `npm install --no-save @anthropic-ai/sdk` (the
site's own dependencies stay untouched — the agent only runs in CI or locally).
`BLOG_MODEL` overrides the model, `BLOG_EFFORT` the effort level.

**What a generated article cannot do.** The model gets a fixed sheet of product
facts and nothing else, so it can't invent prices or promises. It may only link
to pages that exist and to already-published articles. It never writes `<img>`
tags — it places `[[IMAGE:cover]]`-style tokens that expand to real photos and
screenshots we have. Tags are allow-listed, the Hebrew body has to actually be
Hebrew, and the slug has to be new. A draft that breaks any of that goes back to
the model with the list of problems, twice; after that the run fails rather than
publishing something wrong. The rules are tested in
`src/test/blogAgent.test.ts`.

## Schedule

`.github/workflows/daily-blog.yml` runs at 07:00 ET, **Sunday through
Thursday** — nothing commits or deploys on erev Shabbos or Shabbos. To publish
seven days a week, change the cron's day-of-week field from `0-4` to `*`.

The workflow commits the new article and then calls the Pages deploy as a
reusable workflow. That chaining is deliberate: a push made with `GITHUB_TOKEN`
does not trigger other workflows, so leaving the deploy to the push event would
silently never run.

Run it by hand from the Actions tab (or `gh workflow run daily-blog.yml`), with
inputs for `count`, `topic`, and a `plan` dry run.

## Two languages, two URLs

The Hebrew article is a page in its own right, not a translation toggle:

| | English | Hebrew |
|---|---|---|
| Index | `/blog` | `/he/blog` |
| Article | `/blog/<slug>` | `/he/blog/<slug>` |

Each carries its own `<title>`, meta description, `BlogPosting`/`FAQPage`
structured data and `lang`/`dir`, and the pair is tied together with `hreflang`
(in the page head and in `sitemap.xml`), so Google serves the Hebrew page to
Hebrew searchers instead of reading the two as duplicates. Landing on a `/he/`
URL switches the site to Hebrew. `src/hooks/useBlogLocale.ts` is what the blog
pages use to know which language a URL serves.

## SEO and answer engines

`scripts/prerender.mjs` writes a static page per route and regenerates
`sitemap.xml`, `rss.xml`, `llms.txt` and `llms-full.txt` from `ARTICLES` at
build time — a committed article is crawlable the moment it deploys. Don't
hand-maintain those four files; they are outputs.

Every article renders a short "The short answer" block up top and a FAQ at the
bottom, and both feed structured data (`BlogPosting`, `BreadcrumbList`,
`FAQPage`). That's the same reason `llms-full.txt` exists: an answer engine can
read the whole corpus as plain text without running our JavaScript.

## Screenshots

The step-by-step guide is illustrated with screenshots of the real wizard,
captured by `scripts/capture-wizard-shots.mjs`:

```bash
npm run dev
node scripts/capture-wizard-shots.mjs             # English
node scripts/capture-wizard-shots.mjs --lang he   # Hebrew
```

It drives the wizard through the `?shots` gate in `src/pages/Create.tsx`, which
exists only in dev builds. **Re-run it whenever the creation flow changes**, and
re-read the guide while you're there — the words drift with the screens.
