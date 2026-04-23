---
name: Creation Wizard
description: Single-page stacked Apple/Tesla configurator at /create — completed steps stay visible above, auto-scroll on advance, click any prior section to jump back
type: feature
---

The creation wizard lives at `/create` as a full-page configurator inspired by Apple and Tesla's product customizers.

## Layout
- Single scrollable page (no popup, no AnimatePresence single-step swap for steps 1–8).
- Steps 1–8 (the build phase) render as **stacked sections**: every step the user has reached stays visible on the page, separated by generous spacing (`space-y-10 sm:space-y-14`).
- Each step section is wrapped in `<section ref={setStepRef(N)}>`. A `useEffect` watching `step` calls `scrollToStep(step)` to smooth-scroll to the active section.
- The currently-active section is fully interactive; **inactive sections** (already completed) are dimmed (`opacity-50`) with a transparent overlay (`absolute inset-0 z-10`) blocking interaction. Clicking anywhere on an inactive section sets `step` back to that step, scrolling the user up to edit it.
- Sticky top bar shows progress; sticky bottom bar holds Back/Continue. The Back arrow simply decrements `step`, which auto-scrolls upward.

## Generation phase (steps 9–13)
Steps 9 (generation animation), 10 (book options), 11 (shipping), 12 (checkout), 13 (success) remain **single-view** wrapped in `AnimatePresence mode="wait"`. They are sequential post-generation stages, not customization steps, so stacking them would be confusing.

## Persistence
Wizard state (step, data, shipping, bookOptions) is persisted to `localStorage` under `torahtale_wizard_state` on every change. Auto-restored on every mount (skipping terminal step 13). Cleared only on successful order completion in `SuccessStep`.

## Other rules
- The 2-free-book monthly limit and `SubscriptionUpsellDialog` interruption have been removed from the pre-generation flow.
- Default book language is initialized from the UI language (`he` → hebrew, `yi` → yiddish, else english).
