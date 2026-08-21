/* ── Per-page casting ───────────────────────────────────────────────────────
 * The image model accepts only 4 reference attachments, and those slots are
 * SHARED with the recurring Torah characters - so putting every child on every
 * page starves Moshe and Dovid of a reference the moment a family has four kids.
 *
 * Above CAST_ALL_UPTO children we cast each page instead: a small subset of the
 * kids appears on any one page. That keeps every page inside the attachment
 * budget no matter how big the family is, and reads better besides - eight
 * children in every frame is a crowd, not a scene.
 *
 * The plan is computed HERE, in code, rather than left to the model, so the
 * distribution is even and testable. It is then handed to generate-story so the
 * page TEXT names the same children the illustration will show, and stored on
 * each page so a resumed generation re-uses the identical plan.
 *
 * Pure and dependency-free on purpose: the Deno edge function and the Vitest
 * suite both import this same file.
 */

/** At or below this many children, everyone appears on every page (old behaviour). */
export const CAST_ALL_UPTO = 4;

/** Children per page once casting kicks in - leaves a slot for a story character. */
export const CAST_PER_PAGE = 3;

/**
 * Which children appear on each story page.
 *
 * Returns one entry per page, each a list of child names. Appearances are spread
 * as evenly as the page count allows (never more than one apart), a child never
 * appears twice on the same page, and the grouping rotates so the same children
 * are not permanently paired.
 */
export function buildCastingPlan(names: string[], pageCount: number): string[][] {
  if (names.length === 0 || pageCount <= 0) return [];
  // Small families: everyone on every page, exactly as the book worked before.
  if (names.length <= CAST_ALL_UPTO) {
    return Array.from({ length: pageCount }, () => [...names]);
  }

  const plan: string[][] = [];
  let cursor = 0;   // position in the repeating cast cycle
  let rotation = 0; // rotates the base order each full pass, so pairings vary
  let order = [...names];

  for (let i = 0; i < pageCount; i++) {
    const page: string[] = [];
    for (let k = 0; k < Math.min(CAST_PER_PAGE, names.length); k++) {
      page.push(order[cursor % order.length]);
      cursor++;
      // A full pass through the cast: rotate so the same children are not
      // grouped together page after page.
      if (cursor % order.length === 0) {
        rotation++;
        const r = rotation % names.length;
        order = [...names.slice(r), ...names.slice(0, r)];
        cursor = 0;
      }
    }
    plan.push(page);
  }
  return plan;
}

/** A human-readable plan for the story prompt: "Page 1: Ari, Adina". */
export function describeCastingPlan(plan: string[][]): string {
  return plan.map((cast, i) => `Page ${i + 1}: ${cast.join(", ")}`).join("\n");
}
