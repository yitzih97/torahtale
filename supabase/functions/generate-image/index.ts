import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, childName, artStyle, torahPortion, referenceImage } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const styleMap: Record<string, string> = {
      cartoon: "colorful cartoon illustration style, like a classic children's book, soft watercolor textures",
      "3d-pixar": "3D Pixar-style CGI render, warm lighting, soft shadows, expressive characters",
      "graphic-novel": "graphic novel illustration, bold ink lines, flat colors, dynamic composition",
    };

    const styleDesc = styleMap[artStyle] || styleMap.cartoon;

    let imagePrompt = prompt ||
      `A beautiful children's book illustration of a child named ${childName} in a scene from the Torah story "${torahPortion}". ${styleDesc}. All characters must be dressed modestly (tznius) — boys wearing kippah/yarmulke and tzitzis, girls in long modest dresses with long sleeves. Safe for children, warm and magical atmosphere, vibrant colors, no text in the image.`;

    // Build messages array
    const content: any[] = [];

    if (referenceImage) {
      imagePrompt = `Using the provided photo as a reference for the child's appearance (face, features, hair), create: ${imagePrompt}. The child in the illustration should closely resemble the child in the reference photo but rendered in the specified art style.`;

      content.push({
        type: "image_url",
        image_url: {
          url: referenceImage,
        },
      });
    }

    content.push({ type: "text", text: imagePrompt });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const body = await response.text();
      console.error("AI gateway error:", status, body);
      throw new Error(`AI gateway error [${status}]`);
    }

    const data = await response.json();
    const images = data.choices?.[0]?.message?.images;

    if (!images || images.length === 0) {
      throw new Error("No image returned from AI");
    }

    const imageUrl = images[0].image_url.url;

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
