

## Plan: SEO & Meta Tags Control Center in Admin CMS

### What We're Building
A new **"SEO"** tab in the Admin CMS that gives full control over all meta tags, Open Graph data, favicon, robots.txt directives, and structured data — all saved to `site_settings` and applied dynamically at runtime.

### New Tab: SEO (in AdminCMS)

The tab will have these sections:

**1. General Meta**
- Page title (`<title>`)
- Meta description
- Meta author
- Canonical URL

**2. Open Graph (Facebook/LinkedIn)**
- `og:title`, `og:description`, `og:type`, `og:image`, `og:url`

**3. Twitter Card**
- `twitter:card`, `twitter:site`, `twitter:title`, `twitter:description`, `twitter:image`

**4. Favicon**
- Upload a custom favicon (stored in `site-images` bucket as `favicon`)
- Preview of current favicon

**5. Robots / Indexing**
- `robots` meta tag (index/noindex, follow/nofollow)
- Google site verification code
- Bing site verification code

### How It Works

All values are stored in `site_settings` with `category = "seo"`. A new `useMetaTags` hook reads these settings and dynamically updates `document.head` meta tags on every page load using `useEffect`. The favicon `<link>` element is also updated dynamically.

### Changes

| File | Change |
|------|--------|
| `src/components/admin/AdminCMS.tsx` | Add "SEO" tab with fields for all meta tags, OG tags, Twitter cards, favicon upload, and robots directives |
| `src/hooks/useMetaTags.ts` | New hook that reads `site_settings` (category "seo") and dynamically sets `<title>`, `<meta>`, `<link rel="icon">` in document head |
| `src/App.tsx` | Mount `useMetaTags` hook at app root so meta tags apply globally |
| `index.html` | Keep current defaults as fallbacks (the hook overrides them at runtime) |

### Technical Notes
- Uses existing `site_settings` table and `useSiteSettings` hook — no database migration needed
- Favicon upload reuses the existing `site-images` bucket and `useSiteAssets` upload pattern already in AdminCMS
- Meta tags are applied via `document.querySelector` + `setAttribute` for SSR-unfriendly but functional client-side approach (standard for SPAs)
- Grid layout changes from `grid-cols-8` to `grid-cols-9` to fit the new SEO tab

