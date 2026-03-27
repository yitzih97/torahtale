

## Plan: Fix Page Count to 10 + Add Book Type Preview Images

### 1. Remove Page Count Selection (Step 8)

**File:** `src/components/CreationWizard.tsx`

- Remove the page count slider UI from step 8
- Hardcode `pageCount: 10` in `initialData` (currently 4)
- Step 8 becomes just the auth gate / review summary before generation — show a summary of selections (child name, story, style, language) with a "Generate My Sefer" call-to-action
- Remove `pageCount` from `WizardData` interface or keep it fixed at 10
- Update the `story_data` saved to DB to always use 10

### 2. Add Reference Images to BookOptionsStep

**File:** `src/components/wizard/BookOptionsStep.tsx`

- Copy the two uploaded PDF template images to `src/assets/books/` as reference visuals:
  - `board-cover-template.jpg` (from BoardBook_Cover_Templat.pdf)
  - `board-spread-template.jpg` (from BoardBook_InsideSpread_Template.pdf)
- Add preview images to each product type card showing what the format looks like:
  - Softcover: placeholder illustration of a softcover book
  - Hardcover: placeholder illustration of a hardcover book  
  - Board Book: use the uploaded template images as reference so users can see the spread layout and cover format
- Each card gets a small thumbnail/preview area above or beside the features list

### 3. Update Generate-Story to Use Fixed 10 Pages

**File:** `supabase/functions/generate-story/index.ts`

- Ensure the generation prompt always requests 10 pages regardless of any legacy `pageCount` value
- Board books use spreads (left+right per spread), so 10 pages = 5 spreads — add a note in the prompt for board book format

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/CreationWizard.tsx` | Hardcode pageCount=10, replace step 8 slider with summary/auth gate |
| `src/components/wizard/BookOptionsStep.tsx` | Add book type reference images to product cards |
| `supabase/functions/generate-story/index.ts` | Force 10-page generation |
| `src/assets/books/` | Add template reference images |

