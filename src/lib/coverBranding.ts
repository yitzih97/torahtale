// Shared "majestic" cover branding — colors, tagline, and title logic used by
// BOTH the print/PDF canvas renderer (generateBookPdf.ts) and the on-screen
// admin/wizard cover preview (components/wizard/BookViewer.tsx). Keeping this
// in one place is what keeps the two renderers from drifting apart.

export const COVER_NAVY = "#122140";
export const COVER_GOLD = "#e3c169";
export const COVER_MAGENTA = "#8f2b52";
export const FRONT_TAGLINE = "A Personalized Parsha Adventure";

/** How the personalized story title reads on the cover (magenta line). Falls back
 *  to the child's name if no creative title was generated. Returns an optional
 *  small child line only when the child isn't already named in the title. */
export function coverTitleParts(
  coverTitle: string | undefined,
  childName: string,
  parashaLabel = "",
): { title: string; childLine?: string } {
  const t = (coverTitle || "").trim();
  const child = (childName || "").trim();
  // No creative title, or it just repeats the parsha (older/impersonal books):
  // use the child's name as the magenta line instead of duplicating the gold
  // parsha title above it.
  if (!t || t.toLowerCase() === parashaLabel.trim().toLowerCase()) return { title: child || t };
  const named = child && t.toLowerCase().includes(child.split(/[&,]/)[0].trim().toLowerCase());
  return { title: t, childLine: named || !child ? undefined : child };
}
