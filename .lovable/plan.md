## Goal
Stop sending people to a plan picker (Step 0) or `/pricing` before the wizard. Everyone goes straight into book creation as a single-book order. The subscription upsell appears as a small selector inside the Order Summary step, right above the Place Order button.

## Changes

### 1. `src/components/CreationWizard.tsx` — remove Step 0, default to single
- Initial state:
  - `step` starts at `1` (Name) instead of `0`.
  - `planType` defaults to `"single"`.
  - `selectedPlan` defaults to `"once"`.
  - `bookOptionsChosenEarly` defaults to `false` and is no longer toggled anywhere.
- Delete the entire Step 0 JSX block (plan cadence cards + early `BookOptionsStep` + total summary, lines ~959–1090).
- Remove the `step === 0` branch in the Continue handler (line ~2331) and any `back()` paths that could land on 0; clamp `back()` minimum to `1`.
- Remove subscription-only skip logic that assumed an upfront pick:
  - `step === 5 && planType === "subscription"` skip → delete (everyone now picks a parsha).
  - `step === 6 && planType === "subscription"` skip → delete.
  - `step === 10 && bookOptionsChosenEarly && planType === "subscription"` jump-to-1 → delete.
  - `AutoAdvanceStep` after generation: always advance to step `10` (drop the `bookOptionsChosenEarly ? 11 : 10` branch).
- `resetWizard()`: set `planType` back to `"single"`, `step` to `1`, drop `setBookOptionsChosenEarly`.
- Persistence (`torahtale_wizard_state`): keep the same key; if a restored `step` is `0`, coerce to `1`. `bookOptionsChosenEarly` field can be ignored on load.
- Progress bar / TOTAL_STEPS: re-index so the bar reflects 1→success without the old Step 0 (visual only; the numeric step values inside the file stay 1..14 to minimize churn).

### 2. Step 11 (Order Summary) — inline plan picker
Inside the existing `step === 11` block, just above the `ShippingForm` / `CheckoutStep` summary, add a compact 4-option selector:

```text
┌──────────────────────────────────────────────────────────┐
│ How would you like this?                                 │
│ ( ) Just this book        $XX.XX one-time                │
│ ( ) Weekly Parashah Club  $9 + format / week             │
│ (•) Monthly Parashah Club $36 + format / month  POPULAR  │
│ ( ) Yearly Parashah Club  $360 + format / year · save 2mo│
└──────────────────────────────────────────────────────────┘
```

Behaviour:
- Selecting "Just this book" sets `planType="single"`, `selectedPlan="once"`.
- Selecting any cadence sets `planType="subscription"`, `selectedPlan=<cadence>`.
- The existing monthly↔yearly toggle banner stays, but only renders when a subscription option is currently selected.
- The existing `CheckoutStep` summary, the final `step === 12` shipping form, and the Place Order button (`handlePlaceOrder(selectedPlan)`) keep working unchanged — they already branch on `planType`/`selectedPlan`.
- Copy uses `t.wizard.planSingle`, `t.wizard.planWeekly`, `t.wizard.planMonthly`, `t.wizard.planYearly` (already in i18n).

### 3. `src/pages/Pricing.tsx` — stop pre-seeding the wizard
- `goCreate()` always just clears `torahtale_wizard_state` and navigates to `/create`. Drop the `plan` parameter, the `planType` / `bookOptionsChosenEarly` / `step: 0` seeding, and pass nothing to `navigate`.
- All three card CTAs ("Create a single book", "Start Torah Series", "Start Tanach Series") call the same `goCreate()`. Page stays as a marketing/comparison surface only.

### 4. Memory
- Update `mem://features/creation-wizard.md`: note that the wizard begins at Step 1 (Name) for all users, the upfront plan-type step has been removed, and the subscription upsell lives inside the Order Summary (step 11) as an inline selector.

## Out of scope
- No DB / Shopify / Printify changes — subscription rows are still created by the existing `handlePlaceOrder` path when `selectedPlan` is weekly/monthly/yearly.
- Pricing page itself stays; only its CTA wiring changes.
- Navbar "Pricing" link is unchanged.
- Subscription pricing math, success step, and dashboard subscription card are unchanged.
