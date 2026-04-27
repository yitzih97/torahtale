## Goal
Make the full journey (signup → generate → customize → checkout → confirmation) frictionless and reliable, and guarantee the "Place Order" / "Subscribe & Place Order" button always lands the user on a working Shopify checkout — on desktop and mobile.

---

## Root causes found

1. **Checkout opens unreliably (often appears "broken")**
   - In `handlePlaceOrder` (CreationWizard.tsx ~line 725) `window.open(finalUrl, "_blank")` runs **inside a `setTimeout(..., 400)` after multiple `await`s**. Browsers (especially Safari/iOS) block this because it's no longer tied to the user's click gesture. Result: nothing visibly happens → user thinks the button is broken.
   - The Shopify Storefront API currently returns `402 Payment Required` (store billing inactive). The edge function correctly falls back to a `/cart/{variant}:1` URL, but we still treat that as a degraded path. The fallback URL is actually a perfectly valid Shopify cart/checkout entry point — we should embrace it.

2. **Friction in the flow**
   - Step 9 has a *second* "Continue to book" confirmation screen with a 5s auto-advance after the generation animation already played → extra screen that adds ~5s.
   - Step 12 (choose plan) + Step 13 (order summary) are now two separate screens just to click Continue between them — fine logically, but the summary should be the same screen the order is placed from with no extra tap.
   - Plan selection auto-defaults to "monthly" but there is no clear "Continue without subscribing" affordance — users miss the small grey "Skip" link.

3. **Mobile**
   - The sticky bottom action bar (h ~64px) overlaps the last visible field on small screens because content padding is `pb-32` only on the outer container — inner step sections (`min-h-[calc(100vh-11rem)]`) sometimes push primary CTA under the bar.
   - Subscribe/Plan cards use `grid sm:grid-cols-3 gap-3` — on phones they stack, but the Skip link is far below the fold.

---

## What I'll change

### 1. Make checkout bulletproof (highest priority)

**`src/components/CreationWizard.tsx` → `handlePlaceOrder`**

- **Open the checkout window synchronously on the click**, then navigate it once the URL is ready:
  ```ts
  // inside the click handler, BEFORE any await:
  const popup = window.open("about:blank", "_blank", "noopener,noreferrer");
  // ...do async work, get finalUrl...
  if (popup && !popup.closed) popup.location.href = finalUrl;
  else window.location.assign(finalUrl); // fallback for blocked popups (mobile Safari)
  ```
- Remove the artificial `setTimeout(..., 400)` before navigation.
- Treat the edge-function `fallback: true` response as a **first-class success** (it is a real Shopify cart URL). Drop the `(fallback)` wording from the toast — just show "Redirecting to Shopify…" with the URL and an "Open checkout" action button.
- If `window.open` is blocked AND the in-place navigation fails, surface a red error toast with the exact URL + a copyable link so the user can always reach checkout manually.
- Keep the success-screen advancement (`setStep(14)`), but trigger it immediately after the navigation kicks off (no extra delay).

**`supabase/functions/shopify-create-checkout/index.ts`**
- Already builds a working `https://fek120-t9.myshopify.com/cart/{id}:{qty}?channel=online_store` URL on 402/403. Keep, but also append `&attributes[order_source]=torahtale_app` so we can attribute orders later.
- Log the upstream Shopify error body when status >= 400 so we can debug the 402 from edge logs.

### 2. Reduce friction end-to-end

- **Collapse Step 9's post-animation "Continue to book" screen.** When the generation animation finishes, auto-advance straight to Step 10 (Book Options) after a brief 1.5s "Your sefer is ready ✓" beat (no extra button click). The email-confirmation copy moves into the success screen instead.
- **Auto-advance the plan step once chosen.** On Step 12, tapping a plan card animates a 600ms "selected" state and advances to Step 13 automatically. The "Skip subscription" link becomes a clearly labeled secondary button: "Continue without subscribing →".
- **Combine plan + summary visually** (still two steps internally for mobile clarity) but the summary step shows a small "Plan: Monthly · change" link in the header instead of forcing back-navigation.
- Pre-fill shipping name/email from the authenticated user profile when available (Step 11) so users don't retype.

### 3. Mobile polish

- Add `pb-[120px]` (instead of `pb-32`) to the inner step content wrapper so the sticky CTA never covers the primary input/button on small viewports.
- Increase tap targets in plan-selection cards to min-height 92px on `<sm`.
- Ensure all primary CTAs render `min-h-12` on mobile (currently mixed `h-11`/`h-12`).
- Hide the "Start over" text on viewports < 380px (icon stays).

### 4. Order confirmation + return path

- After `setStep(14)` (SuccessStep), already clears `torahtale_wizard_state`. Confirm SuccessStep CTA goes to `/dashboard` (it does). Add a small "View your order" external link to the Shopify order URL stored in `localStorage.torahtale_pending_order`.

---

## Files to edit

- `src/components/CreationWizard.tsx` — synchronous popup, drop 400ms delay, collapse step-9 confirmation, auto-advance plan step, mobile padding.
- `src/components/wizard/CheckoutStep.tsx` — auto-advance on plan select (via new `onSelectAndContinue` callback), prominent "Continue without subscribing" button, "change plan" link in summary header.
- `src/components/wizard/SuccessStep.tsx` — add "View your Shopify order" link if pending_order URL is stored.
- `src/lib/shopify.ts` — return `checkoutUrl` even when `fallback: true` without warning toast noise.
- `supabase/functions/shopify-create-checkout/index.ts` — append source attribute, log upstream error body.

No DB migrations, no new secrets needed for the fixes above.

---

## What I need from you (Shopify side) — optional, not blocking

These would make the experience even better, but the fixes above will work without them. Let me know which (if any) you want to tackle:

1. **Reactivate the Shopify Storefront API access / billing.** The edge function currently gets HTTP `402` from Shopify, which is why we fall back to `/cart/{variant}:qty`. Fixing this will let us create proper Cart objects, attach line-item properties (child name, parsha, art style), and attribute orders to specific users.
2. **Confirm the 7 variant IDs** in `src/lib/shopify.ts` (`SHOPIFY_VARIANT_IDS`) are still live and not archived — a wrong/archived variant is the other common cause of a "broken" checkout link.
3. **Webhook for `orders/paid`** so the app can flip the matching `books` row from `ordered` → `paid` and trigger Printify. (We already have a `printify-submit` function and a `printify-webhook`; tying them to Shopify order paid events would close the loop.)

If you want me to do any of those, just say the word and I'll wire it up.

---

## Out of scope (not changing)

- Visual/copy changes to existing wizard steps 1–8 (already polished).
- New languages.
- Gallery / dashboard layout.
