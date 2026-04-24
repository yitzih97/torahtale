---
name: Creation Wizard
description: Single-focus configurator at /create — one step fills the viewport center at a time, reached steps collapse to compact clickable strips, anchor-based scroll restoration
type: feature
---

The creation wizard lives at `/create` as a full-page configurator inspired by Apple and Tesla's product customizers.

## Layout — single-focus, scroll-anchored
- Single scrollable page. Steps 1–8 (build phase) are all rendered once reached, but only the **active** step fills the viewport.
- `sectionClass(n)` in `CreationWizard.tsx` drives layout:
  - **Active step**: `min-h-[calc(100vh-11rem)] flex items-center justify-center py-10 sm:py-14` — occupies almost the full viewport and is centered so the user sees only this step while filling it in.
  - **Inactive reached step**: `opacity-50 py-4 max-h-40 overflow-hidden` compact strip; click jumps back, user can also scroll up/down to preview.
- Each `<section>` has a stable id `wizard-step-${n}` and a ref registered in `stepRefs`. `scrollToStep(n)` uses `scrollIntoView({ block: "center" })` against that anchor.
- Sticky top bar shows progress; sticky bottom bar holds Back/Continue. The Back arrow decrements `step`, which auto-scrolls upward.
- Each inactive section gets a transparent overlay (`absolute inset-0 z-10`) to block form interaction; clicking it sets `step` back.

## Generation phase (steps 9–13)
Steps 9 (generation animation), 10 (book options), 11 (shipping), 12 (checkout), 13 (success) remain **single-view** wrapped in `AnimatePresence mode="wait"`. They are sequential post-generation stages, not customization options.

## Persistence — section-anchor based
- Wizard state (step, data, shipping, bookOptions, **activeSectionId = `wizard-step-${step}`**) is persisted to `localStorage` under `torahtale_wizard_state` on every meaningful change.
- **No raw scrollY** is stored. On mount we restore `step` and then call `scrollToStep(restoredStep, "auto")` at 80/220/500/900ms to anchor the viewport to that section (survives layout changes better than pixel offsets). `skipNextStepScrollRef` suppresses the step-change auto-scroll effect for the initial restore.
- Cleared only on successful order completion in `SuccessStep`.

## Other rules
- The 2-free-book monthly limit and `SubscriptionUpsellDialog` interruption have been removed from the pre-generation flow.
- Default book language is initialized from the UI language (`he` → hebrew, `yi` → yiddish, else english).
