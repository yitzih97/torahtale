-- Records when the "Your Book Has Shipped!" email was sent for a book, so a
-- re-fired Printify shipment event can't send a duplicate. Mirrors
-- delivered_email_sent_at.
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS shipped_email_sent_at timestamptz;
