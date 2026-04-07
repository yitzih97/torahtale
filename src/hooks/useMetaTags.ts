import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSiteAssets } from "@/hooks/useSiteAssets";

function setMeta(attr: string, attrValue: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${attrValue}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useMetaTags() {
  const { getSetting, isLoading } = useSiteSettings();
  const { getAssetUrl } = useSiteAssets();

  useEffect(() => {
    if (isLoading) return;

    const get = (key: string, fallback: string) => getSetting("seo", key, fallback);

    // Title
    const title = get("title", "");
    if (title) document.title = title;

    // Basic meta
    const desc = get("description", "");
    if (desc) setMeta("name", "description", desc);

    const author = get("author", "");
    if (author) setMeta("name", "author", author);

    const robots = get("robots", "");
    if (robots) setMeta("name", "robots", robots);

    // Canonical
    const canonical = get("canonical-url", "");
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    // Open Graph
    const ogTitle = get("og-title", "");
    if (ogTitle) setMeta("property", "og:title", ogTitle);

    const ogDesc = get("og-description", "");
    if (ogDesc) setMeta("property", "og:description", ogDesc);

    const ogType = get("og-type", "");
    if (ogType) setMeta("property", "og:type", ogType);

    const ogImage = get("og-image", "");
    if (ogImage) setMeta("property", "og:image", ogImage);

    const ogUrl = get("og-url", "");
    if (ogUrl) setMeta("property", "og:url", ogUrl);

    // Twitter
    const twCard = get("twitter-card", "");
    if (twCard) setMeta("name", "twitter:card", twCard);

    const twSite = get("twitter-site", "");
    if (twSite) setMeta("name", "twitter:site", twSite);

    const twTitle = get("twitter-title", "");
    if (twTitle) setMeta("name", "twitter:title", twTitle);

    const twDesc = get("twitter-description", "");
    if (twDesc) setMeta("name", "twitter:description", twDesc);

    const twImage = get("twitter-image", "");
    if (twImage) setMeta("name", "twitter:image", twImage);

    // Verification codes
    const googleVerify = get("google-verification", "");
    if (googleVerify) setMeta("name", "google-site-verification", googleVerify);

    const bingVerify = get("bing-verification", "");
    if (bingVerify) setMeta("name", "msvalidate.01", bingVerify);

    // Favicon from site_assets or seo setting
    const faviconUrl = getAssetUrl("favicon", "");
    if (faviconUrl) {
      let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "icon");
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
      link.type = faviconUrl.endsWith(".svg") ? "image/svg+xml" : "image/png";
    }
  }, [isLoading, getSetting, getAssetUrl]);
}
