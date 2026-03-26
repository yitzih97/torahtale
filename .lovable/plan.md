

## Plan: Smart Step Skipping, Sidebar, Debounced Previews, Enhanced Loading, and Editable Text Overlay

### Summary
Five changes to the Creation Wizard:
1. **Skip gender/age steps for existing children** — jump from step 1 directly to step 4 (Art Style)
2. **Show selected kids sidebar** during steps 2–8
3. **Debounce AI preview to only trigger once** after settings stabilize (not on every keystroke)
4. **Rich generation loading screen** with illustration skeleton, phase labels, and percentage progress
5. **Editable text overlay on book pages** — text rendered on top of the image with drag, font, color, and size controls (Canva-like)

---

### Technical Details

#### 1. Skip Steps for Existing Children
- In the `next()` function, after step 1: check if ALL selected children already have `gender` and `age` populated (i.e. they came from existing profiles)
- If so, skip steps 2, 3 (and optionally 5 if they already have photo/description) — jump directly to step 4
- Similarly in `back()`, skip backward over those steps
- Update `canNext` for step 1 to remain as-is (at least one child with a name)

#### 2. Selected Kids Sidebar
- Add a small sidebar/panel (visible on steps 2–8) showing all selected children as compact cards with thumbnail, name, age, gender
- On desktop: right column. On mobile: horizontal scroll strip at top
- Highlight the `activeChildIdx` child
- Allow clicking a child card to switch `activeChildIdx`

#### 3. Debounced Preview — Single Trigger
- Increase debounce from 600ms to ~1500ms
- Add a `lastPreviewKey` ref to track the last generated key; skip if unchanged
- Remove the `useEffect` that auto-triggers on `step === 3` every time `child.age` changes — instead trigger once when the user clicks "Continue" from age step, or after 1.5s of no changes
- For art style step (4), only generate previews if the style actually changed

#### 4. Enhanced Generation Loading (Step 9)
- Replace the simple spinner with a rich skeleton:
  - Animated book illustration placeholder (use `BookLoadingSkeleton` component already built)
  - Phase labels: "Writing the story…", "Illustrating page 1 of N…", "Illustrating page 2 of N…", etc.
  - **Percentage progress bar** calculated as: story generation = 20%, then each page image = remaining 80% / total pages
- Track progress in state: `genProgress: number` (0–100) and `genPhase: string`
- Update progress during `startGeneration` as each page image completes
- Only transition to step 10 when ALL images are done (already the case, but make it explicit with the progress bar reaching 100%)

#### 5. Editable Text Overlay (Canva-like) on Book Pages
- In `BookViewer`, change the text display for story pages:
  - Instead of text below the image in a separate `<p>`, render text **on top of the image** in a positioned overlay
  - Each text block is a draggable `<div>` (use `onMouseDown`/`onTouchStart` drag handlers or a lightweight drag lib)
  - Add a small floating toolbar when text is selected: font size slider, color picker (preset palette), font family dropdown (3–4 options)
  - Text has a semi-transparent background for readability, toggleable
- Store per-page text position/style in the `BookPage` type:
  ```ts
  textStyle?: {
    x: number; y: number;       // percentage-based position
    fontSize: number;
    color: string;
    fontFamily: string;
    bgOpacity: number;
  }
  ```
- Cover and back-cover pages keep their current layout (text in dedicated sections below image)
- Default position: bottom-center of the image with white text and dark semi-transparent background

### Files to Change
- `src/components/CreationWizard.tsx` — step skipping logic, sidebar, debounce, generation progress
- `src/components/wizard/BookViewer.tsx` — draggable text overlay with style controls
- `src/components/wizard/BookLoadingSkeleton.tsx` — reuse in generation step

