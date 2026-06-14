import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const newStatus = statusMap[type];
    if (!newStatus || !resource?.id) {
      return new Response(JSON.stringify({ received: true, action: "ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: books } = await supabase
      .from("books")
      .select("id")
      .eq("order_number", resource.id)
      .limit(1);

    if (books && books.length > 0) {
      await supabase.from("books").update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      }).eq("id", books[0].id);
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
