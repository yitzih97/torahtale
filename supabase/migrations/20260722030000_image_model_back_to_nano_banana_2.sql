-- Back to FULL Nano Banana 2 (gemini-3.1-flash-image-preview) at 2K for book
-- and site images — lite's 1K output read as low quality in print. Lite remains
-- a fast fallback in generate-image's chain (and the timeout rescue), and both
-- the admin modal and generate-book now run 6 images concurrently for speed.
INSERT INTO public.site_settings (category, key, value) VALUES
  ('ai', 'image-model', 'gemini-3.1-flash-image-preview'),
  ('ai', 'site-image-model', 'gemini-3.1-flash-image-preview')
ON CONFLICT (category, key) DO UPDATE SET value = EXCLUDED.value;
