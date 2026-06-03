# Make Admin "Generate Book" Use Admin Prompts + Consistent Characters

## Problems found

1. **`AdminBookGenerationModal.tsx` (lines 195–221) hardcodes its own prompt** for every page (cover, back cover, questions, story) and passes it as `prompt` to `generate-image`. The edge function's priority chain is `prompt → page template → custom global template → default`, so an explicit `prompt` **always wins**, meaning the admin's per-page `book-templates` image prompts and global `image-prompt-template` are **silently ignored** during admin generation. Same for master rules being bypassed when `prompt` is set.

2. **Only the first child's character sheet + photo is sent** (`primaryCharacterSheet`, `primaryChildPhoto`). When a book has 2+ kids, the others have no visual lock and drift between pages.

3. **`pageNumber` is mis-mapped**: story pages pass `i` (the array index, which includes the cover offset) instead of the actual story page number, so per-page admin templates keyed `parshah:page-N:image-prompt` never match.

4. `generate-story` already loads admin templates correctly — no change needed there beyond confirming the admin modal passes `torahPortionLabel` (currently it passes the slug as both). Minor.

## Changes

### 1. `src/components/admin/AdminBookGenerationModal.tsx`

- **Remove the hardcoded `prompt` strings.** Let `generate-image` build the prompt from admin templates + master rules + defaults. Only pass `prompt` as a fallback when neither a page template nor a global template exists — simplest: never pass `prompt` from admin flow and let the edge function handle it (it already has a strong default for the no-template case).
- **Fix `pageNumber`**: compute the real story page number (1-based, excluding cover). Pass `pageNumber` only for `story` pages; pass `pageType: "cover" | "back-cover" | "questions" | "story"` faithfully (today `questions` is rewritten to `story`).
- **Generate a character sheet for every child** (already loops) and **send all of them**: pass `characterSheets: Record<name, dataUrl>` and `childDescriptions: [{name, age, gender, description, photoUrl}]` to `generate-image` instead of only the primary one. Keep `characterSheet`/`referenceImage`/`childDescription` for back-compat with the primary.
- Pass a human `torahPortionLabel` (use `getPortionDisplay`) in addition to the slug to `generate-story`.

### 2. `supabase/functions/generate-image/index.ts`

- Accept new optional fields: `characterSheets` (object map name→url/dataUrl) and `childDescriptions` (array). When present:
  - Inject **all** character sheets into the Gemini `parts` array (cap at 4 to stay within model limits).
  - Build a multi-child consistency preamble: "The attached reference sheets show each child by name: Sheet 1 = {name1}, Sheet 2 = {name2}… You MUST reproduce each child identically to their own sheet on every page; do not swap features between them."
  - Append per-child descriptions to the prompt ("{name}: {description}").
- Keep current single-sheet path as fallback.
- Tighten the existing consistency wording so it explicitly says "identical across every page of this book."
- Allow the `questions` page type to flow through (don't collapse to `story`) so an admin `parshah:questions:image-prompt` template could later be supported; for now it falls through to default if no template.

### 3. `src/components/admin/AdminBookGenerationModal.tsx` — story call

- Pass `torahPortionLabel: getPortionDisplay(book.torah_portion, "en")` so the story prompt reads "Parashas Bereishis" instead of the slug.

## Files touched

- `src/components/admin/AdminBookGenerationModal.tsx` — drop hardcoded image prompts, fix pageNumber/pageType, send all character sheets + descriptions, pass torahPortionLabel.
- `supabase/functions/generate-image/index.ts` — accept multi-child references, build multi-character consistency instruction, strengthen consistency wording.

## Out of scope

- No DB schema changes.
- No UI changes to the admin modal itself (still shows progress and viewer).
- Story generation function untouched (already honors `book-templates` + master rules).
