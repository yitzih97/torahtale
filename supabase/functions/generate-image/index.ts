import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, childName, artStyle, torahPortion, referenceImage, bookFormat, pageType, pageNumber, characterSheet, childDescription } = await req.json();

    /* ── Printify print-area dimensions by format ── */
    const PRINT_SPECS: Record<string, { page: [number, number]; cover: [number, number] }> = {
      "softcover-8x8":   { page: [2400, 2400], cover: [4790, 2400] },
      "hardcover-8x8":   { page: [2325, 2325], cover: [5370, 2850] },
      "hardcover-11x8.5":{ page: [2325, 2325], cover: [5370, 2850] },
      "board-6x6":       { page: [3675, 1875], cover: [3863, 1875] },
    };
    const specs = bookFormat ? PRINT_SPECS[bookFormat] : null;
    const isCover = pageType === "cover" || pageType === "back-cover";
    const dims = specs ? (isCover ? specs.cover : specs.page) : null;

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    // Load custom settings + book-templates
    let customImageTemplate: string | null = null;
    let customImageModel: string | null = null;
    let pageImageTemplate: string | null = null;
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const settingsRes = await fetch(`${supabaseUrl}/rest/v1/site_settings?category=in.(prompts,ai,book-templates)`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      });
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        customImageTemplate = settings.find((s: any) => s.category === "prompts" && s.key === "image-prompt-template")?.value || null;
        customImageModel = settings.find((s: any) => s.category === "ai" && s.key === "image-model")?.value || null;

        // Look for page-specific image prompt template
        if (torahPortion) {
          let templateKey: string | null = null;
          if (pageType === "cover") templateKey = `${torahPortion}:cover:image-prompt`;
          else if (pageType === "back-cover") templateKey = `${torahPortion}:back-cover:image-prompt`;
          else if (pageNumber) templateKey = `${torahPortion}:page-${pageNumber}:image-prompt`;

          if (templateKey) {
            const found = settings.find((s: any) => s.category === "book-templates" && s.key === templateKey);
            if (found?.value?.trim()) {
              pageImageTemplate = found.value;
            }
          }
        }
      }
    } catch (e) { console.error("Failed to load site_settings:", e); }

    const styleMap: Record<string, string> = {
      cartoon: "colorful cartoon illustration style, like a classic children's book, soft watercolor textures",
      "3d-pixar": "3D Pixar-style CGI render, warm lighting, soft shadows, expressive characters",
      realistic: "photorealistic illustration, natural lighting, lifelike detail, warm cinematic tones",
      "graphic-novel": "graphic novel illustration, bold ink lines, flat colors, dynamic composition",
    };

    const styleDesc = styleMap[artStyle] || styleMap.cartoon;

    let imagePrompt: string;

    // Priority: 1) explicit prompt param, 2) page-specific template, 3) custom global template, 4) default
    if (prompt) {
      imagePrompt = prompt;
    } else if (pageImageTemplate) {
      // Admin-defined per-page image prompt template
      imagePrompt = pageImageTemplate
        .replace(/\{childName\}/g, childName || "a child")
        .replace(/\{torahPortion\}/g, torahPortion || "Torah")
        .replace(/\{styleDesc\}/g, styleDesc)
        .replace(/\{artStyle\}/g, artStyle || "cartoon")
        .replace(/\{pageNumber\}/g, String(pageNumber || ""))
        .replace(/\{pageType\}/g, pageType || "page");
    } else if (customImageTemplate) {
      imagePrompt = customImageTemplate
        .replace("{childName}", childName || "a child")
        .replace("{torahPortion}", torahPortion || "Torah")
        .replace("{styleDesc}", styleDesc);
    } else {
      imagePrompt = `A beautiful children's book illustration of a frum Yiddishe child named ${childName} in a scene from the Torah story "${torahPortion}". ${styleDesc}. imagePrompt = `A beautiful children's book illustration of a frum Yiddishe child named ${childName} in a scene from the Torah story "${torahPortion}". ${styleDesc}. Boys aged 3+ MUST have peyos (sidelocks), yarmulke/kippah, and visible tzitzis. Boys aged 0-2 do NOT wear a yarmulke (before upsherin) but may have beginning peyos. Girls MUST wear long modest dresses with long sleeves and long skirts below the knee — no head covering for unmarried girls. Orthodox Jewish setting — no modern secular elements visible. Safe for children, warm and magical atmosphere, vibrant colors, no text in the image.`; Girls MUST wear long modest dresses with long sleeves and long skirts below the knee — no head covering for unmarried girls. Orthodox Jewish setting — no modern secular elements visible. Safe for children, warm and magical atmosphere, vibrant colors, no text in the image.`;
    }

    // Append dimension instructions for Printify print-ready output
    if (dims) {
      imagePrompt += ` The output image MUST be exactly ${dims[0]}x${dims[1]} pixels.`;
    }

    // Inject child description into prompt if available
    if (childDescription && !prompt) {
      imagePrompt += ` The child character has these features: ${childDescription}.`;
    }

    const parts: any[] = [];

    // Inject character sheet as primary reference for consistency
    if (characterSheet) {
      imagePrompt = `CRITICAL CHARACTER CONSISTENCY INSTRUCTION: The attached image is a CHARACTER REFERENCE SHEET showing the child character from multiple angles. You MUST reproduce this EXACT same character in the illustration — identical face shape, identical hair color and style, identical eye color, identical skin tone, identical clothing colors and style, identical proportions. The child in this illustration must be IMMEDIATELY RECOGNIZABLE as the same character from the reference sheet. Do NOT change any physical features. Do NOT alter the character's appearance in any way. ${imagePrompt}`;

      if (characterSheet.startsWith("data:")) {
        const match = characterSheet.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      } else {
        try {
          const imgResp = await fetch(characterSheet);
          if (imgResp.ok) {
            const buf = await imgResp.arrayBuffer();
            const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
            const ct = imgResp.headers.get("content-type") || "image/jpeg";
            parts.push({ inlineData: { mimeType: ct, data: b64 } });
          }
        } catch (e) { console.error("Failed to fetch character sheet:", e); }
      }
    }

    if (referenceImage) {
      imagePrompt = `Using the provided photo as a reference for the child's appearance (face, features, hair), create: ${imagePrompt}. The child in the illustration should closely resemble the child in the reference photo but rendered in the specified art style.`;

      if (referenceImage.startsWith("data:")) {
        const match = referenceImage.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      } else {
        parts.push({ fileData: { fileUri: referenceImage, mimeType: "image/jpeg" } });
      }
    }

    parts.push({ text: imagePrompt });

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
        return new Response(JSON.stringify({ error: "Rate limited — please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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

    console.log(`Gemini image generation using model: ${selectedModel}`);
    const data = await response.json();
    const parts_response = data.candidates?.[0]?.content?.parts || [];

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
