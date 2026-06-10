import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRINTIFY_BASE = "https://api.printify.com/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Not authorized — admin only");

    const body = await req.json();
    const { action } = body;

    // Load Printify settings
    const PRINTIFY_API_KEY = Deno.env.get("PRINTIFY_API_KEY");
    
    // Load integration settings
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || serviceKey;
    const settingsRes = await fetch(`${supabaseUrl}/rest/v1/site_settings?category=eq.integrations`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    const settings = settingsRes.ok ? await settingsRes.json() : [];
    const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value || "";

    const shopId = getSetting("printify-shop-id");

    if (action === "test-connection") {
      if (!PRINTIFY_API_KEY) {
        return new Response(JSON.stringify({ success: false, error: "PRINTIFY_API_KEY secret not configured" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Test by listing shops
      const res = await fetch(`${PRINTIFY_BASE}/shops.json`, {
        headers: { Authorization: `Bearer ${PRINTIFY_API_KEY}` },
      });
      if (!res.ok) {
        const errText = await res.text();
        return new Response(JSON.stringify({ success: false, error: `Printify API error [${res.status}]: ${errText}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const shops = await res.json();
      const shop = shopId ? shops.find((s: any) => String(s.id) === shopId) : shops[0];
      return new Response(JSON.stringify({ success: true, shopName: shop?.title, shopId: shop?.id, shops }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "submit-order") {
      if (!PRINTIFY_API_KEY) throw new Error("PRINTIFY_API_KEY not configured");
      if (!shopId) throw new Error("Printify Shop ID not configured");

      const { bookId } = body;
      if (!bookId) throw new Error("bookId is required");

      // Get book data
      const { data: book, error: bookErr } = await supabase
        .from("books")
        .select("*")
        .eq("id", bookId)
        .single();
      if (bookErr || !book) throw new Error("Book not found");

      // Safety: never send an unpaid book to print. Payment is confirmed by the
      // Shopify orders/paid webhook, which stamps shopify_order_id + paid_at.
      if (!book.shopify_order_id && !book.paid_at) {
        throw new Error("Book is not paid — refusing to submit to Printify.");
      }

      const pages = (book.pages_data as any[]) || [];
      if (!pages.length) throw new Error("Book has no pages");

      const shipping = (book.shipping_data as any) || {};
      const opts = shipping.bookOptions || {};
      const quantity = Math.max(1, parseInt(shipping.quantity) || 1);

      // Resolve per-format Printify config. Each book format maps to its own
      // blueprint / print provider / variant / price, configured in site_settings
      // (category "integrations"). Falls back to the legacy generic keys, then to
      // the historical hardcoded values.
      const formatKey =
        opts.productType === "hardcover"
          ? (opts.hardcoverSize === "11x8.5" ? "hardcover-11x85" : "hardcover-8x8")
          : opts.productType === "board"
          ? "board"
          : "softcover";
      const fmt = (field: string, fallback: string) =>
        getSetting(`printify-${field}-${formatKey}`) || getSetting(`printify-${field}`) || fallback;

      const blueprintId = parseInt(fmt("blueprint-id", "635"));
      const printProviderId = parseInt(fmt("print-provider-id", "99"));
      const variantId = parseInt(fmt("variant-id", "1"));
      const price = parseInt(fmt("price", "3499"));

      // Upload page images to Printify
      const imageIds: string[] = [];
      for (const page of pages) {
        const url = page.imageUrl || page.image;
        if (!url) continue;
        const uploadRes = await fetch(`${PRINTIFY_BASE}/uploads/images.json`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PRINTIFY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file_name: `page-${page.page || imageIds.length + 1}.png`,
            url,
          }),
        });
        if (uploadRes.ok) {
          const img = await uploadRes.json();
          imageIds.push(img.id);
        }
      }

      // Reuse an existing Printify product if this book was submitted before;
      // otherwise create one. (Approval can be retried without spawning duplicates.)
      let productId: string | null = book.printify_product_id || null;
      if (!productId) {
        const productRes = await fetch(`${PRINTIFY_BASE}/shops/${shopId}/products.json`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PRINTIFY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: `${book.child_name}'s Torah Tale - ${book.torah_portion}`,
            description: `Personalized Torah story for ${book.child_name}`,
            blueprint_id: blueprintId,
            print_provider_id: printProviderId,
            variants: [{ id: variantId, price, is_enabled: true }],
            print_areas: imageIds.length > 0 ? [{
              variant_ids: [variantId],
              placeholders: [{ position: "front", images: imageIds.map((id) => ({ id, x: 0, y: 0, scale: 1, angle: 0 })) }],
            }] : [],
          }),
        });
        if (!productRes.ok) {
          const errText = await productRes.text();
          throw new Error(`Printify create product error [${productRes.status}]: ${errText}`);
        }
        const product = await productRes.json();
        productId = String(product.id);
      }

      // Place the actual print order, shipping to the address captured from Shopify.
      const orderRes = await fetch(`${PRINTIFY_BASE}/shops/${shopId}/orders.json`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PRINTIFY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          external_id: book.shopify_order_id || book.id,
          label: book.shopify_order_name || `Torah Tale ${book.id}`,
          line_items: [{ product_id: productId, variant_id: variantId, quantity }],
          shipping_method: 1,
          send_shipping_notification: false,
          address_to: {
            first_name: shipping.firstName || book.child_name || "Customer",
            last_name: shipping.lastName || "",
            email: shipping.email || "",
            phone: shipping.phone || "",
            country: shipping.countryCode || shipping.country || "US",
            region: shipping.provinceCode || shipping.province || shipping.state || "",
            address1: shipping.address1 || "",
            address2: shipping.address2 || "",
            city: shipping.city || "",
            zip: shipping.zip || "",
          },
        }),
      });
      if (!orderRes.ok) {
        const errText = await orderRes.text();
        // Persist the product id even if order placement failed, so a retry won't
        // recreate the product.
        await supabase.from("books").update({
          printify_product_id: productId,
          updated_at: new Date().toISOString(),
        } as any).eq("id", bookId);
        throw new Error(`Printify create order error [${orderRes.status}]: ${errText}`);
      }
      const order = await orderRes.json();
      const printifyOrderId = String(order.id);

      // order_number is what printify-webhook matches on (resource.id) to track
      // production/shipping status, so set it to the Printify order id.
      await supabase.from("books").update({
        status: "printing",
        printify_product_id: productId,
        printify_order_id: printifyOrderId,
        order_number: printifyOrderId,
        updated_at: new Date().toISOString(),
      } as any).eq("id", bookId);

      return new Response(JSON.stringify({ success: true, productId, orderId: printifyOrderId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    console.error("printify-submit error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
