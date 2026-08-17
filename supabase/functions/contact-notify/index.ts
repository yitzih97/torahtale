// Fires right after a contact-form ticket is inserted: acknowledges to the
// customer and alerts help@torahtale.com. The insert itself still happens from
// the browser under RLS, so a failure here loses a notification, never a
// message.
//
// verify_jwt is OFF because the contact form is public. The only input is a
// ticket id, everything else is read server-side, and both sends are stamped
// (ack_sent_at / admin_notified_at) so replaying the call is a no-op — there is
// no way to use this to mail an arbitrary address, or the same address twice.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  renderContactAckEmail,
  renderContactAdminAlertEmail,
  SUPPORT_SUBJECT_LABELS,
  sendResendEmail,
} from "../_shared/emails.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORT_INBOX = "help@torahtale.com";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ticketId } = await req.json();
    if (!ticketId || typeof ticketId !== "string") return json({ error: "ticketId required" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: ticket, error } = await admin
      .from("contact_tickets")
      .select("id, name, email, subject, message, ack_sent_at, admin_notified_at, user_id")
      .eq("id", ticketId)
      .maybeSingle();
    if (error) throw error;
    if (!ticket) return json({ error: "Ticket not found" }, 404);

    const patch: Record<string, unknown> = {};

    // Link the ticket to an account when the sender already has one, so the
    // admin can open the customer's card straight from the message.
    if (!ticket.user_id && ticket.email) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .ilike("email", String(ticket.email).trim())
        .maybeSingle();
      if (profile?.id) patch.user_id = profile.id;
    }

    let acked = false;
    if (!ticket.ack_sent_at) {
      acked = await sendResendEmail({
        to: String(ticket.email),
        subject: "We got your message — Torah Tale",
        html: renderContactAckEmail({
          name: ticket.name,
          subject: ticket.subject,
          message: String(ticket.message || ""),
        }),
      });
      if (acked) patch.ack_sent_at = new Date().toISOString();
    }

    let alerted = false;
    if (!ticket.admin_notified_at) {
      const label = SUPPORT_SUBJECT_LABELS[String(ticket.subject || "general")] || "General";
      alerted = await sendResendEmail({
        to: SUPPORT_INBOX,
        subject: `New ${label} message from ${ticket.name}`,
        // Replying in the inbox goes straight to the customer.
        replyTo: String(ticket.email),
        html: renderContactAdminAlertEmail({
          name: String(ticket.name),
          email: String(ticket.email),
          subject: ticket.subject,
          message: String(ticket.message || ""),
          ticketId: String(ticket.id),
        }),
      });
      if (alerted) patch.admin_notified_at = new Date().toISOString();
    }

    if (Object.keys(patch).length) {
      await admin.from("contact_tickets").update(patch).eq("id", ticketId);
    }

    return json({ ok: true, acked, alerted });
  } catch (e) {
    console.error("contact-notify failed:", e);
    return json({ error: (e as Error)?.message || "unexpected error" }, 500);
  }
});
