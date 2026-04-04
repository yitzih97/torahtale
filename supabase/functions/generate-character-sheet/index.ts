import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    const { childName, age, gender, artStyle, description, referenceImage } = await req.json();

    const ageNum = parseInt(age) || 5;
    let ageDesc = "child";
    if (ageNum <= 3) ageDesc = "toddler/baby";
    else if (ageNum <= 5) ageDesc = "young child";
    else if (ageNum <= 8) ageDesc = "child";
    else if (ageNum <= 10) ageDesc = "older child";
    else ageDesc = "preteen/teenager";

    const styleMap: Record<string, string> = {
      cartoon: "colorful 2D cartoon illustration, soft watercolor textures, Disney-inspired children's book style",
      "3d-pixar": "3D Pixar-style CGI render, warm studio lighting, subsurface scattering on skin",
      realistic: "photorealistic illustration, natural lighting, lifelike detail, warm cinematic tones",
      "graphic-novel": "graphic novel illustration, bold ink lines, flat colors, dynamic composition",
    };
    const style = styleMap[artStyle] || styleMap.cartoon;

    const genderDetails = gender === "boy"
      ? "wearing a yarmulke/kippah with visible peyos (sidelocks), tzitzis, and modest clothing"
      : "modest dress with long sleeves and long skirt below the knee, no head covering for unmarried girls, tznius appearance";

    const descPart = description
      ? `Physical appearance: ${description}.`
      : "cheerful, bright-eyed expression, friendly smile.";

    const prompt = `Create a detailed CHARACTER MODEL SHEET for a ${ageNum}-year-old frum Yiddishe ${gender} ${ageDesc} named ${childName || "child"}.

LAYOUT: A single image containing a grid with: FRONT VIEW (full body), 3/4 VIEW (full body), SIDE PROFILE (head and shoulders), and 2 FACIAL EXPRESSIONS (happy, surprised). All views arranged neatly on the same white sheet.

CHARACTER DETAILS:
- ${genderDetails}
- ${descPart}
- Art style: ${style}

CRITICAL CONSISTENCY RULES:
- Every view must show the EXACT SAME character — identical face shape, nose, eyes, eyebrows, mouth, hair color, hair style, skin tone, and body proportions.
- Clothing must be identical in every view — same colors, same patterns, same fit.
- ${gender === "boy" ? "The yarmulke, peyos, and tzitzis must be clearly visible and consistent in every view." : "The modest dress must be the same in every view — same color, same sleeves, same length."}
- This sheet will be used as a reference to generate consistent illustrations across a children's book. The character must be recognizable in every single view.

BACKGROUND: Clean solid white background. No environments, no props, no text labels.

${referenceImage ? "REFERENCE PHOTO PROVIDED: You MUST match the child's facial features, face shape, hair color, hair texture, eye color, and skin tone from the attached reference photo as closely as possible, while rendering in the specified art style. The illustrated character should be immediately recognizable as the same child in the photo." : ""}`;

    const parts: any[] = [];

    if (referenceImage) {
      if (referenceImage.startsWith("data:")) {
        const match = referenceImage.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      } else {
        // Try to fetch the image and convert to base64
        try {
          const imgResp = await fetch(referenceImage);
          if (imgResp.ok) {
            const buf = await imgResp.arrayBuffer();
            const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
            const ct = imgResp.headers.get("content-type") || "image/jpeg";
            parts.push({ inlineData: { mimeType: ct, data: b64 } });
          }
        } catch (e) {
          console.error("Failed to fetch reference image:", e);
        }
      }
    }

    parts.push({ text: prompt });

    // Load custom image model from settings
    let customImageModel: string | null = null;
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const settingsRes = await fetch(`${supabaseUrl}/rest/v1/site_settings?category=eq.ai&key=eq.image-model`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      });
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        customImageModel = settings[0]?.value || null;
      }
    } catch (e) { console.error("Failed to load settings:", e); }

    const imageModels = customImageModel
      ? [customImageModel, "gemini-3.1-flash-image-preview", "gemini-2.5-flash-image-preview"]
      : ["gemini-3.1-flash-image-preview", "gemini-2.5-flash-image-preview", "gemini-2.5-flash-image"];

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
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
        }
      );

      if (attempt.ok) { response = attempt; selectedModel = model; break; }

      const body = await attempt.text();
      lastErrorStatus = attempt.status;
      lastErrorBody = body;
      console.error(`Character sheet error with model ${model}:`, attempt.status, body);

      if (attempt.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const retryable = attempt.status === 404 ||
        (attempt.status === 400 && /not found|not supported|generatecontent|responsemodalities/i.test(body));
      if (!retryable) throw new Error(`Gemini error [${attempt.status}]`);
    }

    if (!response) throw new Error(`Gemini error [${lastErrorStatus ?? 500}]`);

    console.log(`Character sheet using model: ${selectedModel}`);
    const data = await response.json();
    const partsResponse = data.candidates?.[0]?.content?.parts || [];

    let imageUrl: string | null = null;
    for (const part of partsResponse) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) throw new Error("No image returned from Gemini");

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-character-sheet error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
