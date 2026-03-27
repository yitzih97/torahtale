
-- site_assets table for image overrides
CREATE TABLE public.site_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_key text UNIQUE NOT NULL,
  image_url text,
  prompt_used text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- site_settings table for CMS
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid,
  UNIQUE(category, key)
);

-- RLS
ALTER TABLE public.site_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage site_assets" ON public.site_assets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read site_assets" ON public.site_assets FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage site_settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read site_settings" ON public.site_settings FOR SELECT TO anon, authenticated
  USING (true);

-- Storage bucket for site images
INSERT INTO storage.buckets (id, name, public) VALUES ('site-images', 'site-images', true);

CREATE POLICY "Admins can upload site images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view site images" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'site-images');
