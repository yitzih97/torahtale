// Customer-initiated account deletion.
//
// The dashboard button used to do nothing at all — it had no onClick. This is
// the real thing, so it is deliberately hard to trigger by accident and every
// guard is re-checked HERE rather than trusted from the browser:
//
//   • the caller is identified from their own JWT; a user can only ever delete
//     themselves, there is no id parameter to tamper with
//   • an active or paused subscription BLOCKS the deletion — a live Shopify
//     contract would keep billing a customer whose account no longer exists
//   • the typed confirmation and the reason must both be present
//
// What actually happens: the reason is recorded as a support ticket first (so
// the deletion is never silent and the team can follow up), the user's own rows
// are removed, and the auth user is deleted last with the service-role key.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

/** The exact word the customer must type. Kept in sync with the dashboard copy. */
const CONFIRM_WORD = "DELETE";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Not authenticated" }, 401);

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: claimsErr } = await anon.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    const userId = claims?.claims?.sub ? String(claims.claims.sub) : null;
    const email = claims?.claims?.email ? String(claims.claims.email) : "";
    if (claimsErr || !userId) return json({ error: "Not authenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const confirm = String(body?.confirm ?? "").trim().toUpperCase();
    const reason = String(body?.reason ?? "").trim();
    const reasonDetail = String(body?.reasonDetail ?? "").trim();

    if (confirm !== CONFIRM_WORD) return json({ error: "Confirmation text did not match" }, 400);
    if (!reason) return json({ error: "A reason is required" }, 400);

    // Service role from here: reading every subscription and deleting the user.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // GUARD: never delete an account that still has a live billing contract.
    const { data: subs, error: subsErr } = await admin
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", userId);
    if (subsErr) throw subsErr;
    const live = (subs || []).filter(
      (s: { status: string | null }) => s.status === "active" || s.status === "paused",
    );
    if (live.length > 0) {
      return json({ error: "active_subscription", activeCount: live.length }, 409);
    }

    // Record why, before anything is destroyed.
    await admin.from("contact_tickets").insert({
      name: email || "Deleted account",
      email,
      subject: "general",
      message:
        `ACCOUNT DELETION — user ${userId} (${email || "no email"}) deleted their account.\n` +
        `Reason: ${reason}\n` +
        (reasonDetail ? `Details: ${reasonDetail}\n` : "") +
        `Their books remain in the database with a null user_id.`,
      status: "resolved",
    });

    // Owned rows first, then the auth user. children/books/subscriptions carry
    // ON DELETE SET NULL against children, so ordering here only affects rows
    // keyed on user_id.
    await admin.from("children").delete().eq("user_id", userId);
    await admin.from("subscriptions").delete().eq("user_id", userId);
    await admin.from("profiles").delete().eq("id", userId);

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    return json({ deleted: true });
  } catch (e) {
    console.error("delete-account error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
