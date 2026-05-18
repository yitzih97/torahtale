## Goals

1. Use OpenAI **`gpt-image-2`** (newest) for all book illustrations.
2. Pass the child's uploaded reference photo into every page generation and strengthen the prompt so the AI faithfully mimics the child.
3. Make the number of story pages depend on the chosen book type: **softcover = 20, hardcover = 20, board = 10**.
4. Generate every page (covers + interior) as a **1:1 square** illustration, and render/export them as 1:1.

## Changes

### 1. Default image model → `gpt-image-2`
- In `supabase/functions/generate-image/index.ts`, change the model resolution so `gpt-image-2` is the default when no admin override exists (instead of falling back to Gemini). The existing OpenAI branch already supports `gpt-image-*`.
- Update the OpenAI branch size handling: send `1024x1024` for all pages and covers (square), drop the `1536x1024` cover override.
- Seed/update the `site_settings` row `category=ai, key=image-model` to `gpt-image-2` so admin CMS reflects it.
- Same default applied in `admin-generate-image` if it has its own model selection.

### 2. Reference photo wiring
- Audit `CreationWizard.tsx` page-generation calls to `supabase.functions.invoke("generate-image", …)` and confirm `referenceImage` (the child's `photoPreview` / uploaded photo URL) is included on **every** call, not just the character sheet step. Add it where missing.
- In `generate-image/index.ts`, when `referenceImage` is present, prepend a stronger consistency instruction: "The attached photograph is the REAL child. Reproduce their exact face shape, eye color, skin tone, hair color/texture, and overall likeness in the chosen art style. The illustrated child must be unmistakably recognizable as the same child."
- Ensure both `characterSheet` AND `referenceImage` can be sent together (already supported via the `parts` array) — confirm order: photo first, then character sheet, then text prompt.

### 3. Page count by book type
- Add a helper in `BookOptionsStep.tsx` (or a new `bookFormat.ts`):
  ```
  PAGES_BY_TYPE = { softcover: 20, hardcover: 20, board: 10 }
  ```
- Replace the hardcoded `pageCount: 10` in `CreationWizard.tsx` initial data and recompute it whenever `bookOptions.productType` changes.
- In `generate-story/index.ts`, replace the hardcoded `const pages = 10` with the `pageCount` received from the request body (validated to 10 or 20). Update the prompt to instruct the model to produce exactly that many story beats.
- `BookViewer.tsx` page dots & navigation already iterate `pages.length`, so no change needed there beyond aspect ratio (below).

### 4. 1:1 square pages everywhere
- `BookViewer.tsx`: change `aspect-[4/3]` → `aspect-square` for both the image and the loading placeholder.
- `generate-image/index.ts` OpenAI branch: always request `1024x1024`.
- Update the `PRINT_SPECS` dimension hint in the prompt so cover and interior both target square output for Printify (we'll keep Printify cover spec separate — generated art will be square and Printify can place it).
- `generateBookZip.ts` / `generateBookPdf.ts`: ensure the offscreen canvas uses the natural square dimensions of the generated image (it already uses `img.naturalWidth/Height`, so this works automatically once images are 1:1).
- `BookPreviewModal`, gallery thumbnails, admin generation modal previews: switch any `aspect-[4/3]` to `aspect-square`.

### 5. Admin CMS
- Update the model dropdown options in `AdminCMS` (if present) to include `gpt-image-2` and default to it.

## Technical notes

- `gpt-image-2` uses the same `/v1/images/generations` and `/v1/images/edits` endpoints as `gpt-image-1`; the existing OpenAI branch in `generate-image` works as-is once the model string changes.
- `OPENAI_API_KEY` is already configured in secrets.
- No database migration required for the page-count or model changes — `pageCount` is stored inside `story_data` JSONB.
- One small DB seed via `site_settings` upsert to set `image-model = gpt-image-2` (optional; the function defaults will handle it either way).

## Out of scope
- No checkout / Shopify / Printify behavior changes.
- No changes to story text generation logic beyond the page-count parameter.
