import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** How many times a customer may re-roll their cover in one checkout. */
export const COVER_PREVIEW_REGEN_LIMIT = 2;

/**
 * Running out of re-rolls usually means the photo is the problem, not the
 * model - a dark shot, a side profile, the wrong child in frame. So a customer
 * may replace the photo and earn one more set of re-rolls. ONE more: past that
 * the answer is a better photo, not more rolls, and each roll costs a real
 * image generation.
 */
export const COVER_PREVIEW_RETAKE_LIMIT = 1;

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
  /** The cover the customer explicitly chose to keep, if they chose one. */
  savedUrl: string | null;
  /** The inputs that saved cover belongs to - a new photo/story retires it. */
  savedKey: string | null;
  /** How many times they have replaced the photo to earn more re-rolls. */
  retakes: number;
}

const empty: CoverPreviewState = {
  url: null, loading: false, regens: 0, error: null, key: null,
  savedUrl: null, savedKey: null, retakes: 0,
};

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

const persist = (s: CoverPreviewState) => {
  try {
    // The image can be a multi-MB data URL; keep it out of the quota-limited
    // slot and store only what is needed to survive a reload. The SAVED cover is
    // a short storage URL, and losing it would silently un-choose the customer's
    // choice, so that one is kept.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      regens: s.regens, key: s.key, savedUrl: s.savedUrl, savedKey: s.savedKey, retakes: s.retakes,
    }));
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
  //
  // Every child's photo counts, not just the primary's: a sibling's replacement
  // photo changes the cover as much as the star's does, and if it did not move
  // the key the customer would replace a photo and watch nothing happen.
  const refsIdentity = (childRefs || [])
    .map((c) => `${c.name}:${c.photoUrl ? photoIdentity(c.photoUrl) : ""}`)
    .join(",");
  const key = referenceImage && torahPortion
    ? `${torahPortion}|${childName || ""}|${photoIdentity(referenceImage)}|${refsIdentity}`
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
        persist(next);
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
    // A different story/photo starts a fresh cover and a fresh allowance. A
    // cover saved against the OLD inputs is retired with them - it is a picture
    // of a different child or a different story, so it can no longer stand as
    // "the character this book stars".
    if (state.key && state.key !== key) {
      setState((s) => {
        const n = { ...s, regens: 0, url: null, key: null, savedUrl: null, savedKey: null };
        persist(n);
        return n;
      });
    }
    void run(key, false);
  }, [enabled, key, state.key, state.url, state.loading, run]);

  const regenerate = useCallback(() => {
    if (!key || state.loading) return;
    if (state.regens >= COVER_PREVIEW_REGEN_LIMIT) return;
    void run(key, true);
  }, [key, state.loading, state.regens, run]);

  /**
   * Keep the cover that is on screen. Returns the URL so the caller can write it
   * onto the book - a saved cover is not decoration, it is the customer saying
   * "THIS is what my child looks like in this book", and the pages are drawn
   * from it.
   */
  const save = useCallback((): string | null => {
    const url = state.url, savedFor = state.key;
    if (!url || !savedFor) return null;
    setState((s) => {
      const n = { ...s, savedUrl: url, savedKey: savedFor };
      persist(n);
      return n;
    });
    return url;
  }, [state.url, state.key]);

  /** Spend the one photo retake: a new photo re-keys the cover, which hands back
      a fresh set of re-rolls, so the retake itself has to be counted here. */
  const noteRetake = useCallback(() => {
    setState((s) => {
      const n = { ...s, retakes: s.retakes + 1 };
      persist(n);
      return n;
    });
  }, []);

  const outOfRegens = state.regens >= COVER_PREVIEW_REGEN_LIMIT;

  return {
    ...state,
    regenerate,
    save,
    noteRetake,
    regensLeft: Math.max(0, COVER_PREVIEW_REGEN_LIMIT - state.regens),
    canRegenerate: !!state.url && !state.loading && state.regens < COVER_PREVIEW_REGEN_LIMIT,
    /** True when the cover on screen is the one the customer chose to keep. */
    saved: !!state.url && state.savedUrl === state.url && state.savedKey === state.key,
    /** Offer a new photo only once the re-rolls are gone, and only once. */
    canRetakePhoto: outOfRegens && !state.loading && state.retakes < COVER_PREVIEW_RETAKE_LIMIT,
  };
}
