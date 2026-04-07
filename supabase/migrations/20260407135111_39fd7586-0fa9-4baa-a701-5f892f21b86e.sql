
-- Allow public/anon users to read SEO settings so meta tags load without auth
DROP POLICY IF EXISTS "Public can read website settings" ON public.site_settings;
CREATE POLICY "Public can read website and seo settings"
ON public.site_settings
FOR SELECT
TO anon
USING (category = ANY (ARRAY['website', 'branding', 'seo']));

-- Also update the authenticated policy to include seo
DROP POLICY IF EXISTS "Authenticated users can read safe site_settings" ON public.site_settings;
CREATE POLICY "Authenticated users can read safe site_settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (category = ANY (ARRAY['website', 'branding', 'seo']) OR has_role(auth.uid(), 'admin'));
