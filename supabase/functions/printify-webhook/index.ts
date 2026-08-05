import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderDeliveredEmail, sendResendEmail } from "../_shared/emails.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifySignature(secret: string, rawBody: string, signature: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
    const computed = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    // Accept either bare hex, "sha256=<hex>", or base64 encodings, compared in
    // constant time to avoid leaking the signature via timing.
    const provided = signature.replace(/^sha256=/i, "").trim().toLowerCase();
    const computedB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuf))).toLowerCase();
    const safeEqual = (a: string, b: string): boolean => {
      if (a.length !== b.length) return false;
      let mismatch = 0;
      for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
      return mismatch === 0;
    };
    return safeEqual(provided, computed) || safeEqual(provided, computedB64);
  } catch (_e) {
    return false;
  }
}

// The delivery notice goes to the address captured at checkout; if that is
// missing (e.g. an admin-pushed book), fall back to the account's login email.
async function resolveCustomerEmail(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  book: { shipping_data?: unknown; user_id?: string | null },
): Promise<string | null> {
  const shipping = (book.shipping_data as Record<string, unknown>) || {};
  const shippingEmail = typeof shipping.email === "string" ? shipping.email.trim() : "";
  if (shippingEmail) return shippingEmail;
  if (book.user_id) {
    const { data, error } = await supabase.auth.admin.getUserById(book.user_id);
    if (!error && data?.user?.email) return data.user.email;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const PRINTIFY_WEBHOOK_SECRET = Deno.env.get("PRINTIFY_WEBHOOK_SECRET");
    if (!PRINTIFY_WEBHOOK_SECRET) {
      console.error("PRINTIFY_WEBHOOK_SECRET is not configured — rejecting webhook");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signature =
      req.headers.get("x-pfy-signature") ||
      req.headers.get("x-printify-signature") ||
      req.headers.get("x-signature") ||
      "";
    const rawBody = await req.text();

    if (!signature || !(await verifySignature(PRINTIFY_WEBHOOK_SECRET, rawBody, signature))) {
      console.warn("printify-webhook: invalid or missing signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const event = JSON.parse(rawBody);
    console.log("Printify webhook event:", event?.type);

    const { type, resource } = event;

    const statusMap: Record<string, string> = {
      "order:created": "printing",
      "order:updated": "printing",
      "order:sent-to-production": "printing",
      "order:shipment:created": "shipped",
      "order:shipment:delivered": "delivered",
    };

    // A cancellation arrives as an order:updated with a canceled status in the
    // payload (Printify has no dedicated cancel event). Without this, a cancel was
    // mapped straight to "printing" — leaving the book looking in-production and
    // its printify_order_id set, which then blocked re-approval. Detect it
    // defensively from wherever the status lives and self-heal instead.
    const resourceStatus = String(
      resource?.data?.status ?? resource?.status ?? event?.data?.status ?? "",
    ).toLowerCase();
    const isCancellation = resourceStatus.includes("cancel");

    const newStatus = isCancellation ? "pending_review" : statusMap[type];
    if (!newStatus || !resource?.id) {
      return new Response(JSON.stringify({ received: true, action: "ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: books } = await supabase
      .from("books")
      .select("id, status, child_name, torah_portion, shipping_data, user_id, delivered_email_sent_at")
      .eq("order_number", resource.id)
      .limit(1);

    if (books && books.length > 0) {
      const book = books[0];
      const update: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (isCancellation) {
        // Free the Printify references so the admin can regenerate + re-approve
        // and get a fresh product/order (with the new images) rather than a
        // "already in Printify" dead end.
        update.printify_order_id = null;
        update.printify_product_id = null;
      }

      // On the first delivery event, email the customer "Your Book Has Arrived!".
      // delivered_email_sent_at makes this idempotent — Printify can re-fire the
      // delivered event, and a duplicate "your book arrived" email reads as spam.
      if (newStatus === "delivered" && !book.delivered_email_sent_at) {
        const to = await resolveCustomerEmail(supabase, book);
        if (to) {
          const shipping = (book.shipping_data as Record<string, unknown>) || {};
          const html = renderDeliveredEmail({
            childName: book.child_name,
            parsha: book.torah_portion,
            firstName: (shipping.firstName as string) || (shipping.first_name as string) || null,
          });
          const sent = await sendResendEmail({
            to,
            subject: "Your Book Has Arrived! - Torah Tale",
            html,
          });
          if (sent) update.delivered_email_sent_at = new Date().toISOString();
        } else {
          console.warn(`printify-webhook: no email on file for delivered book ${book.id}`);
        }
      }

      await supabase.from("books").update(update).eq("id", book.id);
    }

    return new Response(JSON.stringify({ received: true, status: newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("printify-webhook error:", e);
    return new Response(JSON.stringify({ error: "Webhook processing error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
