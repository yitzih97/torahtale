// Sends an admin's reply to a contact ticket as a branded email from
// help@torahtale.com, and records it on the ticket thread.
//
// The reply is recorded whether or not Resend accepted it - a failed send that
// left no trace would read in the admin inbox as "replied", which is the one
// outcome worse than not replying at all.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderContactReplyEmail, SUPPORT_SUBJECT_LABELS, sendResendEmail } from "../_shared/emails.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function getCallerId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await client.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (error || !data?.claims?.sub) return null;
  return String(data.claims.sub);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const callerId = await getCallerId(req);
    if (!callerId) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", callerId)
      .in("role", ["admin", "staff"]).limit(1).maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const { ticketId, body, resolve } = await req.json();
    if (!ticketId || typeof ticketId !== "string") return json({ error: "ticketId required" }, 400);
    const replyBody = String(body || "").trim();
    if (!replyBody) return json({ error: "Reply body is empty" }, 400);
    if (replyBody.length > 10000) return json({ error: "Reply is too long (10,000 characters max)" }, 400);

    const { data: ticket, error } = await admin
      .from("contact_tickets")
      .select("id, name, email, subject, message, status, reply_count")
      .eq("id", ticketId)
      .maybeSingle();
    if (error) throw error;
    if (!ticket) return json({ error: "Ticket not found" }, 404);
    if (!ticket.email) return json({ error: "This ticket has no email address to reply to" }, 400);

    const label = SUPPORT_SUBJECT_LABELS[String(ticket.subject || "general")] || "General";
    const sent = await sendResendEmail({
      to: String(ticket.email),
      subject: `Re: your ${label.toLowerCase()} message - Torah Tale`,
      html: renderContactReplyEmail({
        name: ticket.name,
        subject: ticket.subject,
        originalMessage: String(ticket.message || ""),
        reply: replyBody,
      }),
    });

    const now = new Date().toISOString();
    await admin.from("contact_ticket_replies").insert({
      ticket_id: ticketId,
      body: replyBody,
      sent_by: callerId,
      email_status: sent ? "sent" : "failed",
      email_error: sent ? null : "Resend rejected or was not configured - see function logs",
    });

    // Only a delivered reply advances the ticket. A failed send leaves it where
    // it was, so it stays in the admin's queue instead of looking handled.
    if (sent) {
      await admin.from("contact_tickets").update({
        status: resolve ? "resolved" : "replied",
        last_reply_at: now,
        reply_count: (Number(ticket.reply_count) || 0) + 1,
      }).eq("id", ticketId);
    }

    return json(
      sent ? { ok: true, sent: true } : { ok: false, sent: false, error: "The email could not be sent - the reply was saved but the customer has not received it." },
      sent ? 200 : 502,
    );
  } catch (e) {
    console.error("contact-reply failed:", e);
    return json({ error: (e as Error)?.message || "unexpected error" }, 500);
  }
});
