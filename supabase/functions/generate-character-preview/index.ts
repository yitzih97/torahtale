import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function requireUser(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (error || !data?.claims) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authErr = await requireUser(req);
  if (authErr) return authErr;

  try {
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    const { gender, age, artStyle, description, referenceImage } = await req.json();

    // Load custom settings
    let customCharacterTemplate: string | null = null;
    let customImageModel: string | null = null;
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const settingsRes = await fetch(`${supabaseUrl}/rest/v1/site_settings?category=in.(prompts,ai)`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      });
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        customCharacterTemplate = settings.find((s: any) => s.category === "prompts" && s.key === "character-prompt-template")?.value || null;
        customImageModel = settings.find((s: any) => s.category === "ai" && s.key === "image-model")?.value || null;
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
    const descLower = (description || "").toLowerCase();
    const mentionsFrumGarb = /kippah|kipa|yarmulke|peyos|payos|peyot|tzitzis|tzitzit/.test(descLower);
    const isUnder3Boy = gender === "boy" && !isNaN(ageNum) && ageNum < 3;
    const genderDetails =
      gender === "boy"
        ? isUnder3Boy
          ? mentionsFrumGarb
            ? "a real 2-year-old toddler in modest clothing with true toddler proportions; include ONLY the specific religious items explicitly requested in the description and keep them consistent"
            : "a real 2-year-old toddler in simple modest clothing with true pre-upsherin toddler proportions — NO yarmulke/kippah, NO peyos, NO tzitzis unless those exact items are clearly visible in the attached reference photo"
          : "wearing a yarmulke/kippah with visible peyos (sidelocks), tzitzis, and modest clothing"
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
      prompt = `Create a character portrait illustration of a ${ageNum}-year-old Jewish ${gender} ${ageDesc}. ${genderDetails}. ${descPart} Style: ${style}. The child must read as exactly ${ageNum} years old with stable age-appropriate proportions, face, clothing, and size. Children's book character design, bust/portrait view, clean white background, vibrant colors, warm and inviting. No text in the image.`;
    }

    if (isUnder3Boy && !mentionsFrumGarb) {
      prompt += " CRITICAL TODDLER RULE: For a boy under age 3, do NOT add a yarmulke/kippah, peyos, or tzitzis unless those exact items are clearly visible in the attached photo. Do not invent them.";
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

    // ============= OPENAI BRANCH =============
    const isOpenAI = customImageModel && /^(gpt-image|dall-e)/i.test(customImageModel);
    if (isOpenAI) {
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

      const imageBlobs: { blob: Blob; name: string }[] = [];
      for (const p of parts) {
        if (p.inlineData) {
          const bin = Uint8Array.from(atob(p.inlineData.data), (c) => c.charCodeAt(0));
          const ext = (p.inlineData.mimeType || "image/png").split("/")[1] || "png";
          imageBlobs.push({ blob: new Blob([bin], { type: p.inlineData.mimeType }), name: `ref-${imageBlobs.length}.${ext}` });
        }
      }

      let oResp: Response;
      if (imageBlobs.length > 0) {
        const fd = new FormData();
        fd.append("model", customImageModel);
        fd.append("prompt", prompt);
        fd.append("size", "1024x1024");
        fd.append("n", "1");
        for (const ib of imageBlobs) fd.append("image[]", ib.blob, ib.name);
        oResp = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
          body: fd,
        });
      } else {
        oResp = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: customImageModel, prompt, size: "1024x1024", n: 1 }),
        });
      }
      if (!oResp.ok) {
        const t = await oResp.text();
        console.error(`OpenAI ${customImageModel} error:`, oResp.status, t);
        if (oResp.status === 429) {
          return new Response(JSON.stringify({ error: "OpenAI rate limit — please try again." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`OpenAI image error [${oResp.status}]`);
      }
      const od = await oResp.json();
      const b64 = od.data?.[0]?.b64_json;
      if (!b64) throw new Error("No image returned from OpenAI");
      console.log(`Character preview using OpenAI model: ${customImageModel}`);
      return new Response(JSON.stringify({ imageUrl: `data:image/png;base64,${b64}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ============= END OPENAI BRANCH =============

    const imageModels = customImageModel
      ? [customImageModel, "gemini-3.1-flash-image-preview", "gemini-2.5-flash-image-preview"]
      : [
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
