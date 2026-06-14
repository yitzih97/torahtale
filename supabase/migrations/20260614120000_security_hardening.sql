-- Security hardening (manual review follow-up)

-- 1) child-photos holds photos of minors and is accessed exclusively via signed
--    URLs in the app. A public bucket is served through the unauthenticated CDN
--    path, which bypasses the path-scoped storage.objects RLS — making every
--    child's photo readable by anyone with the URL. Make it private; the app
--    already uses createSignedUrl everywhere.
UPDATE storage.buckets SET public = false WHERE id = 'child-photos';

-- 2) orders/paid webhooks are delivered (and retried) by Shopify; the handler's
--    read-then-write idempotency check has no DB-level guard, so concurrent
--    deliveries can both pass it and double-process / mint duplicate
--    subscription books. Enforce uniqueness at the row level.
DROP INDEX IF EXISTS public.idx_books_shopify_order_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_books_shopify_order_id
  ON public.books (shopify_order_id)
  WHERE shopify_order_id IS NOT NULL;
