
# Admin → Users: Enhanced List & Detail

Scope: frontend-only changes inside `src/pages/Admin.tsx` (Users tab + selected-user view). No DB or backend changes.

## 1. Users list — controls bar

Add a sticky toolbar above the list with:

- **Search** input — matches name, email, or user id (debounced, client-side).
- **Sort** dropdown — Newest, Oldest, Name A–Z, Most books, Most subs, Most spend.
- **Filter** chips:
  - Has active subscription / Canceled / None
  - Has orders / No orders
  - Joined: 7d / 30d / 90d / All
- **View toggle** — Table (current) ↔ Card grid (avatar tiles, 3-up).
- **Bulk select** — checkbox column + bulk bar: "Export CSV", "Copy emails", "Mark VIP" (local tag stored in `site_settings` key `admin_user_tags`).
- **Per-page** selector (25 / 50 / 100) + pagination.
- **Refresh** button (invalidates `admin-profiles`, `admin-books`, `admin-children`, `admin-subscriptions`).

Extra columns in table view: avatar, # children, last order date, lifetime book count, active sub badge, total spend (sum of `books.shipping_data.total` when present), row actions menu (View · Email · Copy ID · Tag VIP).

## 2. User detail — redesigned card

Replace the single long card with a header + tabbed sections:

**Header block**
- Larger avatar (initials or first child photo fallback), name, email (click-to-copy), join date, user id (copy), VIP tag toggle.
- Quick stats row: Books, Subscriptions, Children, Lifetime spend, Last active.
- Action buttons: Email user (mailto), Copy ID, Open Shopify customer (link via email search), Delete account (confirm dialog → calls existing delete flow; if not present, hide).

**Tabs inside the detail view**
1. **Overview** — stats, recent activity timeline (orders + sub events, newest 10).
2. **Children** — current grid, plus per-kid: edit name/age/gender inline (uses existing children update), delete child.
3. **Books / Orders** — current list, enriched with: order number, format (soft/hard/board), quantity, total, status pill with inline status changer (reuse `updateBookStatus`), actions (View, Download ZIP, Resend to Printify, Cancel).
4. **Subscriptions** — list with inline status control (Active / Paused / Canceled via `updateSubscriptionStatus`), next delivery date, price, frequency, child.
5. **Payments** — derived from `books.shipping_data` + `order_number`: table of payments (date, order #, amount, method=Shopify, status). Note: real charge data lives in Shopify; this view summarizes what we store. A "View in Shopify" deep link is provided when `order_number` exists.
6. **Addresses** — current shipping-address dedupe view, plus default-address marker.
7. **Devices / Sessions** — not tracked in DB today. Show an empty-state card explaining this requires a future `auth_sessions` log; hide tab if we decide to omit for now.

## 3. Small UX polish

- Sticky tab header inside detail.
- Empty states with subtle icons + one-line guidance.
- All controls gold-focus-ring, glass surfaces, matching the existing premium Apple/liquid-silver theme.
- Mobile: toolbar collapses into a dropdown; card grid stacks 1-col.

## Files to edit
- `src/pages/Admin.tsx` — Users tab list + selected-user view (the only file touched).

## Open questions before build
1. **Devices tab** — include as empty-state placeholder, or drop entirely? (no session tracking exists)
2. **Delete account** — should the admin be able to hard-delete a user (cascade their books/children/subs)? If yes, I'll add an edge function; if no, I'll omit.
3. **VIP tagging** — OK to store in `site_settings` as a JSON map, or do you want a dedicated `user_tags` table? (table is cleaner long-term)
