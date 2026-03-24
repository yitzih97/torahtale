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

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    const styleMap: Record<string, string> = {
      cartoon: "colorful cartoon illustration style, like a classic children's book, soft watercolor textures",
      "3d-pixar": "3D Pixar-style CGI render, warm lighting, soft shadows, expressive characters",
      "graphic-novel": "graphic novel illustration, bold ink lines, flat colors, dynamic composition",
    };

    const styleDesc = styleMap[artStyle] || styleMap.cartoon;

    let imagePrompt = prompt ||
      `A beautiful children's book illustration of a child named ${childName} in a scene from the Torah story "${torahPortion}". ${styleDesc}. All characters must be dressed modestly (tznius) — boys wearing kippah/yarmulke and tzitzis, girls in long modest dresses with long sleeves. Safe for children, warm and magical atmosphere, vibrant colors, no text in the image.`;

    // Build parts array for the request
    const parts: any[] = [];

    if (referenceImage) {
      imagePrompt = `Using the provided photo as a reference for the child's appearance (face, features, hair), create: ${imagePrompt}. The child in the illustration should closely resemble the child in the reference photo but rendered in the specified art style.`;

      // If reference image is base64 data URI, extract the data
      if (referenceImage.startsWith("data:")) {
        const match = referenceImage.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      } else {
        // URL-based image
        parts.push({
          fileData: {
            fileUri: referenceImage,
            mimeType: "image/jpeg",
          },
        });
      }
    }

    parts.push({ text: imagePrompt });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const body = await response.text();
      console.error("Gemini image generation error:", status, body);
      throw new Error(`Gemini image generation error [${status}]`);
    }

    const data = await response.json();
    const parts_response = data.candidates?.[0]?.content?.parts || [];

    // Find the image part in the response
    let imageUrl: string | null = null;
    for (const part of parts_response) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error("No image returned from Gemini");
    }

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
