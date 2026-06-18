-- Lock contact_tickets default status on insert: submitters can't set
-- status to resolved/closed/etc.
DROP POLICY IF EXISTS "Anyone can insert tickets" ON public.contact_tickets;
CREATE POLICY "Anyone can insert tickets"
ON public.contact_tickets FOR INSERT
TO anon, authenticated
WITH CHECK (
  name IS NOT NULL
  AND email IS NOT NULL
  AND message IS NOT NULL
  AND status = 'new'
);
