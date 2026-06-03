import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROVIDER_TIMEOUT_MS = 40_000;

// Safely convert an ArrayBuffer to base64 without blowing the stack on large images
function bufferToBase64(buf: ArrayBuffer): string {
  return encodeBase64(new Uint8Array(buf));
}

async function fetchWithTimeout(input: string, init?: RequestInit, timeoutMs = PROVIDER_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort("Request timed out"), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, childName, artStyle, torahPortion, referenceImage, bookFormat, pageType, pageNumber, characterSheet, childDescription, characterSheets, childRefs, pageText } = await req.json();

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
    let sceneReferenceImageUrl: string | null = null;
    let masterBookRules: string | null = null;
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
        masterBookRules = settings.find((s: any) => s.category === "book-templates" && s.key === "master-rules")?.value || null;


        // Look for page-specific image prompt template and reference image
        if (torahPortion) {
          let templateKey: string | null = null;
          let refKey: string | null = null;
          if (pageType === "cover") {
            templateKey = `${torahPortion}:cover:image-prompt`;
            refKey = `${torahPortion}:cover:reference-image`;
          } else if (pageType === "back-cover") {
            templateKey = `${torahPortion}:back-cover:image-prompt`;
            refKey = `${torahPortion}:back-cover:reference-image`;
          } else if (pageNumber) {
            templateKey = `${torahPortion}:page-${pageNumber}:image-prompt`;
            refKey = `${torahPortion}:page-${pageNumber}:reference-image`;
          }

          if (templateKey) {
            const found = settings.find((s: any) => s.category === "book-templates" && s.key === templateKey);
            if (found?.value?.trim()) {
              pageImageTemplate = found.value;
            }
          }

          if (refKey) {
            const found = settings.find((s: any) => s.category === "book-templates" && s.key === refKey);
            if (found?.value?.trim()) {
              sceneReferenceImageUrl = found.value;
            }
          }
        }
      }
    } catch (e) { console.error("Failed to load site_settings:", e); }

    const styleMap: Record<string, string> = {
      cartoon: "high-resolution cinematic cartoon illustration, rich hand-painted textures with soft watercolor washes, volumetric golden-hour lighting with warm amber highlights and cool blue shadows, depth-of-field bokeh background, intricate environmental details — foliage, fabric folds, atmospheric particles — studio-quality children's book art with painterly brushstrokes visible",
      "3d-pixar": "ultra high-resolution 3D Pixar/DreamWorks-quality CGI render, subsurface skin scattering, physically-based materials with fabric weave detail, cinematic volumetric lighting with dramatic rim-light and warm key light, shallow depth of field, film-grain texture, ray-traced reflections and ambient occlusion, expressive stylized characters with lifelike eyes and micro-expressions",
      realistic: "photorealistic digital painting at 8K resolution, natural cinematic lighting with golden-hour warmth, hyper-detailed textures on skin, hair, and fabrics, atmospheric haze and dust motes, shallow depth of field with creamy bokeh, color-graded in warm amber and teal tones like a feature film still, lifelike proportions with painterly softness",
      "graphic-novel": "graphic novel illustration with bold confident ink linework, dramatic dynamic composition with cinematic camera angles, rich flat color palette with halftone textures and cross-hatching details, high contrast lighting with deep shadows, premium print-quality detail",
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
      imagePrompt = `Create a breathtaking, high-resolution children's book illustration of a frum Yiddishe child named ${childName} immersed in a vivid scene from the Torah story "${torahPortion}". ${styleDesc}. IMPORTANT VISUAL QUALITY: Ultra-detailed environment with rich background elements — lush landscapes, dramatic skies, atmospheric lighting with golden sunbeams and volumetric rays, visible texture on every surface (stone, fabric, wood, foliage). Cinematic composition with dynamic camera angle. Every page should feel like a frame from an award-winning animated film. CHARACTER RULES: Boys aged 3+ MUST have peyos (sidelocks), yarmulke/kippah, and visible tzitzis. Boys aged 0-2 do NOT wear a yarmulke (before upsherin) but may have beginning peyos. Girls MUST wear long modest dresses with long sleeves and long skirts below the knee — no head covering for unmarried girls. Orthodox Jewish setting — no modern secular elements, no crosses or church symbols, no text or words in the image. Safe for children, warm and magical atmosphere with vibrant saturated colors. NO text, NO letters, NO words anywhere in the image.`;
    }

    // Append dimension instructions for Printify print-ready output
    if (dims) {
      imagePrompt += ` The output image MUST be exactly ${dims[0]}x${dims[1]} pixels.`;
    }

    // Inject child description into prompt if available
    if (childDescription && !prompt) {
      imagePrompt += ` The child character has these features: ${childDescription}.`;
    }

    // Inject MASTER BOOK RULES (apply to every page of every book)
    if (masterBookRules?.trim() && !prompt) {
      const rules = masterBookRules
        .replace(/\{childName\}/g, childName || "the child")
        .replace(/\{torahPortion\}/g, torahPortion || "Torah")
        .replace(/\{artStyle\}/g, artStyle || "cartoon")
        .replace(/\{pageNumber\}/g, String(pageNumber || ""))
        .replace(/\{pageType\}/g, pageType || "page");
      imagePrompt += ` MASTER BOOK RULES (apply to every illustration without exception): ${rules}`;
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
          const imgResp = await fetchWithTimeout(characterSheet, undefined, 10_000);
          if (imgResp.ok) {
            const buf = await imgResp.arrayBuffer();
            const b64 = bufferToBase64(buf);
            const ct = imgResp.headers.get("content-type") || "image/jpeg";
            parts.push({ inlineData: { mimeType: ct, data: b64 } });
          }
        } catch (e) { console.error("Failed to fetch character sheet:", e); }
      }
    }

    if (referenceImage) {
      imagePrompt = `CRITICAL CHILD LIKENESS INSTRUCTION: The attached photograph is the REAL child this book is for. You MUST reproduce their exact face shape, eye color and shape, skin tone, hair color and texture, eyebrows, and overall facial proportions — translated faithfully into the chosen art style. The illustrated child must be IMMEDIATELY and unmistakably recognizable as the SAME real child from the photo, in every single page. Do not invent a generic child. ${imagePrompt}`;

      if (referenceImage.startsWith("data:")) {
        const match = referenceImage.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      } else {
        try {
          const imgResp = await fetchWithTimeout(referenceImage, undefined, 10_000);
          if (imgResp.ok) {
            const buf = await imgResp.arrayBuffer();
            const b64 = bufferToBase64(buf);
            const ct = imgResp.headers.get("content-type") || "image/jpeg";
            parts.push({ inlineData: { mimeType: ct, data: b64 } });
          }
        } catch (e) { console.error("Failed to fetch reference image:", e); }
      }
    }

    // Inject scene reference image for visual consistency across books
    if (sceneReferenceImageUrl) {
      imagePrompt += ` SCENE COMPOSITION GUIDE: The attached SCENE REFERENCE IMAGE shows the exact scene layout, background elements, and overall composition you MUST reproduce. Match the same environment, camera angle, lighting, and background details. However, adapt the child character to match the specified name, age, gender, and character sheet. The scene should look nearly identical to the reference — only the child character changes.`;
      try {
        const sceneResp = await fetchWithTimeout(sceneReferenceImageUrl, undefined, 10_000);
        if (sceneResp.ok) {
          const buf = await sceneResp.arrayBuffer();
          const b64 = bufferToBase64(buf);
          const ct = sceneResp.headers.get("content-type") || "image/jpeg";
          parts.push({ inlineData: { mimeType: ct, data: b64 } });
        }
      } catch (e) { console.error("Failed to fetch scene reference image:", e); }
    }

    parts.push({ text: imagePrompt });

    // ============= OPENAI BRANCH (gpt-image-* / dall-e-*) =============
    // Default to gpt-image-2 (newest) when admin hasn't picked a model.
    const requestedImageModel = customImageModel || "gpt-image-2";
    const hasRealReferencePhoto = Boolean(referenceImage);
    const shouldForceGemini = hasRealReferencePhoto;
    const effectiveImageModel = shouldForceGemini ? "gemini-3.1-flash-image-preview" : requestedImageModel;
    const isOpenAI = /^(gpt-image|dall-e)/i.test(effectiveImageModel);
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

      // Always generate 1:1 square pages (covers + interior).
      const size = "1024x1024";
      let openaiResp: Response;
      if (imageBlobs.length > 0) {
        const fd = new FormData();
        fd.append("model", effectiveImageModel);
        fd.append("prompt", imagePrompt);
        fd.append("size", size);
        fd.append("n", "1");
        for (const ib of imageBlobs) fd.append("image[]", ib.blob, ib.name);
        openaiResp = await fetchWithTimeout("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
          body: fd,
        });
      } else {
        openaiResp = await fetchWithTimeout("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: effectiveImageModel, prompt: imagePrompt, size, n: 1 }),
        });
      }

      if (!openaiResp.ok) {
        const errTxt = await openaiResp.text();
        console.error(`OpenAI ${effectiveImageModel} error:`, openaiResp.status, errTxt);
        if (openaiResp.status === 429) {
          return new Response(JSON.stringify({ error: "OpenAI rate limit — please try again." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`OpenAI image error [${openaiResp.status}]: ${errTxt.slice(0, 300)}`);
      }
      const oData = await openaiResp.json();
      const b64 = oData.data?.[0]?.b64_json;
      if (!b64) throw new Error("No image returned from OpenAI");
      console.log(`OpenAI image generation using model: ${effectiveImageModel}`);
      return new Response(JSON.stringify({ imageUrl: `data:image/png;base64,${b64}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ============= END OPENAI BRANCH =============

    const imageModels = shouldForceGemini
      ? ["gemini-3.1-flash-image-preview", "gemini-2.5-flash-image-preview"]
      : customImageModel
      ? [customImageModel, "gemini-3.1-flash-image-preview", "gemini-2.5-flash-image-preview"]
      : [
          "gemini-3.1-flash-image-preview",
          "gemini-2.5-flash-image-preview",
          "gemini-2.5-flash-image",
        ];

    let response: Response | null = null;
    let selectedModel: string | null = null;
    let lastErrorStatus: number | null = null;
    let lastErrorBody = "";

    for (const model of imageModels) {
      const attempt = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_AI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
        },
        PROVIDER_TIMEOUT_MS,
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
    const isTimeout = e instanceof DOMException && e.name === "AbortError";
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: isTimeout ? 504 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
