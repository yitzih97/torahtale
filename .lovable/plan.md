

## Plan: Rename to "Torah Tale", Gate Generation Behind Auth + Limit, Update Book Options with Real Printify Pricing

### 1. Rename "MyTorahTale" → "Torah Tale" everywhere

**Files**: `index.html`, `src/components/Navbar.tsx`, `src/components/Footer.tsx`, `src/pages/Auth.tsx`, `src/pages/ResetPassword.tsx`, `src/components/admin/AdminCMS.tsx` (default placeholders)

Replace all hardcoded `MyTorahTale` references with `Torah Tale`.

---

### 2. Require Sign-In Before Book Generation + 2 Free Books/Month Limit

**Problem**: Users can generate unlimited books without signing in, exploiting AI tokens.

**Changes in `src/components/CreationWizard.tsx`**:
- At Step 8 (when user clicks "Generate"), check if `user` is null
- If not signed in, show a sign-in/sign-up modal (reuse existing login prompt UI) BEFORE calling `startGeneration()`
- Only proceed to generation after successful auth
- After auth, query the `books` table to count books created this month by the user
- If count >= 2, show a message: "You've used your 2 free book previews this month. Subscribe to create unlimited seforim!" with a CTA to subscribe
- If count < 2, proceed with generation

**Database**: No migration needed — just query existing `books` table with `created_at` filter.

---

### 3. Update BookOptionsStep with Real Printify Pricing + Visuals

Based on the uploaded Printify screenshots:

| Type | Printify Cost | Our Price (with margin) |
|------|--------------|------------------------|
| **Softcover** 8×8 | $5.87 | Included in base |
| **Hardcover** 8×8 or 11×8.5 | $8.29 | +$15.00 |
| **Board Book** 6×6 | $15.23 | +$20.00 |

**Updated size options** (matching Printify's actual products):
- Softcover: 8″×8″ only
- Hardcover: 8″×8″ or 11″×8.5″
- Board Book: 6″×6″ only

**Revised approach**: Change from 3 separate sections (cover/size/page) to a **single step-by-step product selector** since the Printify products are discrete items, not mix-and-match:

**Step A — Choose Your Book Type** (3 cards with illustrations):
1. **Softcover Photo Book** — 8″×8″, lightweight, 100lb semi-gloss paper — Base price ($24.99)
2. **Hardcover Photo Book** — glossy/matte, 8″×8″ or 11″×8.5″, sturdy binding — +$15 ($39.99)
3. **Board Book** — 6″×6″, 1/16″ thick chipboard, rounded corners, matte lamination — +$20 ($44.99)

Each card shows:
- A descriptive illustration (CSS-styled book icon/graphic, not uploaded images)
- Key features as bullet points
- Price badge

**Step B** (only for Hardcover): Choose size — 8″×8″ or 11″×8.5″

Remove the old 3-section layout. Make it feel like a premium product selection.

**Files**: `src/components/wizard/BookOptionsStep.tsx`

Update `BookOptions` interface:
```typescript
interface BookOptions {
  productType: "softcover" | "hardcover" | "board";
  hardcoverSize?: "8x8" | "11x8.5";
}
```

Update `calculateBookPrice` accordingly. Update `CheckoutStep.tsx` to reflect new options.

---

### 4. Update CheckoutStep order summary

Reflect the new product type names and remove old cover/size/page fields. Show the selected product clearly.

**File**: `src/components/wizard/CheckoutStep.tsx`

---

### Files to Change

| File | Change |
|------|--------|
| `index.html` | Rename MyTorahTale → Torah Tale |
| `src/components/Navbar.tsx` | Default brand name fallback |
| `src/components/Footer.tsx` | Default brand/copyright fallback |
| `src/pages/Auth.tsx` | Brand name |
| `src/pages/ResetPassword.tsx` | Brand name |
| `src/components/admin/AdminCMS.tsx` | Default placeholders |
| `src/components/CreationWizard.tsx` | Gate generation behind auth + 2/month limit |
| `src/components/wizard/BookOptionsStep.tsx` | Rewrite with real Printify products, step-by-step, engaging cards |
| `src/components/wizard/CheckoutStep.tsx` | Update order summary for new product types |

