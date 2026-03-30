

## Plan: Fix Post-Subscription Loop — Continue to Generation

### Problem
After subscribing via the upsell dialog, the wizard stays at step 8. Clicking "Generate Book" again re-checks the monthly book count (still >= 2), triggering the upsell dialog again — infinite loop.

### Root Cause
- `SubscriptionUpsellDialog` is rendered without an `onSubscribed` callback
- After successful payment, it just closes the dialog without proceeding to generation
- The book count check in `next()` has no way to know the user just subscribed

### Fix

**File: `src/components/CreationWizard.tsx`**

1. Add a ref to track that the user just subscribed (e.g. `justSubscribedRef`)
2. Pass `onSubscribed` to `SubscriptionUpsellDialog` that sets this ref to `true` 
3. In the `next()` function at step 8, skip the book-count check if `justSubscribedRef.current` is true — proceed directly to `startGeneration()`
4. After generation starts, reset the ref

This way: User hits limit → sees upsell → subscribes & pays → dialog closes → `onSubscribed` fires → automatically calls `startGeneration()` to continue the flow → book generates → step 9 animation → step 10 (book options) → step 11 (shipping) → step 12 (checkout) → step 13 (success).

### Changes

| File | Change |
|------|--------|
| `src/components/CreationWizard.tsx` | Add `justSubscribedRef`, pass `onSubscribed` callback that triggers generation, skip count check when just subscribed |

