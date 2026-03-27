
-- 1. Create a public view for site_assets that excludes prompt_used
CREATE VIEW public.site_assets_public AS
SELECT id, asset_key, image_url, status, created_at, updated_at
FROM public.site_assets;

-- 2. Drop the overly permissive public SELECT policy on site_assets
DROP POLICY IF EXISTS "Anyone can read site_assets" ON public.site_assets;

-- 3. Add a SELECT policy so only admins can read full site_assets table
CREATE POLICY "Only admins can read site_assets"
ON public.site_assets
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Grant SELECT on the public view to anon and authenticated
GRANT SELECT ON public.site_assets_public TO anon, authenticated;

-- 5. Enable RLS on site_assets_public view (views inherit table RLS, but grant is needed)

-- 6. Fix contact_tickets: replace the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can insert tickets" ON public.contact_tickets;

CREATE POLICY "Anyone can insert tickets"
ON public.contact_tickets
FOR INSERT
TO anon, authenticated
WITH CHECK (
  name IS NOT NULL AND email IS NOT NULL AND message IS NOT NULL
);
