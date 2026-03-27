

## Plan: Populate Default Templates, Add Print Specs, Fix Text-on-Image Export

### Problem
1. The Templates tab in admin settings has empty placeholders — no actual default prompts are pre-filled for the admin to edit.
2. No print dimension info is shown per page slot in the template editor.
3. When downloading JPEG/ZIP exports, the text overlay (from `DraggableText`) is not rendered onto the image — only the raw illustration is exported.

---

### 1. Pre-fill Default Prompt Templates

**File:** `src/components/admin/AdminCMS.tsx`

Add a `DEFAULT_PAGE_TEMPLATES` constant with actual master prompts for each of the 10 page slots. These will be used as `placeholder` values in the template textareas AND as a "Fill Defaults" button that populates all fields at once.

Default prompts per slot:
- **Cover** — text: `{childName}'s {torahPortion} Adventure` / image: full cover prompt with art style, Printify cover dimensions, child description
- **Pages 1–8** — text: narrative guidance per page (intro, Torah event pages, moral lesson, conclusion) / image: scene-specific prompt with style, dimensions, cultural rules
- **Back Cover** — text: synopsis + dedication template / image: back cover design prompt

Each placeholder will include the Printify dimension note (e.g., "Board Book 6×6: 3675×1875px") and cultural rules.

Add a **"Fill All Defaults"** button that populates all empty template fields with these defaults so the admin can immediately save and edit them.

---

### 2. Show Print Specs Per Page Slot

**File:** `src/components/admin/AdminCMS.tsx`

In the `PAGE_SLOTS` rendering, add a small info badge showing the target print dimensions for each page type:
- Cover/Back Cover: show cover dimensions per format
- Story pages: show page dimensions per format

Display as a compact reference table or badges below each slot label, e.g.:
```
Softcover 8×8: 2400×2400 | Hardcover: 2325×2325 | Board 6×6: 3675×1875
```

---

### 3. Fix JPEG/ZIP Export to Composite Text Overlay

**File:** `src/lib/generateBookZip.ts`

The current `generateBookZip` just exports raw `page.image` blobs. It ignores `textStyle` and `text`. Fix by:

- Accept `BookPage` from `BookViewer` (with `textStyle` and `text` fields)
- For story pages with text + textStyle, use an **offscreen canvas** to:
  1. Draw the source image
  2. Draw the text overlay at the correct position/font/color/bgOpacity matching `DraggableText` rendering
  3. Export the composited canvas as JPEG blob
- Cover and back-cover pages export image-only (text is baked into the generated image or handled separately)

Update the `BookPage` interface in `generateBookZip.ts` to include `textStyle` and use the `TextStyle` type.

**File:** `src/lib/generateBookPdf.ts`

Similarly update the PDF generator: for story pages, instead of drawing text below the image, composite the text ON the image using the same position/style logic, then embed the composited image in the PDF.

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/admin/AdminCMS.tsx` | Add DEFAULT_PAGE_TEMPLATES with real prompts, "Fill Defaults" button, print spec badges per slot |
| `src/lib/generateBookZip.ts` | Composite text overlay onto images using offscreen canvas before JPEG export |
| `src/lib/generateBookPdf.ts` | Composite text overlay onto PDF page images |

