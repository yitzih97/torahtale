

## Plan: Character Consistency, Cover Dimensions & Questions Layout

### Problems to Fix
1. **Cover/back-cover pages** use regular page dimensions instead of the larger cover print-area sizes
2. **Discussion questions** are shown below the back-cover image as metadata — they should be rendered as part of the last inner page of the book
3. **Character appearance** is inconsistent across pages — no reference image or character sheet is passed to `generate-image`
4. **Child photos/descriptions** stored during wizard are not forwarded to the image generation pipeline

### Solution

#### 1. Character Reference Sheet (New Edge Function)

**New file: `supabase/functions/generate-character-sheet/index.ts`**

- Accepts: `childName`, `age`, `gender`, `artStyle`, `description`, `referenceImage` (user's uploaded photo or data URI)
- Generates a **character model sheet** (front view, side view, expressions) using Gemini image generation
- Returns the character sheet as a base64 image URL
- This sheet becomes the `referenceImage` for ALL subsequent page illustrations

#### 2. Update `generate-image` to Accept Character Sheet

**File: `supabase/functions/generate-image/index.ts`**

- Add a new param `characterSheet` (separate from `referenceImage`)
- When `characterSheet` is provided, inject it as an inline image part with prompt: "The child character MUST look exactly like the character in this reference sheet — same face, hair, clothing, proportions. Maintain perfect consistency."
- Also accept `childDescription` param for text-based appearance guidance when no photo exists
- Pass both `pageType` dimensions correctly: cover pages get `specs.cover` dimensions, story pages get `specs.page` dimensions (this already works but needs verification in callers)

#### 3. Update `AdminBookGenerationModal` Generation Flow

**File: `src/components/admin/AdminBookGenerationModal.tsx`**

- **Phase 1 (new): "character"** — Before generating images, call `generate-character-sheet` for each child using their photo URL from `child-photos` bucket or their description
- Store the returned character sheet(s) in state
- **Phase 2: "story"** — Same as current
- **Phase 3: "images"** — Pass `characterSheet` and `childDescription` to every `generate-image` call
- **Cover dimensions**: Pass `pageType: "cover"` and `pageType: "back-cover"` (already done) — the `generate-image` function already uses correct cover vs page dimensions when `bookFormat` is passed
- **Questions page**: Change page structure so questions are the **last story page** (page 10), not metadata on the back cover. Build a dedicated "questions" page with text content listing the questions

#### 4. Update `CreationWizard` to Store Child Photos

**File: `src/components/CreationWizard.tsx`**

- In `startGeneration()`, upload each child's photo (if exists) to the `child-photos` bucket
- Save the photo URLs in `story_data.childDescriptions[].photoUrl`
- This data is then available to the admin modal for character sheet generation

#### 5. Questions as Inner Page

**Files: `AdminBookGenerationModal.tsx`, `generate-story/index.ts`**

- In `generate-story`, request the AI to include questions as part of page 10's text content (or as a separate structured field)
- In the page assembly code, create a dedicated "questions" page (type: `"story"` or new type `"questions"`) as the last inner page before the back cover
- The back cover keeps only the synopsis and dedication
- The questions page renders its content as formatted text overlaid on an illustration

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-character-sheet/index.ts` | **New** — generates a character model sheet from photo/description |
| `supabase/functions/generate-image/index.ts` | Accept `characterSheet` + `childDescription` params; inject character sheet as reference |
| `supabase/functions/generate-story/index.ts` | Move questions to be part of the last story page content |
| `src/components/admin/AdminBookGenerationModal.tsx` | Add character sheet phase; pass character data to image gen; restructure pages so questions = last inner page |
| `src/components/CreationWizard.tsx` | Upload child photos to storage during generation; save photo URLs in story_data |
| `src/components/wizard/BookViewer.tsx` | Add rendering support for a "questions" page type |

### Generation Flow (After Changes)

```text
1. Upload child photos → storage bucket
2. Generate character sheet(s) from photo/description + art style
3. Generate story text (questions included as page 10 content)
4. Assemble pages:
   - Page 0: Cover (cover dimensions)
   - Pages 1-8: Story (page dimensions)
   - Page 9: Questions (page dimensions)
   - Page 10: Back Cover (cover dimensions, synopsis + dedication only)
5. Generate images for each page, passing character sheet as reference
```

