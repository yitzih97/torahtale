import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { booksPerPeriod, nextMondayISO, todayET } from "../_shared/subscription.ts";

// Record a billing event exactly once. Returns true if this order is new (proceed
// to credit), false if already processed (Shopify retry — skip). Throws on an
// unexpected DB error so the handler 500s and Shopify retries later.
async function recordCharge(
  supabase: any, orderId: string, subscriptionId: string | null,
): Promise<boolean> {
  const { error } = await supabase.from("subscription_charges")
    .insert({ shopify_order_id: orderId, subscription_id: subscriptionId });
  if (!error) return true;
  if ((error as { code?: string }).code === "23505") return false;
  throw error;
}

// Find the subscription row linked to a Shopify subscription contract id. The
// create webhook stores whatever id Shopify sends (numeric REST id or gid), so
// match the exact value first and fall back to the numeric tail.
async function findSubscriptionByContract(supabase: any, contractId: string) {
  if (!contractId) return null;
  let { data } = await supabase.from("subscriptions")
    .select("id, status").eq("shopify_contract_id", contractId).limit(1);
  if (!data || data.length === 0) {
    const numeric = contractId.replace(/\D/g, "");
    if (numeric && numeric !== contractId) {
      ({ data } = await supabase.from("subscriptions")
        .select("id, status").eq("shopify_contract_id", numeric).limit(1));
    }
  }
  return data?.[0] || null;
}

// Kick off automatic server-side book generation. generate-book returns 202
// immediately and generates in its own background task, so this resolves fast.
// Best-effort: a failure here never fails the webhook (the admin can still
// generate manually via the Play button).
async function triggerGeneration(bookId: string) {
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const res = await fetch(`${url}/functions/v1/generate-book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "x-cron-secret": Deno.env.get("CRON_SECRET") || "",
      },
      body: JSON.stringify({ bookId }),
    });
    console.log("triggerGeneration:", bookId, "->", res.status);
  } catch (e) {
    console.error("triggerGeneration failed for", bookId, e);
  }
}

// Shopify order/subscription webhook.
//
// Flow this supports (see project plan):
//   orders/paid  +  book_id attribute   -> mark that book "paid" (one-time OR first subscription order)
//   orders/paid  without book_id        -> recurring subscription cycle: mint a fresh book for that customer
//   subscription_contracts/create       -> store the contract id on the subscription row
//   subscription_billing_attempts/failure -> pause the subscription (failed recurring charge)
//   subscription_contracts/update       -> mirror Shopify status onto the row (cancel/pause/resume)
//   orders/cancelled                     -> mark the linked book order canceled
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

    // ── subscription_billing_attempts/failure ────────────────────────
    // A failed recurring charge (declined/expired card, insufficient funds)
    // pauses the subscription so the Monday release job stops shipping until
    // the customer fixes billing in the Shopify portal.
    if (topic === "subscription_billing_attempts/failure") {
      const contractId = String(payload?.subscription_contract_id ?? payload?.admin_graphql_api_id ?? "");
      const sub = await findSubscriptionByContract(supabase, contractId);
      if (sub && sub.status !== "canceled") {
        await supabase.from("subscriptions")
          .update({ status: "paused", updated_at: new Date().toISOString() } as any)
          .eq("id", sub.id);
        console.log("Paused subscription after failed charge:", sub.id, payload?.error_code || "");
      } else if (!sub) {
        console.warn("billing failure: no subscription matched contract", contractId);
      }
      return new Response(JSON.stringify({ received: true, action: "billing_failure" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── subscription_contracts/update ─────────────────────────────────
    // Mirror cancel/pause/resume done in Shopify (or by Shopify's dunning)
    // onto our row so the dashboard and release job stay in sync.
    if (topic === "subscription_contracts/update") {
      const contractId = String(payload?.id ?? payload?.admin_graphql_api_id ?? "");
      const shopStatus = String(payload?.status ?? "").toUpperCase();
      const statusMap: Record<string, string> = {
        ACTIVE: "active", PAUSED: "paused",
        CANCELLED: "canceled", CANCELED: "canceled", EXPIRED: "canceled", FAILED: "paused",
      };
      const next = statusMap[shopStatus];
      const sub = await findSubscriptionByContract(supabase, contractId);
      if (sub && next && sub.status !== next) {
        const patch: Record<string, unknown> = { status: next, updated_at: new Date().toISOString() };
        if (next === "canceled") patch.canceled_at = new Date().toISOString();
        await supabase.from("subscriptions").update(patch as any).eq("id", sub.id);
        console.log("Synced subscription status from Shopify:", sub.id, shopStatus, "->", next);
      }
      return new Response(JSON.stringify({ received: true, action: "contract_update" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── orders/cancelled ──────────────────────────────────────────────
    // A canceled Shopify order marks the linked book canceled so it drops out
    // of the fulfillment/printing queue.
    if (topic === "orders/cancelled") {
      const orderId = String(payload?.id ?? "");
      if (orderId) {
        await supabase.from("books")
          .update({ status: "canceled", updated_at: new Date().toISOString() } as any)
          .eq("shopify_order_id", orderId);
        console.log("Marked book canceled for Shopify order", orderId);
      }
      return new Response(JSON.stringify({ received: true, action: "order_cancelled" }), {
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

        // Payment confirmed → auto-start generation (no admin "Play" needed).
        // Lands the book at pending_review for admin approval.
        await triggerGeneration(bookId);

        // If this order also started a subscription, initialise its drip schedule.
        // The custom book above is week 1 (already in admin), so the first charge
        // credits booksPerPeriod-1 more, dripping on the coming Mondays. Guard with
        // the charge ledger so a Shopify webhook retry can't double-credit.
        if (customerId && book.user_id) {
          const fresh = await recordCharge(supabase, orderId, null);
          await supabase.from("subscriptions")
            .update({ shopify_customer_id: customerId, updated_at: new Date().toISOString() } as any)
            .eq("user_id", book.user_id)
            .is("shopify_customer_id", null);
          if (fresh) {
            const { data: userSubs } = await supabase.from("subscriptions")
              .select("id, frequency").eq("user_id", book.user_id).eq("status", "active")
              .is("next_release_date", null);
            const firstMonday = nextMondayISO(todayET());
            for (const s of userSubs || []) {
              await supabase.from("subscriptions").update({
                books_remaining: Math.max(0, booksPerPeriod((s as any).frequency) - 1),
                next_release_date: firstMonday,
                updated_at: new Date().toISOString(),
              } as any).eq("id", (s as any).id);
            }
          }
        }

        return new Response(JSON.stringify({ received: true, action: "paid", bookId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // No book_id: a recurring subscription charge. We DON'T mint a book here — that
      // would dump a monthly subscriber's 4 books at once. Instead credit the
      // subscription; the Monday 9am-ET release job drips one book per week while
      // credit remains. "Only after billed" = credit only grows on this paid event.
      if (!customerId) {
        return new Response(JSON.stringify({ received: true, action: "ignored_no_book_or_customer" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id, frequency, books_remaining, next_release_date, status")
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
      const credit = booksPerPeriod((sub as any).frequency);
      const fresh = await recordCharge(supabase, orderId, (sub as any).id);
      if (!fresh) {
        return new Response(JSON.stringify({ received: true, action: "duplicate_charge" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await supabase.from("subscriptions").update({
        books_remaining: ((sub as any).books_remaining || 0) + credit,
        next_release_date: (sub as any).next_release_date || nextMondayISO(todayET()),
        updated_at: new Date().toISOString(),
      } as any).eq("id", (sub as any).id);

      return new Response(JSON.stringify({ received: true, action: "subscription_credited", credited: credit }), {
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
