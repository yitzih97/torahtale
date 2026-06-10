import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Shopify order/subscription webhook.
//
// Flow this supports (see project plan):
//   orders/paid  +  book_id attribute   -> mark that book "paid" (one-time OR first subscription order)
//   orders/paid  without book_id        -> recurring subscription cycle: mint a fresh book for that customer
//   subscription_contracts/create       -> store the contract id on the subscription row
//
// External setup required for this to receive traffic:
//   - Register these webhook topics in the Shopify admin / app, pointing at this function URL.
//   - Set the SHOPIFY_WEBHOOK_SECRET function secret to the webhook signing secret.
//   - This function must run with verify_jwt = false (see supabase/config.toml) so Shopify's
//     unauthenticated POST is not rejected before reaching the HMAC check below.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain, content-type",
};

async function verifyShopifyHmac(secret: string, rawBody: string, headerHmac: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
    const computed = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
    // Constant-ish time compare.
    if (computed.length !== headerHmac.length) return false;
    let mismatch = 0;
    for (let i = 0; i < computed.length; i++) mismatch |= computed.charCodeAt(i) ^ headerHmac.charCodeAt(i);
    return mismatch === 0;
  } catch (_e) {
    return false;
  }
}

function getAttribute(order: any, name: string): string | null {
  const attrs = Array.isArray(order?.note_attributes) ? order.note_attributes : [];
  const hit = attrs.find((a: any) => String(a?.name).toLowerCase() === name.toLowerCase());
  if (hit?.value) return String(hit.value);
  // Fall back to line-item properties (some checkout configs put attributes there).
  for (const li of order?.line_items || []) {
    const prop = (li?.properties || []).find((p: any) => String(p?.name).toLowerCase() === name.toLowerCase());
    if (prop?.value) return String(prop.value);
  }
  return null;
}

function shippingFromOrder(order: any) {
  const s = order?.shipping_address || order?.customer?.default_address || {};
  return {
    firstName: s.first_name ?? "",
    lastName: s.last_name ?? "",
    address1: s.address1 ?? "",
    address2: s.address2 ?? "",
    city: s.city ?? "",
    state: s.province ?? "",
    province: s.province ?? "",
    provinceCode: s.province_code ?? "",
    country: s.country ?? "",
    countryCode: s.country_code ?? "",
    zip: s.zip ?? "",
    phone: s.phone ?? order?.phone ?? "",
    email: order?.email ?? order?.customer?.email ?? "",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SHOPIFY_WEBHOOK_SECRET = Deno.env.get("SHOPIFY_WEBHOOK_SECRET");
    if (!SHOPIFY_WEBHOOK_SECRET) {
      console.error("SHOPIFY_WEBHOOK_SECRET is not configured — rejecting webhook");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headerHmac = req.headers.get("x-shopify-hmac-sha256") || "";
    const topic = (req.headers.get("x-shopify-topic") || "").toLowerCase();
    const rawBody = await req.text();

    if (!headerHmac || !(await verifyShopifyHmac(SHOPIFY_WEBHOOK_SECRET, rawBody, headerHmac))) {
      console.warn("shopify-webhook: invalid or missing HMAC signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const payload = JSON.parse(rawBody);
    console.log("Shopify webhook topic:", topic);

    // ── subscription_contracts/create ────────────────────────────────
    if (topic === "subscription_contracts/create") {
      const contractId = String(payload?.id ?? payload?.admin_graphql_api_id ?? "");
      const customerId = String(payload?.customer_id ?? payload?.customer?.id ?? "");
      if (contractId && customerId) {
        // Link to the most recent active subscription for this customer.
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("shopify_customer_id", customerId)
          .order("created_at", { ascending: false })
          .limit(1);
        if (subs && subs.length > 0) {
          await supabase.from("subscriptions")
            .update({ shopify_contract_id: contractId, updated_at: new Date().toISOString() } as any)
            .eq("id", subs[0].id);
        } else {
          console.warn("subscription_contracts/create: no subscription row to link for customer", customerId);
        }
      }
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── orders/paid ──────────────────────────────────────────────────
    // Only the paid topic confirms payment — orders/create can fire before capture.
    if (topic === "orders/paid") {
      const order = payload;
      const orderId = String(order?.id ?? "");
      const orderName = String(order?.name ?? "");
      const customerId = String(order?.customer?.id ?? "");
      const shipping = shippingFromOrder(order);
      const bookId = getAttribute(order, "book_id");

      // Idempotency: if we've already recorded this Shopify order, do nothing.
      const { data: existing } = await supabase
        .from("books")
        .select("id")
        .eq("shopify_order_id", orderId)
        .limit(1);
      if (existing && existing.length > 0) {
        return new Response(JSON.stringify({ received: true, action: "duplicate" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (bookId) {
        // One-time purchase OR the first order of a subscription: the cart carried our book_id.
        const { data: book } = await supabase
          .from("books")
          .select("id, user_id, shipping_data")
          .eq("id", bookId)
          .maybeSingle();
        if (!book) {
          console.warn("orders/paid: book_id attribute did not match any book:", bookId);
          return new Response(JSON.stringify({ received: true, action: "book_not_found" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        await supabase.from("books").update({
          status: "paid",
          shopify_order_id: orderId,
          shopify_order_name: orderName,
          paid_at: new Date().toISOString(),
          shipping_data: { ...(book.shipping_data as any || {}), ...shipping },
          updated_at: new Date().toISOString(),
        } as any).eq("id", bookId);

        // If this order also started a subscription, stamp the customer id on the
        // buyer's unlinked subscription rows so the contract-create webhook and
        // future recurring orders can be correlated back to them.
        if (customerId && book.user_id) {
          await supabase.from("subscriptions")
            .update({ shopify_customer_id: customerId, updated_at: new Date().toISOString() } as any)
            .eq("user_id", book.user_id)
            .is("shopify_customer_id", null);
        }

        return new Response(JSON.stringify({ received: true, action: "paid", bookId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // No book_id: treat as a recurring subscription cycle. Mint a fresh book from the
      // subscription config so the admin can generate + approve it like any other.
      if (!customerId) {
        return new Response(JSON.stringify({ received: true, action: "ignored_no_book_or_customer" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("shopify_customer_id", customerId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);
      const sub = subs?.[0];
      if (!sub) {
        console.warn("orders/paid: recurring order with no matching subscription for customer", customerId);
        return new Response(JSON.stringify({ received: true, action: "no_subscription" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: newBook } = await supabase.from("books").insert({
        user_id: sub.user_id,
        child_id: sub.child_id,
        child_name: sub.child_name,
        art_style: sub.art_style,
        language: sub.language,
        status: "paid",
        shopify_order_id: orderId,
        shopify_order_name: orderName,
        paid_at: new Date().toISOString(),
        shipping_data: { ...(sub.shipping_data as any || {}), ...shipping },
        story_data: { source: "subscription", subscriptionId: sub.id, frequency: sub.frequency },
      } as any).select().single();

      return new Response(JSON.stringify({ received: true, action: "subscription_book_minted", bookId: newBook?.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ received: true, action: "ignored_topic" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("shopify-webhook error:", e);
    return new Response(JSON.stringify({ error: "Webhook processing error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
