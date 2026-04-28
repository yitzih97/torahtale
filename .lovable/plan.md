# Checkout Wizard Restructure

Reuses the existing Shopify checkout, current book prices ($7.05/$9.95/$18.28), and current Parashah Club plans. No new products, no new payment integration. This is a UX restructure of the post-generation steps.

## Final step map

After the generation animation (current step 9) the wizard becomes:

```text
9   Generation animation   (unchanged)
10  Story Preview          NEW — cover + sample pages, "Print My Book" CTA
11  Choose Format          (existing BookOptionsStep, hardcover default)
12  Quantity               NEW — 1/2/3/custom + volume discount banner
13  Membership             (existing CheckoutStep "plan" mode, restyled)
14  Shipping               (existing ShippingForm)
15  Order Summary + Pay    (existing CheckoutStep "summary" mode)
16  Confirmation           (existing SuccessStep, restyled with order #, gift CTA)
```

Total steps constant becomes 16. Quantity is only sent to Shopify if > 1.

## What gets built / changed

**New components**
- `src/components/wizard/StoryPreviewStep.tsx` — cover image + 2–3 page thumbnails from `pages_data`, child name(s), "Print My Book" primary + "Edit Story Details" secondary (jumps back to step 8).
- `src/components/wizard/QuantityStep.tsx` — 1/2/3 chip buttons + custom number input, shows "10% off at 2 / 15% off at 3+" badge, live-updated total preview.

**Edited**
- `src/components/CreationWizard.tsx`
  - Bump `TOTAL_STEPS` 14 → 16, renumber post-generation switch cases, update the bottom-nav `(step === 10 || 11 || 12)` guard, update progress calculation, add `quantity` state (default 1).
  - Pass `quantity` through to `handlePlaceOrder` so the Shopify cart line uses `quantity: N`.
- `src/components/wizard/CheckoutStep.tsx` — minor: when `mode="summary"`, display quantity row and `bookPrice × quantity` math with the volume discount applied.
- `src/components/wizard/SuccessStep.tsx` — show order number (already saved on `books.order_number`), add "Send One to Grandparents" CTA that re-opens the wizard prefilled, keep existing "Go to Dashboard".
- `src/i18n/{en,he,yi}.ts` — add the handful of new strings (Story Preview title, Quantity copy, volume discount label, grandparents CTA).

**Untouched**
- All Shopify wiring (`src/lib/shopify.ts`, `shopify-create-checkout` edge function) — checkout still opens Shopify hosted page in new tab. Apple Pay / Google Pay / PayPal already work there.
- Pricing constants in `BookOptionsStep.tsx`.
- Membership plans in `CheckoutStep.tsx` (10/20/30% off already in place from prior step).
- `wizard-state` localStorage key (just gains `quantity`).

## Volume discount logic

Applied client-side to the displayed total and passed as `quantity` on the Shopify line item. Discount itself is rendered as a savings line in the summary; if you want it enforced at Shopify checkout we'd need a Shopify automatic discount or price rule (not in scope unless you want me to set one up via the Shopify tools).

```text
qty 1   → no discount
qty 2   → -10%
qty 3+  → -15%
```

## Copy direction (per your spec)

- Step 10 subtitle: "Your full book will be professionally printed and delivered to your door."
- Step 12 subtitle: "Order one for your home, one for grandparents, or one as a gift."
- Step 13 framing: "Build your child's Torah library — save on every future book."  Secondary action: "No thanks, just print this book."
- Step 16 title: "Your Torah Tale Is Going to Print" + "Your child's personalized Torah book is on its way."

All translated EN/HE/YI; RTL handled by existing logical Tailwind classes.

## Out of scope (per your answers)

- No Deluxe Gift Edition format.
- No Neviim & Kesuvim Learning Tracks step.
- No add-on physical books in step 4 (Holiday Bundle, Shabbos Stories, etc.). The membership step alone hints at the broader library.
- No new Shopify products, no Stripe/Paddle, no embedded card form.

## What I'll need from you (only after build)

Nothing required to ship the UI. Optional, only if you want the volume discount enforced on the Shopify side rather than just shown in our summary: I can create a Shopify automatic discount via `shopify--create_price_rule` ("Buy 2 = 10% off, Buy 3+ = 15% off"). Say the word after approval and I'll do it in the same pass.