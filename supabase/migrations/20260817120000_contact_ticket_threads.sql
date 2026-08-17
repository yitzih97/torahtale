-- Make the contact inbox a real two-way channel.
--
-- Until now a ticket was a dead-end row: the customer got no acknowledgement,
-- nobody was told a message had arrived, and the admin's only "Reply" was a
-- mailto: link that opened their personal mail client and recorded nothing. The
-- reply thread below, plus the contact-notify / contact-reply functions, close
-- the loop inside the product.

ALTER TABLE public.contact_tickets
  -- Set by contact-notify when it matches the sender to an existing account, so
  -- the admin can jump from a message to that customer's card.
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_reply_at timestamptz,
  ADD COLUMN IF NOT EXISTS reply_count integer NOT NULL DEFAULT 0,
  -- Stamped once, which is also what makes the ack idempotent: contact-notify
  -- is callable without a JWT (the contact form is public), so it must never be
  -- usable to send the same address a second email.
  ADD COLUMN IF NOT EXISTS ack_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_notified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_contact_tickets_status_created
  ON public.contact_tickets (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_tickets_email
  ON public.contact_tickets (lower(email));

-- One row per admin reply that was emailed to the customer.
CREATE TABLE IF NOT EXISTS public.contact_ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.contact_tickets(id) ON DELETE CASCADE,
  body text NOT NULL,
  sent_by uuid,
  -- 'sent' or 'failed': a reply is recorded either way, so a Resend outage
  -- shows up in the thread instead of vanishing and looking like it was sent.
  email_status text NOT NULL DEFAULT 'sent',
  email_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_ticket_replies_ticket
  ON public.contact_ticket_replies (ticket_id, created_at);

ALTER TABLE public.contact_ticket_replies ENABLE ROW LEVEL SECURITY;

-- Admins read the thread. Writes come only from contact-reply (service role),
-- which is what guarantees a recorded reply corresponds to an actual send
-- attempt rather than a row an admin typed straight into the table.
DROP POLICY IF EXISTS "Admins can read ticket replies" ON public.contact_ticket_replies;
CREATE POLICY "Admins can read ticket replies"
  ON public.contact_ticket_replies FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Keep updated_at honest for the admin inbox's "last activity" sort.
CREATE OR REPLACE FUNCTION public.touch_contact_ticket()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_contact_ticket ON public.contact_tickets;
CREATE TRIGGER touch_contact_ticket
  BEFORE UPDATE ON public.contact_tickets
  FOR EACH ROW EXECUTE FUNCTION public.touch_contact_ticket();
