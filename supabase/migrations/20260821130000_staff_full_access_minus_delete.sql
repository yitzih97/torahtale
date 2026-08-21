-- The employee login is widened to everything an admin can do EXCEPT delete,
-- and moves from agent@torahtale.com to help@torahtale.com.
--
-- The shape of it: for every table an admin can reach, staff get the same
-- commands minus DELETE. Two things are deliberately NOT included, because
-- granting them would make "no delete" meaningless - user_roles and
-- staff_emails. Either one lets a staff account promote itself to admin, and an
-- admin can delete. Role management stays with the owner.
--
-- A staff account also cannot delete a customer account: delete-account is an
-- edge function and it checks for admin.

-- ── The account moves ────────────────────────────────────────────────────────
INSERT INTO public.staff_emails (email, note)
VALUES ('help@torahtale.com', 'Book review, editing and print agent')
ON CONFLICT (email) DO NOTHING;
DELETE FROM public.staff_emails WHERE lower(email) = 'agent@torahtale.com';

-- Whoever is no longer on the list is no longer staff. (The old account is also
-- removed outright by scripts/create-staff-user.sh --retire, but a role left
-- behind by a deleted allowlist entry would outlive its reason to exist.)
DELETE FROM public.user_roles r
USING auth.users u
WHERE r.user_id = u.id
  AND r.role = 'staff'
  AND NOT EXISTS (
    SELECT 1 FROM public.staff_emails s WHERE lower(s.email) = lower(u.email)
  );

-- And whoever IS on the list is staff, whenever their account was made.
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'staff'::public.app_role
FROM auth.users u
JOIN public.staff_emails s ON lower(s.email) = lower(u.email)
ON CONFLICT (user_id, role) DO NOTHING;

-- ── Everything an admin can read ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff can read all profiles" ON public.profiles;
CREATE POLICY "Staff can read all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

DROP POLICY IF EXISTS "Staff can read all children" ON public.children;
CREATE POLICY "Staff can read all children" ON public.children FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

DROP POLICY IF EXISTS "Staff can read page views" ON public.page_views;
CREATE POLICY "Staff can read page views" ON public.page_views FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

-- ── Everything an admin can edit, minus DELETE ───────────────────────────────
DROP POLICY IF EXISTS "Staff can read all subscriptions" ON public.subscriptions;
CREATE POLICY "Staff can read all subscriptions" ON public.subscriptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));
DROP POLICY IF EXISTS "Staff can update all subscriptions" ON public.subscriptions;
CREATE POLICY "Staff can update all subscriptions" ON public.subscriptions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));

DROP POLICY IF EXISTS "Staff can read tickets" ON public.contact_tickets;
CREATE POLICY "Staff can read tickets" ON public.contact_tickets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));
DROP POLICY IF EXISTS "Staff can update tickets" ON public.contact_tickets;
CREATE POLICY "Staff can update tickets" ON public.contact_tickets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));

DROP POLICY IF EXISTS "Staff can read ticket replies" ON public.contact_ticket_replies;
CREATE POLICY "Staff can read ticket replies" ON public.contact_ticket_replies FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

DROP POLICY IF EXISTS "Staff can view affiliate applications" ON public.affiliate_applications;
CREATE POLICY "Staff can view affiliate applications" ON public.affiliate_applications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));
DROP POLICY IF EXISTS "Staff can update affiliate applications" ON public.affiliate_applications;
CREATE POLICY "Staff can update affiliate applications" ON public.affiliate_applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));

-- book_reviews and site_assets/site_settings are FOR ALL to an admin, which
-- includes DELETE. Staff get the three commands that are not DELETE, spelled
-- out one at a time so the missing one is visible.
DROP POLICY IF EXISTS "Staff can read reviews" ON public.book_reviews;
CREATE POLICY "Staff can read reviews" ON public.book_reviews FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));
DROP POLICY IF EXISTS "Staff can add reviews" ON public.book_reviews;
CREATE POLICY "Staff can add reviews" ON public.book_reviews FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'staff'));
DROP POLICY IF EXISTS "Staff can update reviews" ON public.book_reviews;
CREATE POLICY "Staff can update reviews" ON public.book_reviews FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));

DROP POLICY IF EXISTS "Staff can read site_settings" ON public.site_settings;
CREATE POLICY "Staff can read site_settings" ON public.site_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));
DROP POLICY IF EXISTS "Staff can add site_settings" ON public.site_settings;
CREATE POLICY "Staff can add site_settings" ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'staff'));
DROP POLICY IF EXISTS "Staff can update site_settings" ON public.site_settings;
CREATE POLICY "Staff can update site_settings" ON public.site_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));

DROP POLICY IF EXISTS "Staff can read site_assets" ON public.site_assets;
CREATE POLICY "Staff can read site_assets" ON public.site_assets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));
DROP POLICY IF EXISTS "Staff can add site_assets" ON public.site_assets;
CREATE POLICY "Staff can add site_assets" ON public.site_assets FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'staff'));
DROP POLICY IF EXISTS "Staff can update site_assets" ON public.site_assets;
CREATE POLICY "Staff can update site_assets" ON public.site_assets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));

-- ── Storage: the CMS uploads, and the child photos a book is built from ──────
DROP POLICY IF EXISTS "Staff can upload site images" ON storage.objects;
CREATE POLICY "Staff can upload site images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'staff'));
DROP POLICY IF EXISTS "Staff can update site images" ON storage.objects;
CREATE POLICY "Staff can update site images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'staff'));
DROP POLICY IF EXISTS "Staff read all child photos" ON storage.objects;
CREATE POLICY "Staff read all child photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'child-photos' AND public.has_role(auth.uid(), 'staff'));

-- ── The write guards ─────────────────────────────────────────────────────────
-- Staff edit orders and subscriptions in full now, so they pass these the way
-- an admin does. The guards exist to stop a CUSTOMER writing their own order
-- into a paid state; they were never the thing keeping an employee honest.
CREATE OR REPLACE FUNCTION public.guard_book_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.role() = 'service_role'
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'staff') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS NULL OR NEW.status NOT IN ('draft','awaiting_payment','canceled') THEN
      NEW.status := 'awaiting_payment';
    END IF;
    NEW.paid_at := NULL; NEW.shopify_order_id := NULL; NEW.shopify_order_name := NULL;
    NEW.printify_product_id := NULL; NEW.printify_order_id := NULL; NEW.order_number := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status NOT IN ('draft','awaiting_payment','canceled') THEN
      NEW.status := OLD.status;
    END IF;
    NEW.paid_at := OLD.paid_at; NEW.shopify_order_id := OLD.shopify_order_id;
    NEW.shopify_order_name := OLD.shopify_order_name; NEW.printify_product_id := OLD.printify_product_id;
    NEW.printify_order_id := OLD.printify_order_id; NEW.order_number := OLD.order_number;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_book_privileged_fields() FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public.guard_subscription_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.role() = 'service_role'
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'staff') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.shopify_customer_id := NULL;
    NEW.shopify_contract_id := NULL;
    NEW.next_billing_at := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.shopify_customer_id := OLD.shopify_customer_id;
    NEW.shopify_contract_id := OLD.shopify_contract_id;
    NEW.next_billing_at := OLD.next_billing_at;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_subscription_privileged_fields() FROM anon, authenticated, public;
