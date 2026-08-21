import { supabase } from "@/integrations/supabase/client";

/**
 * Notify both sides that a contact ticket landed: an acknowledgement to the
 * customer and an alert to help@torahtale.com.
 *
 * Deliberately fire-and-forget. The ticket row is already written under RLS by
 * the caller, so a notification failure must not surface as "your message
 * didn't send" - the message did send, we just didn't manage to email about it.
 * The edge function is idempotent, so a retry is harmless.
 */
export function notifyContactTicket(ticketId: string): void {
  if (!ticketId) return;
  supabase.functions
    .invoke("contact-notify", { body: { ticketId } })
    .catch((e) => console.warn("contact-notify failed (ticket is still saved):", e));
}
