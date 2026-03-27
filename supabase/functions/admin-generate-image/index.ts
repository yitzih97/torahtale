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

    const { assetKey, prompt } = await req.json();
    if (!assetKey || !prompt) throw new Error("assetKey and prompt are required");

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    // Load preferred site image model from settings
    let customSiteImageModel: string | null = null;
    try {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || serviceKey;
      const sRes = await fetch(`${supabaseUrl}/rest/v1/site_settings?category=eq.ai&key=eq.site-image-model`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      if (sRes.ok) {
        const ss = await sRes.json();
        customSiteImageModel = ss[0]?.value || null;
      }
    } catch (e) { console.error("Failed to load site image model:", e); }

    // Upsert site_assets record as "generating"
    const { data: existing } = await supabase
      .from("site_assets")
      .select("id")
      .eq("asset_key", assetKey)
      .maybeSingle();

    if (existing) {
      await supabase.from("site_assets").update({
        status: "generating",
        prompt_used: prompt,
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await supabase.from("site_assets").insert({
        asset_key: assetKey,
        status: "generating",
        prompt_used: prompt,
      });
    }

    // Generate image with Gemini
    const imageModels = [
      "gemini-3.1-flash-image-preview",
      "gemini-2.5-flash-image-preview",
      "gemini-2.5-flash-image",
    ];

    let imageData: string | null = null;
    let mimeType = "image/png";

    for (const model of imageModels) {
      const attempt = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_AI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
        }
      );

      if (!attempt.ok) {
        const body = await attempt.text();
        console.error(`Model ${model} failed:`, attempt.status, body);
        if (attempt.status === 429) {
          await supabase.from("site_assets").update({ status: "error" }).eq("asset_key", assetKey);
          return new Response(JSON.stringify({ error: "Rate limited" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        continue;
      }

      const data = await attempt.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          imageData = part.inlineData.data;
          mimeType = part.inlineData.mimeType || "image/png";
          break;
        }
      }
      if (imageData) break;
    }

    if (!imageData) {
      await supabase.from("site_assets").update({ status: "error" }).eq("asset_key", assetKey);
      throw new Error("No image generated from any model");
    }

    // Upload to storage
    const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
    const filePath = `${assetKey}.${ext}`;
    const binaryData = Uint8Array.from(atob(imageData), (c) => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from("site-images")
      .upload(filePath, binaryData, { contentType: mimeType, upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from("site-images").getPublicUrl(filePath);
    const imageUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Update site_assets
    await supabase.from("site_assets").update({
      image_url: imageUrl,
      status: "ready",
      updated_at: new Date().toISOString(),
    }).eq("asset_key", assetKey);

    return new Response(JSON.stringify({ imageUrl, assetKey }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
