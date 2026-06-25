-- Monday drip-release for subscriptions.
--
-- Books are no longer minted the instant Shopify bills. Instead each successful
-- charge CREDITS the subscription (books_remaining), and a Monday 9am-ET job
-- (release-subscription-books) mints exactly one book per week per subscription
-- while credit remains. This gives: "only after billed" (credit only grows on
-- orders/paid), weekly = 1 book/Monday, monthly = 4 books dripped one per Monday.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS books_remaining integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_release_date date;

COMMENT ON COLUMN public.subscriptions.books_remaining IS
  'Paid-but-not-yet-released book credit. Only the webhook (service_role) increments it on a successful charge; the Monday release job decrements it.';
COMMENT ON COLUMN public.subscriptions.next_release_date IS
  'The next Monday a book should be released for this subscription (America/New_York).';

-- Extend the customer-write guard: books_remaining and next_release_date are
-- billing/fulfillment state, so customers must not set them (a customer could
-- otherwise self-grant free books). Only service_role / admins may write them.
-- Keeps the existing correlation-field locks from the earlier guard migration.
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
    NEW.books_remaining := 0;
    NEW.next_release_date := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.shopify_customer_id := OLD.shopify_customer_id;
    NEW.shopify_contract_id := OLD.shopify_contract_id;
    NEW.next_billing_at := OLD.next_billing_at;
    NEW.books_remaining := OLD.books_remaining;
    NEW.next_release_date := OLD.next_release_date;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_subscription_privileged_fields() FROM anon, authenticated, public;

-- Charge ledger: idempotency for billing events. Shopify delivers (and retries)
-- orders/paid, so crediting must be exactly-once per order. Service-role only.
CREATE TABLE IF NOT EXISTS public.subscription_charges (
  shopify_order_id text PRIMARY KEY,
  subscription_id  uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  books_credited   integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_charges ENABLE ROW LEVEL SECURITY;
-- No policies → only service_role (which bypasses RLS) can read/write it.
