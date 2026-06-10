# Book spread redesign + auto-save

## 1. Auto-save in Admin generation modal

In `src/components/admin/AdminBookGenerationModal.tsx`:

- After the generation loop sets `phase = "done"`, immediately persist the result to the `books` row (same payload as the current `handleSave`: `pages_data`, `story_data`, `cover_image_url`, `status: "ordered"`).
- Add a debounced auto-save (~800ms) whenever `pages` changes after `phase === "done"`, so any text edit / image regen the admin makes inside `BookViewer` is persisted without clicking Save.
- Keep the manual Save / Approve buttons; they remain the explicit approve-to-Printify trigger.

## 2. New spread-style page layout

Update `src/components/wizard/BookViewer.tsx` to render each non-cover page as a two-page spread:

- Container becomes a 2:1 landscape spread (`aspect-[2/1]`) with a soft center gutter shadow.
- The story illustration bleeds across BOTH pages (full-width `object-cover`).
- Text sits over ONE half only, alternating sides based on story-page index:
  - odd story page → text panel on the LEFT half
  - even story page → text panel on the RIGHT half
- Text uses a fixed, book-wide style (no per-page font/size/color drift). A single shared constant `BOOK_TEXT_STYLE` (Cormorant Garamond, fixed pt size, fixed dark color, soft cream backdrop card with subtle shadow) replaces the per-page `textStyle`.
- `DraggableText` is removed from story pages; text is shown via a static styled block inside the chosen half. The "drag/double-click to edit" hint is removed; text editing keeps the existing Pencil → textarea flow.
- The Discussion-Questions page keeps its current layout but is rendered inside the same spread frame.

The shared style lives in a new export from `BookViewer.tsx` (also imported by the print pipeline) so the on-screen preview and the printed book stay identical.

## 3. Cover spread (shown once at start)

- The wizard generates only ONE cover page (no separate "back cover" page in the pages array). Drop generation/regen logic for the `back-cover` type from `BookViewer`, `AdminBookGenerationModal`, and any page-builder helpers; existing back-cover entries on legacy books are ignored at render time.
- Render the cover as a single 2:1 spread:
  - RIGHT half = front: illustration full-bleed with the book title (e.g. "Parashat Noach – with {childName(s)}") set in Playfair Display at the top in champagne gold, matching the inspiration.
  - LEFT half = back: cream background, Torah Tale logo centered top, the standard tagline ("Stories that inspire. / Values that last. / A love that grows.") in Cormorant Garamond, and `torahtale.com` at the bottom — Hebrew/Yiddish variants pulled from existing i18n strings.
- Page navigation: cover spread is index 0 and only appears once; story spreads follow.

## 4. Print PDF parity

Update `src/lib/generateBookPdf.ts` so the exported book mirrors the new layout:

- Page size switches to a landscape spread per sheet matching the on-screen 2:1 aspect.
- Cover sheet renders the back/front composition described above (logo + tagline on left, title + illustration on right).
- Story sheets composite the illustration full-bleed and draw the text block on the alternating half using the shared `BOOK_TEXT_STYLE` constants for font family, size, color, and padding.
- Discussion-questions sheet keeps its existing content but inside the spread frame.

## Technical notes

- New shared constant `BOOK_TEXT_STYLE` exported from `BookViewer.tsx` (font family, font size in px and pt, color, background, padding, max width %) used by both the viewer and `generateBookPdf.ts`.
- `BookPage.textStyle` becomes optional/ignored for story pages going forward; existing data isn't migrated, just visually overridden.
- Cover deduplication: when loading legacy `pages_data` that contains a `back-cover` entry, the viewer filters it out so old books render with the new single cover spread.
- Auto-save uses the existing `supabase.from("books").update(...)` call; no schema changes.
- No copy changes outside the cover tagline/URL, which already exist in i18n.

## Files touched

- `src/components/admin/AdminBookGenerationModal.tsx` — auto-save on done + debounced auto-save on edits; stop generating back-cover page.
- `src/components/wizard/BookViewer.tsx` — spread layout, alternating text side, fixed text style, single cover spread, export `BOOK_TEXT_STYLE`.
- `src/components/wizard/BookViewerModal.tsx` — container sizing for 2:1 spread.
- `src/lib/generateBookPdf.ts` — landscape spread output, cover composition, alternating text side using shared style.
- (If a separate cover/back-cover generator exists in the page-builder helper, it is updated to emit one cover page only.)
