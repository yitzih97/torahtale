-- Subscription-hijack guard.
--
-- "Users can CRUD own subscriptions" (FOR ALL) lets a customer write *every*
-- column on their own row, including the Shopify correlation fields. The recurring
-- shopify-webhook mints a free book by looking up
--   subscriptions WHERE shopify_customer_id = <paid order customer> AND status='active'
-- and minting under that row's user_id. So a customer who sets their own row's
-- shopify_customer_id to a victim's (enumerable, numeric) Shopify customer id could
-- have the victim's paid recurring order mint a book onto the attacker's account.
--
-- These correlation fields must only ever be written by the webhooks/edge functions
-- (service_role) or an admin. Customers keep writing the harmless config fields
-- (status, frequency, price_per_week, child/shipping data) exactly as before — none
-- of the client flows touch the locked fields, so this changes no legitimate path.
CREATE OR REPLACE FUNCTION public.guard_subscription_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
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

DROP TRIGGER IF EXISTS guard_subscription_privileged_fields ON public.subscriptions;
CREATE TRIGGER guard_subscription_privileged_fields
  BEFORE INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.guard_subscription_privileged_fields();
