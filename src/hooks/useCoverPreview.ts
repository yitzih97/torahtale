import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** How many times a customer may re-roll their cover in one checkout. */
export const COVER_PREVIEW_REGEN_LIMIT = 2;

const STORAGE_KEY = "torahtale_cover_preview";

export interface CoverPreviewState {
  /** The generated cover, as a data/URL string. */
  url: string | null;
  loading: boolean;
  /** How many regenerations have been spent this checkout. */
  regens: number;
  error: string | null;
  /** Identifies which inputs the current image belongs to. */
  key: string | null;
}

const empty: CoverPreviewState = { url: null, loading: false, regens: 0, error: null, key: null };

/** A stable id for a photo, ignoring any signature/expiry on a signed URL. */
const photoIdentity = (src: string): string => {
  if (src.startsWith("data:")) return `d${src.length}:${src.slice(-24)}`;
  try { return new URL(src).pathname; } catch { return src.split("?")[0]; }
};

const load = (): CoverPreviewState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const p = JSON.parse(raw);
    return { ...empty, ...p, loading: false, error: null };
  } catch { return empty; }
};

const save = (s: CoverPreviewState) => {
  try {
    // The image can be a multi-MB data URL; keep it out of the quota-limited
    // slot and store only what is needed to survive a reload.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ regens: s.regens, key: s.key }));
  } catch { /* quota - the preview simply regenerates */ }
};

interface Inputs {
  /** Cropped photo of the child, as a data URL. Generation waits for this. */
  referenceImage?: string | null;
  childName?: string;
  age?: string | number;
  torahPortion?: string;
  artStyle?: string;
  /** Extra children on the book, so a sibling cover shows both. */
  childRefs?: Array<{ name: string; age?: string | number; gender?: string; photoUrl?: string | null }>;
  enabled?: boolean;
}

/**
 * Generates the customer's REAL cover in the background as soon as both halves
 * of it are known - the child's photo and the chosen story - so that by the time
 * they reach the summary the book they are buying is already on screen.
 *
 * It is deliberately a plain illustration, not a mock-up printed onto a book:
 * the format they picked doesn't change the artwork, and a flat cover reads
 * better at the moment of purchase than a perspective render of a product.
 *
 * A customer may re-roll it COVER_PREVIEW_REGEN_LIMIT times per checkout. The
 * count is keyed to the checkout (not the image), so switching story or photo
 * regenerates for free but re-rolling the same one is capped.
 */
export function useCoverPreview(inputs: Inputs) {
  const { referenceImage, childName, age, torahPortion, artStyle, childRefs, enabled = true } = inputs;
  const [state, setState] = useState<CoverPreviewState>(load);
  const inFlight = useRef<string | null>(null);

  // Which inputs the current image belongs to - a change here is a NEW cover,
  // not a regeneration, so it must not consume the customer's allowance.
  //
  // The photo identity has to be STABLE. A saved child's photo arrives as a
  // signed storage URL whose token carries iat/exp and is re-issued on every
  // new session, so keying on the raw string (or its tail, which IS the
  // signature) produced a different key each time - silently regenerating the
  // cover at real cost and resetting the customer's allowance to two again.
  // The path identifies the photo; the query string only signs it.
  const key = referenceImage && torahPortion
    ? `${torahPortion}|${childName || ""}|${photoIdentity(referenceImage)}`
    : null;

  const run = useCallback(async (nextKey: string, isRegen: boolean) => {
    if (inFlight.current === nextKey && !isRegen) return;
    inFlight.current = nextKey;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          pageType: "cover",
          childName,
          age: String(age ?? ""),
          artStyle: artStyle || "3d-pixar",
          torahPortion,
          referenceImage,
          childRefs: childRefs?.length ? childRefs : undefined,
          // A preview only - never bound to a book row, so nothing it produces
          // can be mistaken for the finished article.
          promptAdditions:
            "This is a COVER PREVIEW for the customer: a single beautiful cover " +
            "illustration of the child inside this story. Leave the upper third " +
            "uncluttered. Do NOT draw any text, title, lettering or logo.",
        },
      });
      if (error) throw new Error(error.message);
      const url = (data as any)?.imageUrl;
      if (!url) throw new Error("No image returned");
      setState((s) => {
        const next = { ...s, url, loading: false, error: null, key: nextKey,
                       regens: isRegen ? s.regens + 1 : s.regens };
        save(next);
        return next;
      });
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e?.message || "Could not create the preview" }));
    } finally {
      inFlight.current = null;
    }
  }, [childName, age, artStyle, torahPortion, referenceImage, childRefs]);

  // Background generation the moment photo + story are both known.
  useEffect(() => {
    if (!enabled || !key) return;
    if (state.key === key && state.url) return;      // already have this one
    if (state.loading) return;
    // A different story/photo starts a fresh cover and a fresh allowance.
    if (state.key && state.key !== key) {
      setState((s) => { const n = { ...s, regens: 0, url: null, key: null }; save(n); return n; });
    }
    void run(key, false);
  }, [enabled, key, state.key, state.url, state.loading, run]);

  const regenerate = useCallback(() => {
    if (!key || state.loading) return;
    if (state.regens >= COVER_PREVIEW_REGEN_LIMIT) return;
    void run(key, true);
  }, [key, state.loading, state.regens, run]);

  return {
    ...state,
    regenerate,
    regensLeft: Math.max(0, COVER_PREVIEW_REGEN_LIMIT - state.regens),
    canRegenerate: !!state.url && !state.loading && state.regens < COVER_PREVIEW_REGEN_LIMIT,
  };
}
