## Goal
Make the "Testimonials" link in the navbar actually scroll to the testimonials section, from any page.

## Root cause
- The navbar link points to `#testimonials`, but `GalleryReviewsSection` uses `id="gallery"` — so the anchor never matches.
- The link is also a plain `<a href="#testimonials">`, which only works on the home page. From `/about`, `/contact`, etc., it does nothing useful.

## Changes

### 1. `src/components/GalleryReviewsSection.tsx`
- Change the section `id` from `gallery` to `testimonials` so it matches the nav link and the existing `t.nav.testimonials` label.

### 2. `src/components/Navbar.tsx`
- Replace the plain `<a href="#testimonials">` with a smarter handler:
  - If already on `/`, smooth-scroll to `#testimonials`.
  - If on any other route, navigate to `/#testimonials` and then scroll once the home page mounts.
- Apply the same fix to the mobile sheet menu link.
- Use `useNavigate` + `useLocation` from `react-router-dom`.

### 3. `src/pages/Index.tsx`
- On mount (and when the hash changes), if `location.hash === "#testimonials"`, scroll the section into view smoothly. This handles the cross-page navigation case cleanly.

## Files to edit
- `src/components/GalleryReviewsSection.tsx` — rename section id.
- `src/components/Navbar.tsx` — smart scroll/navigate handler for desktop + mobile.
- `src/pages/Index.tsx` — honor `#testimonials` hash on mount.

No other anchors currently use `#gallery`, so renaming is safe.