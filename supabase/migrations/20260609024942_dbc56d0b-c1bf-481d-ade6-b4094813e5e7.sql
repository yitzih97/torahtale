
-- Fix: Users could approve their own reviews (set approved=true)
DROP POLICY IF EXISTS "Users CRUD own reviews" ON public.book_reviews;

CREATE POLICY "Users insert own reviews"
ON public.book_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND approved = false);

CREATE POLICY "Users read own reviews"
ON public.book_reviews
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users update own reviews not approval"
ON public.book_reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND approved = false);

CREATE POLICY "Users delete own reviews"
ON public.book_reviews
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fix: tighten authenticated SELECT on site_settings to only safe categories or admin
DROP POLICY IF EXISTS "Authenticated users can read safe site_settings" ON public.site_settings;

CREATE POLICY "Authenticated users can read safe site_settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (
  category = ANY (ARRAY['website'::text, 'branding'::text, 'seo'::text, 'prompts'::text, 'ai'::text, 'book-templates'::text, 'integrations'::text])
  OR has_role(auth.uid(), 'admin'::app_role)
);
