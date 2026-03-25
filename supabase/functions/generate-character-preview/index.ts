import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { gender, age, artStyle, description, referenceImage } = await req.json();

    // Build age-appropriate description
    const ageNum = parseInt(age) || 5;
    let ageDesc = "child";
    if (ageNum <= 3) ageDesc = "toddler/baby";
    else if (ageNum <= 5) ageDesc = "young child";
    else if (ageNum <= 8) ageDesc = "child";
    else if (ageNum <= 10) ageDesc = "older child";
    else ageDesc = "preteen/teenager";

    // Art style mapping
    const styleMap: Record<string, string> = {
      cartoon: "colorful 2D cartoon illustration, soft watercolor textures, Disney-inspired",
      "3d-pixar": "3D Pixar-style CGI render, warm studio lighting, subsurface scattering on skin",
      realistic: "photorealistic portrait, natural lighting, lifelike detail, warm tones, shallow depth of field",
    };
    const style = styleMap[artStyle] || styleMap.cartoon;

    // Gender-specific details
    const genderDetails =
      gender === "boy"
        ? "wearing a kippah/yarmulke on his head, modest clothing"
        : "modest dress or outfit, no head covering";

    // Build the prompt
    const descPart = description
      ? `Physical appearance: ${description}.`
      : "cheerful, bright-eyed expression, friendly smile.";

    const prompt = `Create a character portrait illustration of a ${ageNum}-year-old Jewish ${gender} ${ageDesc}. ${genderDetails}. ${descPart} Style: ${style}. Children's book character design, bust/portrait view, clean white background, vibrant colors, warm and inviting. No text in the image.`;

    // Build messages
    const messages: any[] = [];
    const content: any[] = [{ type: "text", text: prompt }];

    if (referenceImage) {
      content.push({
        type: "image_url",
        image_url: { url: referenceImage },
      });
    }

    messages.push({ role: "user", content });

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages,
          modalities: ["image", "text"],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl =
      data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-character-preview error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
