## Goal

Connect real payments end-to-end: live retail prices come from Printify (**cost + 35% margin**), Shopify holds the real products users check out against, and approved orders flow back into Printify via the existing `printify-submit` edge function.

---

## Blocker that needs you first

Shopify product/listing API returned **"Unavailable Shop — Payment required"**. Your Shopify store needs an active billing plan before I can create real products or pull real variant IDs. Please:

1. Go to https://admin.shopify.com → **Settings → Plan** → activate any paid plan (Basic is fine for setup).
2. Confirm the **Shopify Subscriptions** app is installed (you confirmed — good).
3. Reply "ready" and I'll run everything below.

Until then nothing in the checkout will be real.

---

## Plan (after Shopify is active)

### 1. Pricing model: cost + 35%, pulled live from Printify

- New edge function `printify-pricing` (admin-callable + scheduled):
  - Calls `GET /v1/catalog/blueprints/{id}/print_providers/{id}/variants.json` for each of our 3 SKUs (softcover 8×8, hardcover 8×8, board 6×6).
  - Reads `cost` (cents), computes `retail = round(cost * 1.35)`, then rounds up to nearest `.99`.
  - Stores result in a new `printify_prices` table: `{ format, printify_variant_id, cost_cents, retail_cents, updated_at }`.
- A small DB helper exposes current retail prices to the frontend.
- `BookOptionsStep.tsx` and `CheckoutStep.tsx` read prices from this table (current hardcoded values as fallback) instead of constants.

### 2. Shopify products (one per format)

Create 3 Shopify products with prices = the cost + 35% numbers from step 1:
- Personalized Torah Book — Softcover 8×8
- Personalized Torah Book — Hardcover 8×8
- Personalized Torah Book — Board Book 6×6

Plus 3 subscription offerings via the **Shopify Subscriptions** app (Weekly / Monthly / Yearly Parashah Club) attached as selling plans on the softcover product.

Real GraphQL variant IDs replace the placeholders in `src/lib/shopify.ts → SHOPIFY_VARIANT_IDS`.

### 3. Sync prices Shopify ↔ Printify

A second job in `printify-pricing` updates the Shopify variant `price` whenever Printify cost changes (so the +35% margin always holds). Runs:
- Manually from Admin CMS via a "Refresh prices from Printify" button.
- Daily via a `pg_cron` schedule.

### 4. Order flow (Option b — manual approval)

```
User checkout → Shopify cart → Shopify checkout (real $)
   ↓ orders/paid webhook
shopify-order-webhook (NEW) → marks book row status='paid'
   ↓ admin sees in CMS queue
Admin clicks "Approve & send to Printify"
   ↓
printify-submit (existing) → uploads page images, creates Printify order
   ↓ printify-webhook (existing) → printing → shipped → delivered
```

New pieces:
- `supabase/functions/shopify-order-webhook/index.ts` — verifies HMAC, finds matching `book` by cart attribute `book_id`, sets `status='paid'`, stores `shopify_order_id` on the books row (new column).
- Wizard checkout passes `attributes: [{ key: 'book_id', value: book.id }]` to the cart so the webhook can match.
- Admin CMS gets a "Pending Printify submission" queue + one-click submit (calls existing `printify-submit`).

### 5. Things you'll need to do in Shopify Admin after I deploy

1. **Settings → Notifications → Webhooks → Create webhook**
   - Event: `Order payment` (orders/paid)
   - Format: JSON
   - URL: `https://qfcuzhjtdqbjgawqgcvk.supabase.co/functions/v1/shopify-order-webhook`
   - Copy the webhook signing secret and paste it back to me — I'll add it as `SHOPIFY_WEBHOOK_SECRET`.
2. In **Printify** dashboard → Settings → Webhooks, point order events at:
   `https://qfcuzhjtdqbjgawqgcvk.supabase.co/functions/v1/printify-webhook`
3. Confirm Printify shop ID + blueprint/print-provider IDs in Admin CMS settings (already configurable).

### 6. QA pass

- Create test book → checkout → pay with Shopify Bogus Gateway
- Verify webhook fires, book shows in admin queue
- Approve → confirm Printify order created with personalized images
- Confirm status updates as Printify ships

---

## Files I'll touch

- New: `supabase/functions/printify-pricing/index.ts`
- New: `supabase/functions/shopify-order-webhook/index.ts`
- New migration: `printify_prices` table + RLS, add `shopify_order_id` to `books`
- Edit: `src/lib/shopify.ts` (real variant IDs)
- Edit: `src/components/wizard/BookOptionsStep.tsx` (read live prices)
- Edit: `src/components/wizard/CheckoutStep.tsx` (read live prices)
- Edit: `src/components/admin/AdminCMS.tsx` (refresh prices button + Printify submission queue)
- Edit: `supabase/functions/shopify-create-checkout/index.ts` (attach `book_id` cart attribute)

---

## What I need from you to start

1. ✅ Activate a paid Shopify plan
2. After plan is active: reply "go" and I'll create the products at cost +35%, wire IDs, deploy webhooks, and prompt you for the Shopify webhook signing secret.
