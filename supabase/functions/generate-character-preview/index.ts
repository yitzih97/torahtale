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
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    const { gender, age, artStyle, description, referenceImage } = await req.json();

    // Load custom character prompt from site_settings
    let customCharacterTemplate: string | null = null;
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const settingsRes = await fetch(`${supabaseUrl}/rest/v1/site_settings?category=eq.prompts&key=eq.character-prompt-template`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      });
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        customCharacterTemplate = settings[0]?.value || null;
      }
    } catch (e) { console.error("Failed to load site_settings:", e); }

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
        ? "wearing a yarmulke/kippah with visible peyos (sidelocks), tzitzis, and modest clothing"
        : "modest dress with long sleeves and long skirt below the knee, no head covering, tznius appearance";

    // Build the prompt
    const descPart = description
      ? `Physical appearance: ${description}.`
      : "cheerful, bright-eyed expression, friendly smile.";

    let prompt: string;
    if (customCharacterTemplate) {
      prompt = customCharacterTemplate
        .replace("{age}", String(ageNum))
        .replace("{gender}", gender || "child")
        .replace("{ageDesc}", ageDesc)
        .replace("{genderDetails}", genderDetails)
        .replace("{descPart}", descPart)
        .replace("{style}", style);
    } else {
      prompt = `Create a character portrait illustration of a ${ageNum}-year-old Jewish ${gender} ${ageDesc}. ${genderDetails}. ${descPart} Style: ${style}. Children's book character design, bust/portrait view, clean white background, vibrant colors, warm and inviting. No text in the image.`;
    }

    // Build parts for Gemini API
    const parts: any[] = [];

    if (referenceImage) {
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
        parts.push({
          fileData: {
            fileUri: referenceImage,
            mimeType: "image/jpeg",
          },
        });
      }
    }

    parts.push({ text: prompt });

    const imageModels = [
      "gemini-3.1-flash-image-preview",
      "gemini-2.5-flash-image-preview",
      "gemini-2.5-flash-image",
      "gemini-2.0-flash-exp-image-generation",
      "gemini-2.0-flash-preview-image-generation",
    ];

    let response: Response | null = null;
    let selectedModel: string | null = null;
    let lastErrorStatus: number | null = null;
    let lastErrorBody = "";

    for (const model of imageModels) {
      const attempt = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_AI_API_KEY}`,
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

      if (attempt.ok) {
        response = attempt;
        selectedModel = model;
        break;
      }

      const body = await attempt.text();
      lastErrorStatus = attempt.status;
      lastErrorBody = body;
      console.error(`Gemini image generation error with model ${model}:`, attempt.status, body);

      if (attempt.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited — please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const retryableModelError =
        attempt.status === 404 ||
        (attempt.status === 400 && /not found|not supported|generatecontent|responsemodalities/i.test(body));

      if (!retryableModelError) {
        throw new Error(`Gemini image generation error [${attempt.status}]`);
      }
    }

    if (!response) {
      console.error("No compatible Gemini image model found", { lastErrorStatus, lastErrorBody });
      throw new Error(`Gemini image generation error [${lastErrorStatus ?? 500}]`);
    }

    console.log(`Character preview using model: ${selectedModel}`);
    const data = await response.json();
    const partsResponse = data.candidates?.[0]?.content?.parts || [];

    let imageUrl: string | null = null;
    for (const part of partsResponse) {
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
