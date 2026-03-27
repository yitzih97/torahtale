

## Plan: Update Image Specs, JPEG Zip Download, and 20% Margin Pricing

### Summary
Three changes: (1) embed Printify print-area dimensions into AI image generation prompts so images match exact specs, (2) replace admin PDF download with a JPEG zip download organized by page, (3) update pricing to Printify cost + 20% margin.

---

### 1. Update Image Generation with Printify Specs

**Files:** `supabase/functions/generate-image/index.ts`, `src/pages/Admin.tsx` (handleTriggerGeneration)

Add a `bookFormat` parameter to the generate-image edge function. Based on format, append exact pixel dimensions to the image prompt:

| Format | Page Size | Cover Size |
|--------|-----------|------------|
| Softcover 8x8 | 2400 x 2400 px | 4790 x 2400 px (back+spine+front) |
| Hardcover 8x8 | 2325 x 2325 px | 5370 x 2850 px (back+spine+front) |
| Board Book 6x6 | 3675 x 1875 px (spread, 2 pages) | 3863 x 1875 px (back+spine+front) |

- For page images: append `"The output image MUST be exactly {W}x{H} pixels."` to prompt
- For cover images: generate as full wrap (back cover + spine + front cover) at the cover dimensions
- Store the `bookFormat` in the book record's `story_data` so admin generation knows which specs to use
- Update `handleTriggerGeneration` in Admin.tsx to pass `bookFormat` from the book's options data

### 2. Replace PDF with JPEG Zip Download

**Files:** `src/pages/Admin.tsx`, add new utility `src/lib/generateBookZip.ts`

- Install/use `jszip` library (already available or add it)
- Create `generateBookZip()` that:
  - Takes pages array and book format info
  - For each page, converts the base64/URL image to JPEG blob
  - Names files systematically: `cover-front.jpg`, `page-01.jpg`, `page-02.jpg`, ..., `cover-back.jpg`
  - Packages all into a zip using JSZip
  - Returns the zip blob for download
- In Admin.tsx, replace `handleDownloadPdf` with `handleDownloadZip`:
  - Change the download button icon/label from "PDF" to "Download Images (ZIP)"
  - Download as `{order}-{childname}-images.zip`
- Remove the `generateBookPdf` import from Admin (keep the file for potential future use)

### 3. Update Pricing to 20% Margin

**File:** `src/components/wizard/BookOptionsStep.tsx`

New prices (Printify cost + 20%):
- Softcover 8x8: $5.87 × 1.2 = **$7.05**
- Hardcover 8x8: $8.29 × 1.2 = **$9.95**
- Hardcover 11x8.5: $8.29 × 1.2 = **$9.95** (same Printify product)
- Board Book 6x6: $15.23 × 1.2 = **$18.28**

Update `PRODUCT_INFO` prices and `BASE_BOOK_PRICE` accordingly.

Also update `CheckoutStep.tsx` if it references old prices.

---

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-image/index.ts` | Accept `bookFormat` param, add dimension instructions to prompt |
| `src/pages/Admin.tsx` | Pass bookFormat to generation, replace PDF download with ZIP download |
| `src/lib/generateBookZip.ts` | New utility — JPEG zip creation with JSZip |
| `src/components/wizard/BookOptionsStep.tsx` | Update prices to cost + 20% |
| `src/components/wizard/CheckoutStep.tsx` | Update any hardcoded price references |
| `src/components/CreationWizard.tsx` | Store bookFormat in book record when saving |

