---
name: Creation Wizard
description: Single-focus configurator at /create — only the current step is rendered centered in the viewport, Back button navigates, anchor-based scroll restoration, full RTL support
type: feature
---

The creation wizard lives at `/create` as a full-page configurator inspired by Apple and Tesla's product customizers.

**Entry**: Wizard always begins at Step 1 (Name). The old upfront plan-type chooser (Step 0) has been removed; everyone starts as a single-book buyer. The single-vs-subscription upsell now lives inline at the top of Step 11 (Order Summary) as a 4-option selector (Just this book / Weekly / Monthly / Yearly) right before Place Order. The `/pricing` page no longer pre-seeds the wizard — its CTAs just navigate to `/create`. Step 6 (Parsha) is a single calm screen: a "This Week's Parashah" hero card, 5 category pills (Torah, Nevi'im, Kesuvim, Megillos, Yamim Tovim), search, and per-Sefer accordions using bilingual `Sefer Bereishis / ספר בראשית` headers (see `TORAH_BOOK_LABELS`). All parshiyos are named in frum English ("Parashas Noach") + Hebrew ("פרשת נח").

## Layout — single-focus, one step at a time
- Only the **active** step is rendered for steps 1–8. Previous and next sections are NOT visible (the user requested no distractions).
- Each step is wrapped in `<section id="wizard-step-${n}" className={sectionClass(n)}>` where `sectionClass` produces `min-h-[calc(100vh-11rem)] flex items-center justify-center` so the current question is perfectly centered in the viewport.
- Sticky top bar shows progress and step icon; sticky bottom bar holds Back/Continue. `Back` decrements `step` and re-renders the previous step (scrolls it into center via `scrollToStep`).
- `scrollToStep(n)` uses `scrollIntoView({ block: "center" })` against the section anchor.

## Generation phase (steps 9–13)
Steps 9 (generation animation), 10 (book options), 11 (shipping), 12 (checkout), 13 (success) remain **single-view** wrapped in `AnimatePresence mode="wait"`. They are sequential post-generation stages.

## Persistence — section-anchor based
- Wizard state (step, data, shipping, bookOptions, `activeSectionId = "wizard-step-${step}"`) is persisted to `localStorage` under `torahtale_wizard_state` on every meaningful change.
- **No raw scrollY** is stored. On mount we restore `step` and call `scrollToStep(restoredStep, "auto")` at 80/220/500/900ms to anchor the viewport to that section.
- Cleared only on successful order completion in `SuccessStep`.

## RTL support
- Hebrew (`he`) and Yiddish (`yi`) set `<html dir="rtl">` via `LanguageContext`. The wizard uses **logical Tailwind classes** (`text-start`, `ps-*`, `pe-*`, `start-*`, `end-*`) instead of `text-left`, `pl-*`, `left-*` so all alignment, padding, and absolutely-positioned badges (selected checkmarks, search icons) flip correctly.
- Arrows (`ArrowLeft`, `ArrowRight`) use `rtl:rotate-180` to point the right way in RTL.

## Shopify checkout
- `handlePlaceOrder` in `CreationWizard.tsx` calls `createShopifyCart` which invokes the `shopify-create-checkout` edge function.
- If the Shopify Storefront API returns a non-OK status (e.g. 402 billing plan inactive, 403 scope issue), the edge function now returns a **direct `/cart/<variantId>:<qty>` URL** on the store domain with HTTP 200 + `fallback: true`, so the user is still redirected to Shopify to complete checkout instead of being stuck on the button.

## Other rules
- The 2-free-book monthly limit and `SubscriptionUpsellDialog` interruption have been removed from the pre-generation flow.
- Default book language is initialized from the UI language (`he` → hebrew, `yi` → yiddish, else english).
