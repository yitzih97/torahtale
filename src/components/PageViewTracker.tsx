import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/** Stable per-browser-session id so repeat views within one visit dedupe. */
const sessionId = (() => {
  try {
    let id = sessionStorage.getItem("tt_session");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("tt_session", id);
    }
    return id;
  } catch {
    return null;
  }
})();

/**
 * First-party page-view tracking for the admin analytics dashboard.
 * One insert per path per session, fire-and-forget — never blocks the UI and
 * failures are silently ignored. Admin pages are excluded.
 */
export const PageViewTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const key = `tt_pv:${pathname}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch { /* storage unavailable — still record the view */ }
    // "page_views" is newer than the generated Supabase types — cast until regenerated.
    void supabase.from("page_views" as never).insert({
      path: pathname,
      session_id: sessionId,
      referrer: document.referrer ? document.referrer.slice(0, 300) : null,
    } as never).then(() => undefined, () => undefined);
  }, [pathname]);

  return null;
};
