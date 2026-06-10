## Plan

1. Refresh the sitewide typography and branding to match your references.
   - Replace the current font stack used across the public site and platform UI with a closer match to the attached Torah Tale references.
   - Update the shared font tokens in the global theme so headings, body text, buttons, and navigation all stay consistent.
   - Swap the live brand mark usage in the navbar, footer, and hero-related brand placements to the uploaded gold Torah Tale logo system.
   - Rework the homepage hero styling to better match the attached layout feel: refined headline hierarchy, warmer gold accents, cleaner nav/button styling, and more reference-like brand presentation.

2. Add the coloring book as an add-on, not a replacement book type.
   - Keep Softcover / Hardcover / Board Book as the main format choices.
   - Add a new optional coloring-book add-on in the choose-book-type step with a +$3 price increase.
   - Carry that add-on through pricing, checkout summary, saved wizard data, and order creation so totals stay correct everywhere.
   - Update labels and translations so the new option reads clearly in English/Hebrew UI.

3. Fix admin quick regen and custom-prompt regeneration so it follows the original generation system.
   - Right now the full-book generation path sends rich context into the image generator, while quick regen/custom prompt uses a simplified prompt path that can bypass page templates, master rules, and some consistency controls.
   - I’ll make regen use the same structural inputs as the original generation flow: page type, story page number, book format, scene text, child references, character sheets, and consistency instructions.
   - I’ll tighten the custom-prompt flow so your edits can guide the image without replacing the core quality/style rules that make the original pages come out better.
   - I’ll also preserve print-ready constraints and template-driven scene rules during regen so regenerated pages stay aligned with the approved book style.

4. Validate the connected admin and storefront flows after the implementation.
   - Check that the hero, navbar, footer, and global typography all render consistently.
   - Check that selecting the coloring-book add-on updates the displayed total by $3 and persists into checkout/order data.
   - Check that admin quick regen and edit-with-prompt produce pages that stay visually consistent with the original full generation pipeline.

## Technical details

- Files likely involved:
  - `src/index.css`
  - `tailwind.config.ts`
  - `src/components/Navbar.tsx`
  - `src/components/HeroSection.tsx`
  - `src/components/Footer.tsx`
  - `src/components/wizard/BookOptionsStep.tsx`
  - `src/components/wizard/CheckoutStep.tsx`
  - `src/components/CreationWizard.tsx`
  - `src/components/wizard/BookViewer.tsx`
  - `src/components/admin/AdminBookGenerationModal.tsx`
  - `supabase/functions/generate-image/index.ts`
  - possibly checkout/store mapping files if the add-on needs to be represented in order payloads

- Key implementation approach for regen fix:
  - Reduce dependence on a freeform `prompt` override in page regen.
  - Add a controlled “prompt additions/edit instructions” path so admin edits are layered on top of the same base prompt construction used in original generation.
  - Ensure the same templates, master rules, format dimensions, page text, and reference assets are always included.

- Expected result:
  - Visual system feels much closer to your attached Torah Tale references.
  - Coloring book becomes a simple +$3 upsell option in the book chooser.
  - Admin page regeneration becomes much more reliable and consistent with the original book output.