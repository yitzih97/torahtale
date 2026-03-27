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

      const pages = (book.pages_data as any[]) || [];
      if (!pages.length) throw new Error("Book has no pages");

      // Upload page images to Printify
      const imageIds: string[] = [];
      for (const page of pages) {
        if (!page.imageUrl) continue;
        // Upload image to Printify
        const uploadRes = await fetch(`${PRINTIFY_BASE}/uploads/images.json`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PRINTIFY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file_name: `page-${page.page || imageIds.length + 1}.png`,
            url: page.imageUrl,
          }),
        });
        if (uploadRes.ok) {
          const img = await uploadRes.json();
          imageIds.push(img.id);
        }
      }

      // Create product
      const blueprintId = getSetting("printify-blueprint-id") || "635";
      const printProviderId = getSetting("printify-print-provider-id") || "99";

      const productRes = await fetch(`${PRINTIFY_BASE}/shops/${shopId}/products.json`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PRINTIFY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${book.child_name}'s Torah Tale - ${book.torah_portion}`,
          description: `Personalized Torah story for ${book.child_name}`,
          blueprint_id: parseInt(blueprintId),
          print_provider_id: parseInt(printProviderId),
          variants: [{ id: 1, price: 3499, is_enabled: true }],
          print_areas: imageIds.length > 0 ? [{
            variant_ids: [1],
            placeholders: [{ position: "front", images: imageIds.map((id, i) => ({ id, x: 0, y: 0, scale: 1, angle: 0 })) }],
          }] : [],
        }),
      });

      if (!productRes.ok) {
        const errText = await productRes.text();
        throw new Error(`Printify create product error [${productRes.status}]: ${errText}`);
      }

      const product = await productRes.json();

      // Update book with Printify product ID
      await supabase.from("books").update({
        status: "printing",
        updated_at: new Date().toISOString(),
      }).eq("id", bookId);

      return new Response(JSON.stringify({ success: true, productId: product.id }), {
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
