-- Route the book pipeline: story/text generation → Claude Fable 5 (Anthropic),
-- all image generation → Nano Banana 2 (Gemini 3.1 Flash Image).
-- These rows are what the edge functions read at runtime (site_settings ai/*),
-- so this flips the LIVE routing even where an older value was saved by admin.
INSERT INTO public.site_settings (category, key, value)
VALUES
  ('ai', 'story-model', 'claude-fable-5'),
  ('ai', 'image-model', 'gemini-3.1-flash-image-preview'),
  ('ai', 'site-image-model', 'gemini-3.1-flash-image-preview')
ON CONFLICT (category, key)
DO UPDATE SET value = EXCLUDED.value, updated_at = now();
