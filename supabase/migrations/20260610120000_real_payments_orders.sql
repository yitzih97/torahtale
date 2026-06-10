-- Real Shopify payment + Printify order plumbing.
-- Adds correlation columns so webhooks can match orders back to books/subscriptions,
-- and persists the Printify product/order ids that approval creates.

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS shopify_order_id text,
  ADD COLUMN IF NOT EXISTS shopify_order_name text,
  ADD COLUMN IF NOT EXISTS printify_product_id text,
  ADD COLUMN IF NOT EXISTS printify_order_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS shopify_contract_id text,
  ADD COLUMN IF NOT EXISTS shopify_customer_id text,
  ADD COLUMN IF NOT EXISTS next_billing_at timestamptz;

-- Correlation lookups used by the webhooks.
CREATE INDEX IF NOT EXISTS idx_books_shopify_order_id ON public.books (shopify_order_id);
CREATE INDEX IF NOT EXISTS idx_books_order_number ON public.books (order_number);
CREATE INDEX IF NOT EXISTS idx_books_printify_order_id ON public.books (printify_order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_shopify_contract_id ON public.subscriptions (shopify_contract_id);
