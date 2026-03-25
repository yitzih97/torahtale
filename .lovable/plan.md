

# Plan: Granular Step-by-Step Wizard with Live Character Preview

## Overview
Redesign the creation wizard from a 3-field-per-page form into a granular one-field-per-step flow. Each step collects one piece of info (name → age → gender → description/photo → art style → torah portion → language → page count) with a live AI-generated character illustration that updates as the user makes selections. Use Lovable AI (Nano Banana 2 / `google/gemini-3.1-flash-image-preview`) for all preview illustrations.

---

## New Step Flow (replaces current steps 1-3)

```text
Step 1: Name        → Text input for child's name
Step 2: Age         → Visual age selector (toddler/child/preteen icons)
Step 3: Gender      → Boy / Girl toggle with character silhouette
Step 4: Art Style   → Cartoon / 3D Pixar / Graphic Novel cards with sample illustrations
Step 5: Photo/Desc  → Upload photo OR text description of child's appearance + good photo examples
Step 6: Torah Story  → Torah portion picker (existing)
Step 7: Language     → Language picker (existing)
Step 8: Page Count   → Slider (existing)
Step 9: Generating   → Loading animation
Step 10: Preview     → Book viewer
Step 11-13: Shipping, Payment, Done (unchanged)
```

For multiple children: after step 5, offer "Add another child" which loops back to step 1 for the next child, or "Continue" to proceed.

## Live Character Preview Panel

- A persistent character preview area (right side on desktop, top on mobile) shows an AI-generated illustration of the child that updates at key moments:
  - After **gender** is selected → generate a basic character (e.g., "a 5-year-old boy, cartoon style")
  - After **age** changes → regenerate with correct age appearance (toddler vs teenager)
  - After **art style** changes → regenerate in the new style
  - After **photo/description** provided → regenerate incorporating the likeness/description

- Each generation calls a new edge function `generate-character-preview` using Lovable AI gateway (`google/gemini-3.1-flash-image-preview`) — NOT the user's Google API key. This keeps preview generation fast and separate from the book generation pipeline.

## New Edge Function: `generate-character-preview`

- Uses `LOVABLE_API_KEY` + Lovable AI gateway
- Accepts: `{ gender, age, artStyle, description?, referenceImage? }`
- Returns a small character illustration (portrait/bust)
- Prompt includes: age-appropriate appearance (2yo = baby/toddler, 12yo = preteen), gender-specific clothing (boys wear kippah, girls don't), art style matching

## Art Style Preview Images

- When user reaches the art style step, generate 3 sample illustrations showing their child character in each style (cartoon, 3D Pixar, graphic novel) using the already-known name/age/gender
- Show these as selectable cards so the user can visually compare styles

## Child Description Option

- Add a "Describe your child" textarea alternative to photo upload
- Fields: hair color, skin tone, distinguishing features, clothing preferences
- Show both options side by side: "Upload a Photo" | "Describe Instead"
- Photo upload section includes example good/bad photo thumbnails (generated once, static)

## Technical Details

### Files to create
| File | Purpose |
|------|---------|
| `supabase/functions/generate-character-preview/index.ts` | Edge function using Lovable AI for live previews |

### Files to modify
| File | Change |
|------|--------|
| `src/components/CreationWizard.tsx` | Complete rewrite of steps 1-3 into granular steps with live preview panel |
| `src/components/CreationWizard.tsx` | Add `ChildProfile.description` field |
| `src/components/CreationWizard.tsx` | Add character preview state + generation logic |

### Edge function implementation
- Endpoint: `generate-character-preview`
- Uses Lovable AI gateway at `https://ai.gateway.lovable.dev/v1/chat/completions`
- Model: `google/gemini-3.1-flash-image-preview` with `modalities: ["image", "text"]`
- Auth: `LOVABLE_API_KEY` (already available)
- Prompt template: `"A [artStyle] illustration portrait of a [age]-year-old Jewish [gender] child. [If boy: wearing a kippah/yarmulke. If girl: no kippah, modest dress.] [description or 'cheerful expression']. Children's book character design, white background, vibrant colors."`

### Character preview generation triggers
- Debounced (500ms) after gender/age/artStyle changes
- Immediate after photo upload or description entry
- Shows a small shimmer skeleton while generating
- Cached: if same params already generated, reuse

### Step navigation
- Total steps increase from 8 to 13
- Stepper UI condensed into logical groups: "Character" (steps 1-5), "Story" (6-8), "Create" (9-10), "Order" (11-13)
- Progress bar shows grouped progress rather than individual dots

### ChildProfile interface update
```typescript
export interface ChildProfile {
  id: string;
  name: string;
  age: string;
  gender: string;
  photo: File | null;
  photoPreview: string | null;
  description: string;        // NEW
  characterPreview: string | null; // NEW - AI generated preview URL
}
```

