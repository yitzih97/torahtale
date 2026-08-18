import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * The Hebrew blog lives at its own URLs (/he/blog, /he/blog/:slug) because its
 * articles are written in Hebrew rather than translated, and a page only ranks
 * in Hebrew if it has a Hebrew URL of its own to rank.
 *
 * Arriving on one switches the site to Hebrew — a reader who lands there from a
 * Hebrew search result should get the Hebrew site, not an English shell. The
 * language switcher still works normally afterwards.
 */
export const useBlogLocale = () => {
  const { pathname } = useLocation();
  const { lang, setLang } = useLanguage();
  const hebrewRoute = pathname.startsWith("/he/blog");

  useEffect(() => {
    if (hebrewRoute && lang !== "he" && lang !== "yi") setLang("he");
  }, [hebrewRoute, lang, setLang]);

  const isHe = hebrewRoute || lang === "he" || lang === "yi";
  return {
    isHe,
    hebrewRoute,
    /** Where this article or index lives in the language currently shown. */
    blogPath: (slug?: string) =>
      `${isHe ? "/he" : ""}/blog${slug ? `/${slug}` : ""}`,
  };
};
