-- Route book + site image generation to Nano Banana 2 Lite
-- (gemini-3.1-flash-lite-image): ~4s/image and ~1/3 the price of full Nano
-- Banana 2. It only outputs 1K, so generate-image keeps COVERS on the full
-- 2K-capable models (the pinned lite model is skipped for pageType "cover").
INSERT INTO public.site_settings (category, key, value) VALUES
  ('ai', 'image-model', 'gemini-3.1-flash-lite-image'),
  ('ai', 'site-image-model', 'gemini-3.1-flash-lite-image')
ON CONFLICT (category, key) DO UPDATE SET value = EXCLUDED.value;
