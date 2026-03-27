
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read site_settings" ON public.site_settings;

-- Replace with a restricted policy matching the anon policy
CREATE POLICY "Authenticated users can read safe site_settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (category = ANY (ARRAY['website'::text, 'branding'::text]) OR has_role(auth.uid(), 'admin'::app_role));
