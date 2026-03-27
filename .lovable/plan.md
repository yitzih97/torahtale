

## Plan: Favicon Update, Email Standardization, Contact Us + About Us Pages

### 1. Update Favicon to Gold Torah Logo

**File:** `index.html`
- Add `<link rel="icon" href="/favicon.svg" type="image/svg+xml">` pointing to a new SVG favicon
- Remove reference to old `favicon.ico`

**File:** `public/favicon.svg` (new)
- Create an SVG of a gold Torah scroll/book icon matching the site's accent color scheme (the gold BookOpen icon used in the header fallback)
- Delete `public/favicon.ico`

### 2. Standardize All Emails to help@torahtale.com

**File:** `src/pages/Terms.tsx`
- Replace `legal@torahtale.com` and `support@torahtale.com` with `help@torahtale.com`

**File:** `src/pages/Privacy.tsx`
- Replace all instances of `privacy@torahtale.com`, `dpo@torahtale.com`, `support@torahtale.com` with `help@torahtale.com`

**File:** `src/components/Footer.tsx`
- Add a "Support" section with `help@torahtale.com` link and links to Contact Us and About Us pages

### 3. Create Contact Us Page

**File:** `src/pages/Contact.tsx` (new)
- Premium layout matching the Terms/Privacy design (Navbar + Footer, hero header)
- Contact form with fields: Name, Email, Subject (dropdown: General, Order Issue, Technical, Feedback), Message
- Form saves submissions to a new `contact_tickets` database table
- Show `help@torahtale.com` as alternative contact method
- Toast confirmation on submit

**Database migration:** Create `contact_tickets` table with columns: id, name, email, subject, message, status (default 'new'), created_at. RLS: anon/authenticated can insert, no select.

### 4. Create About Us Page

**File:** `src/pages/About.tsx` (new)
- Premium layout with Navbar + Footer
- Sections: Mission (personalized Torah education), How We Started, Our Values (Torah-rooted content, child safety, quality illustrations), The Team (placeholder), and a CTA to create a book
- Clean typography, matching the legal pages' premium feel

### 5. Add Routes

**File:** `src/App.tsx`
- Add `/contact` and `/about` routes

### 6. Update Navigation

**File:** `src/components/Footer.tsx`
- Add Contact Us and About Us links to the footer navigation columns

**File:** `src/components/Navbar.tsx`
- Add About link to nav (optional, in mobile menu)

---

### Files Changed

| File | Change |
|------|--------|
| `index.html` | Update favicon link to SVG |
| `public/favicon.svg` | New gold Torah icon SVG |
| `src/pages/Terms.tsx` | Replace emails with help@torahtale.com |
| `src/pages/Privacy.tsx` | Replace emails with help@torahtale.com |
| `src/pages/Contact.tsx` | New Contact Us page with ticket form |
| `src/pages/About.tsx` | New About Us page |
| `src/App.tsx` | Add /contact and /about routes |
| `src/components/Footer.tsx` | Add email, Contact Us, About Us links |
| DB migration | Create contact_tickets table |

