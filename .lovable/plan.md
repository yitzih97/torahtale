

## Plan: Fix Security Vulnerabilities + Add Legal Pages

### 1. Fix `user_roles` Privilege Escalation (Critical)

Add RLS policies to `user_roles` that restrict INSERT, UPDATE, and DELETE to admins only.

```sql
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
```

### 2. Restrict `site_settings` Public Read Access

Replace the current "Anyone can read" SELECT policy with an authenticated-only policy:

```sql
DROP POLICY "Anyone can read site_settings" ON public.site_settings;
CREATE POLICY "Authenticated users can read site_settings"
ON public.site_settings FOR SELECT TO authenticated
USING (true);
```

Also add a public SELECT policy limited to non-sensitive categories (website content only, not AI config):

```sql
CREATE POLICY "Public can read website settings"
ON public.site_settings FOR SELECT TO anon
USING (category IN ('website', 'branding'));
```

### 3. Enable Leaked Password Protection

Guide the user to enable it: Cloud → Users → Auth Settings → Email → Password HIBP Check toggle.

### 4. Create Terms of Service Page (`src/pages/Terms.tsx`)

Full legal page covering:
- Service description (AI-generated personalized Torah children's books)
- Account registration and responsibilities
- Free tier limits (2 books/month) and subscription plans
- Payment processing via Shopify
- Print-on-demand fulfillment via Printify
- Intellectual property (AI-generated content ownership)
- User content and children's data
- Refund/cancellation policy
- Limitation of liability
- Termination rights

### 5. Create Privacy Policy Page (`src/pages/Privacy.tsx`)

Full legal page covering:
- Data collected (name, email, children's info, photos, shipping addresses)
- How data is used (book generation, order fulfillment, AI processing)
- Third-party services (Shopify payments, Printify fulfillment, Google AI)
- Children's privacy (COPPA considerations)
- Data storage and security
- Cookie usage
- User rights (access, deletion, correction)
- Data retention
- Contact information

### 6. Wire Up Routes and Links

- Add `/terms` and `/privacy` routes in `src/App.tsx`
- Update footer links in `src/components/Footer.tsx` from `href="#"` to `/terms` and `/privacy`

---

### Files Changed

| File | Change |
|------|--------|
| DB migration | RLS policies for `user_roles` and `site_settings` |
| `src/pages/Terms.tsx` | New Terms of Service page |
| `src/pages/Privacy.tsx` | New Privacy Policy page |
| `src/App.tsx` | Add routes |
| `src/components/Footer.tsx` | Update links |

