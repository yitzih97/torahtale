

## Plan: Restructure Wizard — Remove User Book Preview, Add Animation, Local Checkout

### Overview
Remove the book preview/edit step from the user wizard. After "Generate Book", show a 10-second animated sequence, then a message about email confirmation within 24 hours. Then proceed to book options → shipping → local checkout → success. Book preview and approval moves to the admin panel.

---

### 1. Restructure Wizard Steps (reduce from 14 to 12)

**File:** `src/components/CreationWizard.tsx`

Current → New step mapping:
- Steps 1–8: unchanged (character, story, page count)
- Step 9: **NEW** — 10-second book creation animation + email confirmation message (replaces actual generation wait + preview)
- Step 10: Book options (was step 11)
- Step 11: Shipping (was step 12)
- Step 12: Checkout — locally hosted (was step 13)
- Step 13: Success (was step 14)

Changes:
- `TOTAL_STEPS = 13`, update `STEP_GROUPS` accordingly
- On "Generate Book" click (step 8): require auth + check limit (same), then kick off generation **in the background** (fire-and-forget to edge function), show 10-second animation with phases like "Writing the story...", "Illustrating pages...", "Almost done!"
- After 10 seconds, auto-advance to a confirmation screen: "Your book is being created! You'll receive a preview in your email within 24 hours for you to review and confirm."
- Then a "Continue to Order" button advances to book options (step 10)
- Remove `bookPages` state, `BookViewer` import, and step 10 (old book viewer)
- Keep `startGeneration` but make it fire-and-forget (save book to DB as "generating" status, don't wait for images)
- Remove all image generation logic from the client — the edge function will handle it asynchronously

### 2. New "Book Creating" Animation Step

**In:** `src/components/CreationWizard.tsx` (step 9)

- 10-second animated sequence with phases:
  - 0-3s: "Writing your Torah story..." with book/quill animation
  - 3-6s: "Illustrating beautiful scenes..." with paintbrush animation
  - 6-9s: "Adding the finishing touches..." with sparkle animation
  - 9-10s: "Almost ready!" with checkmark
- After 10s, show confirmation card:
  - "Your sefer is being created!"
  - "You'll receive an email within 24 hours with a preview of the book and shipping details for you to confirm."
  - Mail icon + child name
  - "Continue to Choose Your Book" button → advances to step 10

### 3. Background Generation (Fire-and-Forget)

**File:** `src/components/CreationWizard.tsx`

- When user clicks "Generate Book", save a book record to DB with status `"generating"` containing all the story parameters (child info, torah portion, art style, language, page count)
- The actual story + image generation will happen server-side (admin triggers or a background edge function)
- Remove client-side `generateImageForPage`, `Promise.all` image gen, progress tracking
- The book record stores all needed info for the admin to generate/approve later

### 4. Local Checkout (Remove Shopify Redirect)

**File:** `src/components/wizard/CheckoutStep.tsx`

- Remove Shopify cart/checkout redirect logic
- Build a local order summary + "Place Order" button
- On place order: update book status to `"ordered"`, save shipping + book options to DB
- Keep subscription plan selection UI
- Show order confirmation locally (no external redirect)

### 5. Admin Book Preview & Approval

**File:** `src/components/admin/AdminCMS.tsx` or `src/pages/Admin.tsx`

- Add a "Books" tab/section showing books with status `"generating"` or `"ordered"`
- Admin can:
  - View the book parameters (child name, portion, style, etc.)
  - Trigger generation (or re-generation) for the book
  - Preview the generated book (using existing `BookViewer` component)
  - Approve the book → changes status to `"approved"` → triggers Printify submission
  - Edit pages before approving
- Add a "Generate Now" button per book that calls the existing edge functions
- Add an "Approve & Send to Print" button

### 6. Update Success Step

**File:** `src/components/wizard/SuccessStep.tsx`

- Update messaging: "Your order has been placed! We're creating your personalized sefer and you'll receive an email preview within 24 hours."
- Remove "being printed" language since it hasn't been approved yet

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/CreationWizard.tsx` | Restructure to 13 steps, remove book viewer step, add 10-sec animation, fire-and-forget generation |
| `src/components/wizard/CheckoutStep.tsx` | Local checkout instead of Shopify redirect |
| `src/components/wizard/SuccessStep.tsx` | Update messaging |
| `src/pages/Admin.tsx` | Add book management/preview/approval section |
| `src/components/admin/AdminCMS.tsx` | May add book approval tab |

