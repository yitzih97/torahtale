CREATE TABLE public.contact_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL DEFAULT 'general',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert tickets" ON public.contact_tickets FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can read tickets" ON public.contact_tickets FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tickets" ON public.contact_tickets FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));