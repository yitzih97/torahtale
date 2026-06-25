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
    
    // Load integration settings. Service-role key: the 'integrations' category is
    // admin-only under RLS, so an anon-key read returns [] and the Printify shop id
    // would never load (submit-order would always fail "Shop ID not configured").
    const settingsRes = await fetch(`${supabaseUrl}/rest/v1/site_settings?category=eq.integrations`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
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

      // Idempotency: if this book already has a Printify order, don't place a
      // second one (e.g. an admin double-clicking Approve). Return the existing.
      if (book.printify_order_id) {
        return new Response(JSON.stringify({
          success: true,
          productId: book.printify_product_id,
          orderId: book.printify_order_id,
          duplicate: true,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
          ? "hardcover-8x8" // hardcover is 8×8 only (11×8.5 retired)
          : opts.productType === "board"
          ? "board"
          : opts.productType === "coloring"
          ? "coloring" // standalone coloring book (blueprint 2721)
          : "softcover";
      const fmt = (field: string) =>
        getSetting(`printify-${field}-${formatKey}`) || getSetting(`printify-${field}`) || "";

      // Require explicit per-format config. The previous hardcoded fallbacks
      // (blueprint 635) pointed at an unrelated catalog item (a coffee mug), so
      // a missing setting would silently print the wrong product. Fail instead.
      const blueprintId = parseInt(fmt("blueprint-id"));
      const printProviderId = parseInt(fmt("print-provider-id"));
      // variant-id is optional: if not configured, we auto-discover the first
      // catalog variant from the same lookup used for print-area placeholders.
      let variantId = parseInt(fmt("variant-id"));
      const price = parseInt(fmt("price"));
      if (!blueprintId || !printProviderId || !price) {
        throw new Error(
          `Printify config missing for format "${formatKey}" — set printify-blueprint-id/print-provider-id/price in site_settings before submitting.`,
        );
      }

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

      // Abort if any page image failed to upload — placing an order with a
      // partial/blank print area would print (and charge for) a broken book.
      const pagesWithImages = pages.filter((p: any) => p.imageUrl || p.image);
      if (imageIds.length < pagesWithImages.length) {
        throw new Error(
          `Only ${imageIds.length}/${pagesWithImages.length} page images uploaded to Printify — aborting to avoid printing an incomplete book.`,
        );
      }

      // Map each uploaded image to its real print-area placeholder. These books
      // print one image PER print area — a "Cover" plus "Page 1…N" (8×8) or
      // "Spread 1…N" (board). `imageIds` are in page order (cover first, then the
      // story pages), matching the blueprint's placeholder order. We discover the
      // placeholder positions at runtime from the catalog so we never hardcode
      // catalog slugs, and fall back to a single "front" placeholder if the lookup
      // fails — so submission never breaks.
      let printAreas: any[] = imageIds.length > 0
        ? [{ variant_ids: [variantId], placeholders: [{ position: "front", images: imageIds.map((id) => ({ id, x: 0.5, y: 0.5, scale: 1, angle: 0 })) }] }]
        : [];
      try {
        const variantsRes = await fetch(
          `${PRINTIFY_BASE}/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`,
          { headers: { Authorization: `Bearer ${PRINTIFY_API_KEY}` } },
        );
        if (variantsRes.ok) {
          const variantsJson = await variantsRes.json();
          const variants = variantsJson?.variants || [];
          const variant = variants.find((v: any) => v.id === variantId) || variants[0];
          // Auto-discover the variant id when it wasn't configured (e.g. coloring).
          if (!variantId && variant?.id) variantId = variant.id;
          const positions: string[] = (variant?.placeholders || []).map((ph: any) => ph.position).filter(Boolean);
          if (positions.length && imageIds.length) {
            // One image per placeholder, in order (cover → page/spread 1 → …).
            const placeholders = positions
              .map((position, idx) => ({
                position,
                images: imageIds[idx] ? [{ id: imageIds[idx], x: 0.5, y: 0.5, scale: 1, angle: 0 }] : [],
              }))
              .filter((ph) => ph.images.length > 0);
            if (imageIds.length > positions.length) {
              console.warn(
                `Book has ${imageIds.length} images but blueprint ${blueprintId} exposes only ${positions.length} print slots — extra images dropped: ${imageIds.length - positions.length}.`,
              );
            } else if (imageIds.length < positions.length) {
              console.warn(
                `Book has ${imageIds.length} images for a ${positions.length}-slot blueprint ${blueprintId} — ${positions.length - imageIds.length} slot(s) will print blank.`,
              );
            }
            printAreas = [{ variant_ids: [variantId], placeholders }];
          } else {
            console.warn(`No placeholders found for variant ${variantId} on blueprint ${blueprintId}; using single "front" placeholder.`);
          }
        } else {
          console.warn(`Placeholder lookup failed [${variantsRes.status}] for blueprint ${blueprintId}; using single "front" placeholder.`);
        }
      } catch (e) {
        console.error("Print-area placeholder mapping error; using single 'front' fallback:", e);
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
            print_areas: printAreas,
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
