

## Plan: Dashboard Account Settings + Printify Auto-Submit on Approve

### What We're Building

1. **User Account Settings tab** in `/dashboard` — a new "Settings" tab with sections for profile info, payment methods, notification preferences, and active sessions/devices
2. **Auto-submit to Printify on admin approval** — when an admin clicks "Approve" in the admin modal or orders tab, the system automatically calls `printify-submit` to create the product and order on Printify

### Changes

#### 1. Dashboard Settings Tab
**File: `src/pages/Dashboard.tsx`**
- Add a 4th tab: "Settings" with a gear icon
- Update `TabsList` grid from `grid-cols-3` to `grid-cols-4`
- Settings tab sections:
  - **Profile**: edit name, email (read-only), change password
  - **Payment Methods**: list saved cards, add/remove (placeholder UI since Stripe isn't wired yet)
  - **Notifications**: toggle email notifications for book ready, shipping updates, subscription reminders
  - **Account Actions**: sign out, delete account confirmation
- Keep consistent design with existing dashboard cards (rounded-2xl, shadow-soft-sm, motion animations)

#### 2. Auto-Submit to Printify on Approve
**File: `src/components/admin/AdminBookGenerationModal.tsx`**
- In `handleApprove()`, after updating book status to "approved", call `supabase.functions.invoke("printify-submit", { body: { action: "submit-order", bookId: book.id } })`
- Show toast on success ("Sent to Printify for printing!") or error
- Update book status to "printing" on successful Printify submission

**File: `src/pages/Admin.tsx`**
- In the inline "Approve" button click handler (line ~316), also call `printify-submit` after updating status
- Add loading state for the approve action

#### 3. Fix Build Error
**File: `src/components/CreationWizard.tsx`**
- The build error is likely from the `c.photo` upload — `supabase.storage.upload()` expects `File | Blob | ArrayBuffer` but `c.photo` is typed as `File | null`. The `if (c.photo)` check should narrow this, but we'll add explicit typing to be safe
- Also check for any other TS issues introduced in the last round

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Add Settings tab with profile, payment, notifications, account sections |
| `src/components/admin/AdminBookGenerationModal.tsx` | Call `printify-submit` edge function after approve |
| `src/pages/Admin.tsx` | Call `printify-submit` on inline approve button |
| `src/components/CreationWizard.tsx` | Fix build error (type narrowing) |

### Technical Notes
- The `printify-submit` edge function already exists and handles `submit-order` action — it uploads page images, creates a product, and sets status to "printing"
- The function requires `PRINTIFY_API_KEY` secret (already configured) and `printify-shop-id` in site_settings
- No new database migrations needed
- No new dependencies needed

