-- Lightweight first-party page-view tracking for the admin analytics dashboard.
-- The frontend inserts one row per path per browser session (fire-and-forget);
-- only admins can read them back.
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  session_id text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can record a page view" ON public.page_views;
CREATE POLICY "Anyone can record a page view"
  ON public.page_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read page views" ON public.page_views;
CREATE POLICY "Admins can read page views"
  ON public.page_views FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON public.page_views (created_at);
CREATE INDEX IF NOT EXISTS page_views_path_idx ON public.page_views (path);
