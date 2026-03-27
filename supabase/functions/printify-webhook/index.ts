import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const event = await req.json();
    console.log("Printify webhook event:", JSON.stringify(event));

    const { type, resource } = event;

    // Map Printify event types to book statuses
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

    // Find book by order number matching Printify order ID
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
