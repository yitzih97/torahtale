-- Printify per-format config for the live project. The standalone coloring
-- book config (20260625160000) carried as a migration, but the shop id and the
-- softcover / hardcover-8x8 / board per-format settings only ever existed as
-- ad-hoc data rows and did NOT survive the project recreate. Without them,
-- printify-submit hard-fails ("Printify config missing for format …") on every
-- non-coloring order. Encode them as a migration so they are durable.
--
-- Blueprint ids are the District Photo (print provider 28) book blueprints:
--   softcover  = 2733 (8×8, Cover + 20 pages)
--   hardcover  = 2737 (8×8, Cover + 24 pages)  -> format key "hardcover-8x8"
--   board      = 2727 (6×6, Cover + 10 spreads)
-- Prices are in cents and mirror current retail (printify-submit sets them as
-- the Printify product variant price; the customer is charged via Shopify).
INSERT INTO public.site_settings (category, key, value) VALUES
  ('integrations', 'printify-shop-id', '26962304'),

  ('integrations', 'printify-blueprint-id-softcover', '2733'),
  ('integrations', 'printify-print-provider-id-softcover', '28'),
  ('integrations', 'printify-variant-id-softcover', '149010'),
  ('integrations', 'printify-price-softcover', '1499'),

  ('integrations', 'printify-blueprint-id-hardcover-8x8', '2737'),
  ('integrations', 'printify-print-provider-id-hardcover-8x8', '28'),
  ('integrations', 'printify-variant-id-hardcover-8x8', '149190'),
  ('integrations', 'printify-price-hardcover-8x8', '2499'),

  ('integrations', 'printify-blueprint-id-board', '2727'),
  ('integrations', 'printify-print-provider-id-board', '28'),
  ('integrations', 'printify-variant-id-board', '148738'),
  ('integrations', 'printify-price-board', '2999')
ON CONFLICT (category, key) DO UPDATE SET value = EXCLUDED.value;
