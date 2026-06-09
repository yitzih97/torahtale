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

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authErr = await requireUser(req);
  if (authErr) return authErr;

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

    const descLower = (description || "").toLowerCase();
    const mentionsFrumGarb = /kippah|kipa|yarmulke|peyos|payos|peyot|tzitzis|tzitzit/.test(descLower);
    const isUnder3Boy = gender === "boy" && !isNaN(ageNum) && ageNum < 3;

    const genderDetails = gender === "boy"
      ? isUnder3Boy
        ? mentionsFrumGarb
          ? "a young toddler in modest clothing, keeping true toddler proportions; include ONLY the specific religious items explicitly requested in the description and keep them identical in every view"
          : "a young toddler in simple modest clothing with true pre-upsherin toddler proportions — NO yarmulke/kippah, NO peyos, NO tzitzis unless those exact items are clearly visible in the attached reference photo"
        : "wearing a yarmulke/kippah with visible peyos (sidelocks), tzitzis, and modest clothing"
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
- The child must read as EXACTLY ${ageNum} years old in every view — never older, never younger. Preserve the same head size, body scale, height impression, and toddler/child proportions in every panel.
- Clothing must be identical in every view — same colors, same patterns, same fit.
- ${gender === "boy" ? (isUnder3Boy ? (mentionsFrumGarb ? "The child is under 3. Keep him a real toddler. Only include the specific religious items explicitly requested in the description, and keep them identical in every view." : "The child is under 3 and pre-upsherin. Do NOT draw a yarmulke/kippah, do NOT draw peyos, and do NOT draw tzitzis unless they are clearly visible in the attached reference photo. Show a simple toddler hairstyle. Must be consistent in every view.") : "The yarmulke, peyos, and tzitzis must be clearly visible and consistent in every view.") : "The modest dress must be the same in every view — same color, same sleeves, same length."}
- This sheet will be used as a reference to generate consistent illustrations across a children's book. The character must be recognizable in every single view.

BACKGROUND: Clean solid white background. No environments, no props, no text labels.

${referenceImage ? `REFERENCE PHOTO PROVIDED: You MUST match the child's facial features, face shape, hair color, hair texture, eye color, and skin tone from the attached reference photo as closely as possible, while rendering in the specified art style. The illustrated character should be immediately recognizable as the same child in the photo. If this is a boy under 3, use the photo for likeness first and ONLY keep a kippah, peyos, or tzitzis if they are clearly visible in the photo or explicitly requested in the description.` : ""}`;

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
            const b64 = bufferToBase64(buf);
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

    // ============= OPENAI BRANCH =============
    const isOpenAI = customImageModel && /^(gpt-image|dall-e)/i.test(customImageModel);
    if (isOpenAI) {
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

      const imageBlobs: { blob: Blob; name: string }[] = [];
      let promptText = "";
      for (const p of parts) {
        if (p.inlineData) {
          const bin = Uint8Array.from(atob(p.inlineData.data), (c) => c.charCodeAt(0));
          const ext = (p.inlineData.mimeType || "image/png").split("/")[1] || "png";
          imageBlobs.push({ blob: new Blob([bin], { type: p.inlineData.mimeType }), name: `ref-${imageBlobs.length}.${ext}` });
        } else if (p.text) {
          promptText += p.text + "\n";
        }
      }

      let oResp: Response;
      if (imageBlobs.length > 0) {
        const fd = new FormData();
        fd.append("model", customImageModel);
        fd.append("prompt", promptText);
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
          body: JSON.stringify({ model: customImageModel, prompt: promptText, size: "1024x1024", n: 1 }),
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
      console.log(`Character sheet using OpenAI model: ${customImageModel}`);
      return new Response(JSON.stringify({ imageUrl: `data:image/png;base64,${b64}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ============= END OPENAI BRANCH =============

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
