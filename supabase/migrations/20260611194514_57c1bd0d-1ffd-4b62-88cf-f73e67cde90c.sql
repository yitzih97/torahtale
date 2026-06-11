-- 1) Restrict site_settings authenticated read to safe public categories only
DROP POLICY IF EXISTS "Authenticated users can read safe site_settings" ON public.site_settings;
CREATE POLICY "Authenticated users can read safe site_settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (
  category = ANY (ARRAY['website'::text, 'branding'::text, 'seo'::text, 'wizard'::text])
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 2) Replace permissive WITH CHECK (true) on affiliate_applications with real validation
DROP POLICY IF EXISTS "Anyone can submit an affiliate application" ON public.affiliate_applications;
CREATE POLICY "Anyone can submit an affiliate application"
ON public.affiliate_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  full_name IS NOT NULL AND length(btrim(full_name)) > 0
  AND email IS NOT NULL AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND audience IS NOT NULL AND length(btrim(audience)) > 0
  AND payout_email IS NOT NULL AND payout_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND status = 'pending'
);