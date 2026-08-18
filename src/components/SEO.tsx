import { Helmet } from "react-helmet-async";

const SITE_URL = "https://torahtale.com";

// Note: scripts/prerender.mjs writes the real per-route head tags into the
// static HTML, and that is what crawlers read. This component keeps the SPA's
// head correct for in-app navigation; the two are kept in step by hand.

interface SEOProps {
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article";
  jsonLd?: object | object[];
  /** Language of this page's content, when it isn't the English default. */
  locale?: "en" | "he";
  /**
   * hreflang alternates, as `{ en: "/blog/x", he: "/he/blog/x" }`. Used by the
   * blog, where the Hebrew article is a separately written page at its own URL
   * rather than a translation of the English one.
   */
  alternates?: Partial<Record<"en" | "he", string>>;
}

export const SEO = ({
  title,
  description,
  path,
  ogType = "website",
  jsonLd,
  locale = "en",
  alternates,
}: SEOProps) => {
  const url = `${SITE_URL}${path}`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const alternateEntries = Object.entries(alternates || {}) as ["en" | "he", string][];
  return (
    <Helmet>
      {/* No <html lang> here: this Helmet build silently drops the whole tag
          set when given one. LanguageContext already sets lang/dir on the
          document, and the prerender writes them into the static HTML. */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {alternateEntries.map(([lang, href]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={`${SITE_URL}${href}`} />
      ))}
      {alternates?.en && (
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${alternates.en}`} />
      )}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:locale" content={locale === "he" ? "he_IL" : "en_US"} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
};
