

## Plan: Mobile Responsive Fixes + Local Checkout Cleanup

### 1. Add Mobile Hamburger Menu to Navbar

**File:** `src/components/Navbar.tsx`

- Add a hamburger menu button (visible on `md:hidden`)
- On tap, open a slide-down or sheet menu with nav links: How It Works, Gallery, Reviews, Dashboard/Login, Sign Out
- Use the existing Sheet component from `src/components/ui/sheet.tsx`
- Import `Menu` icon from lucide-react

### 2. Fix Hero Section Mobile Layout

**File:** `src/components/HeroSection.tsx`

- On mobile (`sm:` and below), stack content vertically and center-align text
- Reduce heading text size for mobile: `text-2xl` base (currently `text-4xl`)
- Reduce min-heights for headline/description containers on mobile
- Make the gradient overlay stronger on mobile (full coverage instead of left-only) so text is readable over the background image
- Adjust padding: less left padding on mobile, centered layout
- Make CTA button full-width on mobile
- Reduce social proof section size on mobile

### 3. Fix HowItWorks Mobile Layout

**File:** `src/components/HowItWorks.tsx`

- The grid is already `md:grid-cols-3` which stacks on mobile — this is fine
- Reduce vertical padding on mobile: `py-16 lg:py-32`
- Reduce heading size on mobile

### 4. Make SubscriptionUpsellDialog Fully Local (Remove Shopify Redirect)

**File:** `src/components/wizard/SubscriptionUpsellDialog.tsx`

- Remove `useCartStore`, `SHOPIFY_VARIANT_IDS`, `ShopifyProduct` imports
- Remove `window.open(checkoutUrl)` redirect
- Instead, save subscription to the database (like `handlePlaceOrder` does in CreationWizard) and call `onSubscribed`/`onClose`
- Update footer text from "Secure checkout via Shopify" to "Secure checkout"
- Accept `userId` prop or use `useAuth` to get the current user for DB insert

### 5. Verify CheckoutStep is Fully Local

**File:** `src/components/wizard/CheckoutStep.tsx`

- Already confirmed: no Shopify redirect exists here. The checkout calls `onPlaceOrder` which saves to DB locally. No changes needed.

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/Navbar.tsx` | Add mobile hamburger menu with Sheet |
| `src/components/HeroSection.tsx` | Mobile-responsive text, layout, gradient |
| `src/components/HowItWorks.tsx` | Mobile padding/sizing tweaks |
| `src/components/wizard/SubscriptionUpsellDialog.tsx` | Remove Shopify redirect, save subscription locally |

