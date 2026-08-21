-- What the 'staff' role may do. The rule behind every line below: a staff user
-- can see and finish BOOKS, and can reach nothing else - not a customer, not a
-- subscription, not a price, and never a DELETE.

-- ── A user may read their own roles ──────────────────────────────────────────
-- user_roles was admin-read-only, so a staff member could not discover that
-- they are staff and the admin screen had no way to tell them apart from a
-- customer. Reading your OWN row leaks nothing: it tells you what you already
-- are. Reading anyone else's stays admin-only.
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ── Who is staff ─────────────────────────────────────────────────────────────
-- Granted by EMAIL rather than by hand-editing user_roles after the account
-- exists: the account can then be created, deleted and recreated at any time
-- and comes back with exactly these rights, and the list of employees is a
-- thing you can read rather than something buried in a join table.
CREATE TABLE IF NOT EXISTS public.staff_emails (
  email      text PRIMARY KEY,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage staff emails" ON public.staff_emails;
CREATE POLICY "Admins manage staff emails"
  ON public.staff_emails FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.staff_emails (email, note)
VALUES ('agent@torahtale.com', 'Book review + print agent')
ON CONFLICT (email) DO NOTHING;

-- The role attaches itself when the account is created, so provisioning is just
-- "make the login" - no second step to forget.
CREATE OR REPLACE FUNCTION public.grant_staff_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.staff_emails s WHERE lower(s.email) = lower(NEW.email)
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'staff')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.grant_staff_role() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS grant_staff_role_on_signup ON auth.users;
CREATE TRIGGER grant_staff_role_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_staff_role();

-- And for an account that already exists.
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'staff'::public.app_role
FROM auth.users u
JOIN public.staff_emails s ON lower(s.email) = lower(u.email)
ON CONFLICT (user_id, role) DO NOTHING;

-- ── Books: the whole job ─────────────────────────────────────────────────────
-- SELECT and UPDATE only. There is deliberately no INSERT and no DELETE policy
-- for staff: they finish the books customers ordered, they do not create books
-- and they cannot remove one.
DROP POLICY IF EXISTS "Staff can read all books" ON public.books;
CREATE POLICY "Staff can read all books"
  ON public.books FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

DROP POLICY IF EXISTS "Staff can update all books" ON public.books;
CREATE POLICY "Staff can update all books"
  ON public.books FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));

-- No policy is added for profiles, children, subscriptions, site_settings,
-- contact tickets or page views. Under RLS, absence IS the denial: a staff user
-- selecting from any of them gets an empty set.

-- ── Money stays out of reach even on a book they may edit ────────────────────
-- The payment-bypass guard sanitizes privileged fields for everyone who is not
-- service_role or admin, which would also have frozen the status column staff
-- exist to move. So staff get their own branch: any status, none of the money.
CREATE OR REPLACE FUNCTION public.guard_book_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  -- Staff run the production queue: they may move a book to any status
  -- (pending_review -> approved -> ordered...), but the paid/Shopify/Printify
  -- correlation fields are written by the webhooks and the print submission,
  -- never by hand. An UPDATE from staff keeps whatever those already were.
  IF TG_OP = 'UPDATE' AND public.has_role(auth.uid(), 'staff') THEN
    NEW.paid_at := OLD.paid_at; NEW.shopify_order_id := OLD.shopify_order_id;
    NEW.shopify_order_name := OLD.shopify_order_name; NEW.printify_product_id := OLD.printify_product_id;
    NEW.printify_order_id := OLD.printify_order_id; NEW.order_number := OLD.order_number;
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
