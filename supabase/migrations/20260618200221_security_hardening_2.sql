-- Payment-bypass guard: only service role (webhooks/edge fns) and admins may
-- set paid/fulfillment fields on books; customers are sanitized to safe values.
CREATE OR REPLACE FUNCTION public.guard_book_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
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
DROP TRIGGER IF EXISTS guard_book_privileged_fields ON public.books;
CREATE TRIGGER guard_book_privileged_fields
  BEFORE INSERT OR UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.guard_book_privileged_fields();

DROP POLICY IF EXISTS "Anyone can view site images" ON storage.objects;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.guard_book_privileged_fields() FROM anon, authenticated, public;
