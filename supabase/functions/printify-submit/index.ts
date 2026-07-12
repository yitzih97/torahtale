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

    // Upload ONE composited print image (a data URL rendered client-side with
    // the caption text + cover wrap baked in) and return its Printify image id.
    // The admin client calls this per image, then passes the ids to submit-order
    // — keeping each request small instead of shipping ~21 images in one body.
    if (action === "upload-image") {
      if (!PRINTIFY_API_KEY) throw new Error("PRINTIFY_API_KEY not configured");
      const src: string = body.dataUrl || "";
      const fileName: string = body.fileName || "page.png";
      const dataUrlMatch = /^data:image\/\w+;base64,(.+)$/.exec(src);
      const payload = dataUrlMatch
        ? { file_name: fileName, contents: dataUrlMatch[1] }
        : { file_name: fileName, url: src };
      const uploadRes = await fetch(`${PRINTIFY_BASE}/uploads/images.json`, {
        method: "POST",
        headers: { Authorization: `Bearer ${PRINTIFY_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!uploadRes.ok) {
        const t = await uploadRes.text();
        throw new Error(`Printify image upload failed [${uploadRes.status}]: ${t.slice(0, 200)}`);
      }
      const img = await uploadRes.json();
      return new Response(JSON.stringify({ success: true, id: img.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "submit-order") {
      if (!PRINTIFY_API_KEY) throw new Error("PRINTIFY_API_KEY not configured");
      if (!shopId) throw new Error("Printify Shop ID not configured");

      const { bookId } = body;
      if (!bookId) throw new Error("bookId is required");
      // Pre-uploaded, print-ready image ids (cover-wrap first, then page_1…N), in
      // placeholder order — produced by the client via renderPrintImages + the
      // upload-image action above. When present we use them directly and skip the
      // raw pages_data upload (which had no text and a square, front-only cover).
      const providedImageIds: string[] = Array.isArray(body.imageIds)
        ? body.imageIds.filter((x: unknown) => typeof x === "string" && x)
        : [];

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
      // second one (e.g. an admin double-clicking Approve). BUT verify the order
      // still exists first — an earlier attempt may have saved an id for an order
      // that was later deleted (or never fully created), and a blind dedup would
      // then block re-submission forever ("says confirmed, but nothing in
      // Printify"). Only re-create when Printify says the order is truly gone
      // (404); never on a transient/auth error, to avoid duplicate orders.
      if (book.printify_order_id) {
        let orderStillExists = true;
        try {
          const checkRes = await fetch(
            `${PRINTIFY_BASE}/shops/${shopId}/orders/${book.printify_order_id}.json`,
            { headers: { Authorization: `Bearer ${PRINTIFY_API_KEY}` } },
          );
          if (checkRes.status === 404) orderStillExists = false;
        } catch (_e) { /* transient — keep the id, treat as duplicate */ }

        if (orderStillExists) {
          return new Response(JSON.stringify({
            success: true,
            productId: book.printify_product_id,
            orderId: book.printify_order_id,
            duplicate: true,
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        console.warn(
          `Printify order ${book.printify_order_id} for book ${bookId} not found (404) — clearing the stale id and re-creating.`,
        );
        await supabase.from("books")
          .update({ printify_order_id: null, printify_product_id: null })
          .eq("id", bookId);
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

      // Upload page images to Printify. Generated page images are stored as
      // base64 data URLs (data:image/png;base64,…); Printify's /uploads/images
      // endpoint only accepts a real http(s) URL via `url`, so for data URLs we
      // must send the raw base64 via `contents` instead. Hosted https images
      // still go through `url`.
      // Optional text-baked front cover (Parasha name + kids), rendered by the
      // admin client so Printify prints the title on the cover.
      const coverImageOverride: string | undefined =
        typeof body.coverImage === "string" && body.coverImage ? body.coverImage : undefined;

      let imageIds: string[] = [];
      if (providedImageIds.length) {
        // Print-ready images were already uploaded (with text + cover wrap) via
        // the upload-image action — use them as-is, in placeholder order.
        imageIds = providedImageIds;
      } else {
        // Legacy fallback: upload the raw stored images (no text overlay). Kept so
        // an older client still works, but the current admin client always sends
        // pre-rendered imageIds.
        for (const page of pages) {
          const src = (page.type === "cover" && coverImageOverride) ? coverImageOverride : (page.imageUrl || page.image);
          if (!src) continue;
          const fileName = `page-${page.page || imageIds.length + 1}.png`;
          const dataUrlMatch = /^data:image\/\w+;base64,(.+)$/.exec(src);
          const payload = dataUrlMatch
            ? { file_name: fileName, contents: dataUrlMatch[1] }
            : { file_name: fileName, url: src };
          const uploadRes = await fetch(`${PRINTIFY_BASE}/uploads/images.json`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${PRINTIFY_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          if (uploadRes.ok) {
            const img = await uploadRes.json();
            imageIds.push(img.id);
          } else {
            console.error(`Printify image upload failed for ${fileName}:`, uploadRes.status, (await uploadRes.text()).slice(0, 200));
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
      }
      if (!imageIds.length) throw new Error("No print images to submit.");

      // Map each uploaded image to its real print-area placeholder. These books
      // print one image PER print area — a "Cover" plus "Page 1…N" (8×8) or
      // "Spread 1…N" (board). `imageIds` are in page order (cover first, then the
      // story pages), matching the blueprint's placeholder order. We discover the
      // placeholder positions at runtime from the catalog so we never hardcode
      // catalog slugs, and fall back to a single "front" placeholder if the lookup
      // fails — so submission never breaks.
      // Discover the blueprint's real print-slot positions (cover, page_1, …).
      // These photo-book blueprints have NO "front" placeholder, so a fallback
      // to "front" always produces "Placeholder: front is invalid". If the
      // lookup fails (almost always a bad PRINTIFY_API_KEY → 401), fail LOUDLY
      // with the real status rather than silently building a broken product.
      let positions: string[] = [];
      const variantsRes = await fetch(
        `${PRINTIFY_BASE}/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`,
        { headers: { Authorization: `Bearer ${PRINTIFY_API_KEY}` } },
      );
      if (!variantsRes.ok) {
        const t = await variantsRes.text();
        throw new Error(
          `Could not load Printify print slots for blueprint ${blueprintId} [${variantsRes.status}]` +
          (variantsRes.status === 401 || variantsRes.status === 403
            ? " — the PRINTIFY_API_KEY is invalid or lacks scopes. Order NOT created."
            : `: ${t.slice(0, 150)}`),
        );
      }
      {
        const variantsJson = await variantsRes.json();
        const variants = variantsJson?.variants || [];
        const variant = variants.find((v: any) => v.id === variantId) || variants[0];
        if (!variantId && variant?.id) variantId = variant.id;
        positions = (variant?.placeholders || []).map((ph: any) => ph.position).filter(Boolean);
      }
      if (!positions.length) {
        throw new Error(`Blueprint ${blueprintId} / variant ${variantId} exposed no print placeholders — check the Printify config. Order NOT created.`);
      }
      if (imageIds.length > positions.length) {
        console.warn(`Book has ${imageIds.length} images but only ${positions.length} print slots — extra dropped.`);
      } else if (imageIds.length < positions.length) {
        console.warn(`Book has ${imageIds.length} images for ${positions.length} slots — ${positions.length - imageIds.length} will print blank.`);
      }
      // One image per placeholder, in order (cover → page 1 → …).
      const printAreas = [{
        variant_ids: [variantId],
        placeholders: positions
          .map((position, idx) => ({
            position,
            images: imageIds[idx] ? [{ id: imageIds[idx], x: 0.5, y: 0.5, scale: 1, angle: 0 }] : [],
          }))
          .filter((ph) => ph.images.length > 0),
      }];

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
          // Printify dedupes on external_id and NEVER frees it once used — even
          // after an order is canceled. So a canceled-then-resubmitted book would
          // be permanently rejected (409 "Order already exists for the given
          // external_id"). Append a per-attempt suffix so retries get a fresh id.
          // (Our own idempotency guard on printify_order_id already prevents
          // accidental double submits, so we don't rely on Printify's dedup.)
          external_id: `${book.shopify_order_id || book.id}-${Date.now().toString(36)}`,
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
