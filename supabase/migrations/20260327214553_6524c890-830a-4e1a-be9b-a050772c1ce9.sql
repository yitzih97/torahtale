-- Drop the overly permissive public SELECT policy on site_assets
-- The site_assets_public view (already created) provides safe public access
DROP POLICY IF EXISTS "Public can read site_assets" ON public.site_assets;