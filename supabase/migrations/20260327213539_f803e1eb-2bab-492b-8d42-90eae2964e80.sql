
-- Fix security definer view by dropping and recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.site_assets_public;

CREATE VIEW public.site_assets_public
WITH (security_invoker = true) AS
SELECT id, asset_key, image_url, status, created_at, updated_at
FROM public.site_assets;

-- Re-grant access
GRANT SELECT ON public.site_assets_public TO anon, authenticated;

-- We need a SELECT policy that allows anon/authenticated to read site_assets
-- but only the columns exposed through the view. Since RLS is row-level not column-level,
-- we need to allow SELECT for the view to work with security_invoker.
-- Add back a public read policy on site_assets (the view only exposes safe columns)
CREATE POLICY "Public can read site_assets"
ON public.site_assets
FOR SELECT
TO anon, authenticated
USING (true);

-- Drop the admin-only read policy since admins already have ALL access
DROP POLICY IF EXISTS "Only admins can read site_assets" ON public.site_assets;
