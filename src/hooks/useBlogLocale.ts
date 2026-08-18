import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * The Hebrew blog lives at its own URLs (/he/blog, /he/blog/:slug) because its
 * articles are written in Hebrew rather than translated, and a page only ranks
 * in Hebrew if it has a Hebrew URL of its own to rank.
 *
 * The URL — not the stored site language — decides which language an article is
 * served in. That is what keeps the two apart: /blog is always English and
 * /he/blog is always Hebrew, so a page can never come out half in one language
 * and half in the other. The two ways a reader can end up on the "wrong" one are
 * both corrected here:
 *
 *   • Arriving on /he/blog from a Hebrew search result switches the site to
 *     Hebrew — that reader should get the Hebrew site, not an English shell.
 *   • A reader already browsing in Hebrew who opens an English blog URL is sent
 *     to the Hebrew one, rather than being shown English inside a Hebrew site.
 *
 * The language switcher still works normally afterwards; switching to English
 * on a Hebrew article moves to the English URL for the same slug.
 */
export const useBlogLocale = () => {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const hebrewRoute = pathname.startsWith("/he/blog");
  const siteHe = lang === "he" || lang === "yi";
  // Which path the force-switch has already been applied to. Arriving on a
  // Hebrew URL sets the site to Hebrew once; after that the reader is free to
  // switch, and switching moves them to the other language's URL instead of
  // being pulled straight back.
  const arrivedAt = useRef<string | null>(null);

  useEffect(() => {
    const justArrived = arrivedAt.current !== pathname;
    arrivedAt.current = pathname;

    if (hebrewRoute) {
      if (justArrived) {
        if (!siteHe) setLang("he");
        return;
      }
      // Switched to English while reading a Hebrew article → English twin.
      if (!siteHe) navigate(`${pathname.replace(/^\/he/, "")}${search}${hash}`, { replace: true });
      return;
    }
    // English URL while the site is Hebrew → Hebrew twin.
    if (siteHe && pathname.startsWith("/blog")) {
      navigate(`/he${pathname}${search}${hash}`, { replace: true });
    }
  }, [hebrewRoute, siteHe, pathname, search, hash, setLang, navigate]);

  // Route-derived, never language-derived: /blog renders English even for the
  // instant before a redirect lands, so a page is never half-translated.
  const isHe = hebrewRoute;

  return {
    isHe,
    hebrewRoute,
    /** Where this article or index lives in the language currently shown. */
    blogPath: (slug?: string) =>
      `${isHe ? "/he" : ""}/blog${slug ? `/${slug}` : ""}`,
  };
};

/** The blog index in a given site language — for nav and footer links. */
export const blogHref = (lang: string) =>
  lang === "he" || lang === "yi" ? "/he/blog" : "/blog";
