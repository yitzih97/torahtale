import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Public Google Web client id (safe to ship). Override per-env if needed.
const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ||
  "360547523990-amlva4um8mec2uc9acg9lto8ctnusegv.apps.googleusercontent.com";

const GSI_SRC = "https://accounts.google.com/gsi/client";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (cfg: Record<string, unknown>) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

function loadGsi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("GSI load error")));
      return;
    }
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(s);
  });
}

/**
 * Google One Tap auto-login. Shows the top-right "Sign in with Google" prompt
 * to logged-out visitors site-wide (except the dedicated auth pages), and
 * silently re-signs returning users (auto_select). On accept it exchanges the
 * Google ID token for a Supabase session via signInWithIdToken — no redirect.
 */
export function GoogleOneTap() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const initialized = useRef(false);

  // Re-arm the prompt after a sign-out so it can appear again next visit.
  useEffect(() => {
    if (user) initialized.current = false;
  }, [user]);

  useEffect(() => {
    if (loading || user) return;
    if (location.pathname === "/auth" || location.pathname === "/reset-password") return;
    if (!GOOGLE_CLIENT_ID || initialized.current) return;

    let cancelled = false;
    loadGsi()
      .then(async () => {
        if (cancelled || initialized.current || !window.google?.accounts?.id) return;
        initialized.current = true;
        // Google One Tap + Supabase require a MATCHING nonce, or sign-in fails
        // with "Passed nonce and nonce in id_token should either both exist or
        // not." Google embeds the value we pass to initialize() into the ID
        // token's `nonce` claim; Supabase SHA-256-hashes the raw nonce we pass
        // to signInWithIdToken and compares. So: hashed nonce → Google, raw
        // nonce → Supabase.
        const rawNonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
        const hashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawNonce));
        const hashedNonce = Array.from(new Uint8Array(hashBuf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        if (cancelled || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          auto_select: true, // silently re-sign returning users
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: true, // required by modern Chrome
          nonce: hashedNonce,
          callback: async (response: { credential?: string }) => {
            if (!response?.credential) return;
            const { error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
              nonce: rawNonce,
            });
            if (error) {
              console.error("One Tap sign-in failed:", error);
              toast.error("Google sign-in failed.");
              return;
            }
            toast.success("Signed in with Google");
            // AuthContext's onAuthStateChange picks up the new session; no redirect
            // so the visitor stays exactly where they were.
          },
        });
        window.google.accounts.id.prompt();
      })
      .catch((e) => console.warn("Google One Tap unavailable:", e));

    return () => {
      cancelled = true;
    };
  }, [user, loading, location.pathname]);

  return null;
}
