

## Plan: Replace Age Brackets with Input, Remove Descriptions, Auto-Advance + Mobile Fix

### 1. Replace Age Selection with Simple Input (Step 3)

**File:** `src/components/CreationWizard.tsx`

- Remove `AGE_BRACKETS` constant entirely
- Remove `getAgePreset` usage in step 3
- Replace step 3 UI with a simple number input field for age (max 15, min 1)
- Update `ageToBracketLabel` to handle ages up to 15
- Keep the character preview on the side

### 2. Remove All Description/Explanation Text

**File:** `src/components/CreationWizard.tsx`

Remove every `<p className="text-muted-foreground text-sm mt-1">...</p>` subtitle line across all steps:
- Step 1: "Enter the name of the child..."
- Step 1: "Select existing children..." label
- Step 2: "This shapes the character's appearance..."
- Step 3: "This helps us tailor the story..."
- Step 4: "See how {name} looks in each style."
- Step 5: photo/description helper text
- Step 6: story selection description
- Step 7: language description
- Step 8: "Review your selections..." description
- Gender card sub-labels ("Will wear a kippah", "Modest dress")

Also remove description text from:
- `src/components/wizard/BookOptionsStep.tsx` — "Select the perfect format..." subtitle
- `src/components/wizard/ShippingForm.tsx` — "We'll deliver this treasure..." subtitle

### 3. Auto-Advance on Selection (No Continue Click)

**File:** `src/components/CreationWizard.tsx`

When a user taps/clicks to select an option, auto-advance to next step after a brief 300ms delay:
- **Step 2 (Gender)**: selecting boy/girl → auto-advance to step 3
- **Step 3 (Age)**: after typing age → user still clicks continue (input field, not selection)
- **Step 4 (Art Style)**: selecting a style → auto-advance to step 5
- **Step 6 (Torah Portion)**: selecting a portion → auto-advance to step 7
- **Step 7 (Language)**: selecting a language → auto-advance to step 8

Implementation: wrap selection handlers with `setTimeout(() => next(), 300)` after setting the value.

### 4. Mobile View Polish

**File:** `src/components/CreationWizard.tsx`

- Dialog: use `max-h-[100dvh]` on mobile, full-screen feel with `sm:max-w-3xl sm:max-h-[92vh]`
- Step 3 age input: stack properly on mobile
- Gender cards (step 2): ensure `grid-cols-2` with smaller images on mobile
- Art style cards (step 4): `grid-cols-3` on mobile too but with smaller padding
- Torah portion cards: `grid-cols-2` stays, reduce padding on mobile
- Nav buttons: compact on mobile with smaller text

### Files Changed

| File | Change |
|------|--------|
| `src/components/CreationWizard.tsx` | Replace age brackets with input (max 15), remove all description text, add auto-advance on selection, mobile layout fixes |
| `src/components/wizard/BookOptionsStep.tsx` | Remove subtitle description text |
| `src/components/wizard/ShippingForm.tsx` | Remove subtitle description text |

