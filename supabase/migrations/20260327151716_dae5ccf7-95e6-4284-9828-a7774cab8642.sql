
-- Fix user_roles privilege escalation: restrict INSERT/UPDATE/DELETE to admins only
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Restrict site_settings: replace open read with category-scoped anon access
DROP POLICY "Anyone can read site_settings" ON public.site_settings;

CREATE POLICY "Authenticated users can read site_settings"
ON public.site_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Public can read website settings"
ON public.site_settings FOR SELECT TO anon
USING (category IN ('website', 'branding'));
