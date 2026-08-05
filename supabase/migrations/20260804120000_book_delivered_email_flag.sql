-- Records when the "Your Book Has Arrived!" delivery email was sent for a book.
-- printify-webhook only sends on the first Printify delivered event and stamps
-- this column, so a re-fired delivered webhook can't send a duplicate notice.
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS delivered_email_sent_at timestamptz;
