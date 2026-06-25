-- Printify config for the standalone Coloring Book (blueprint 2721, District
-- Photo, 8.5×11). The variant id is intentionally omitted — printify-submit
-- auto-discovers it from the catalog when not configured. Price is in cents.
INSERT INTO public.site_settings (category, key, value) VALUES
  ('integrations', 'printify-blueprint-id-coloring', '2721'),
  ('integrations', 'printify-print-provider-id-coloring', '28'),
  ('integrations', 'printify-price-coloring', '1200')
ON CONFLICT (category, key) DO UPDATE SET value = EXCLUDED.value;
