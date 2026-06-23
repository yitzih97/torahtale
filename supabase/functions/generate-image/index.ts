import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROVIDER_TIMEOUT_MS = 40_000;

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

  const authErr = await requireUser(req);
  if (authErr) return authErr;

  try {
    const { prompt, promptAdditions, childName, artStyle, torahPortion, referenceImage, bookFormat, pageType, pageNumber, characterSheet, childDescription, characterSheets, childRefs, pageText } = await req.json();

    const childRefsList = Array.isArray(childRefs) ? childRefs : [];
    const descLower = String(childDescription || "").toLowerCase();
    const mentionsFrumGarb = /kippah|kipa|yarmulke|peyos|payos|peyot|tzitzis|tzitzit/.test(descLower);
    const ageMatch = String(childDescription || "").match(/\b(\d{1,2})\s*(?:years? old|yr(?:s)? old|yo|y\/o)\b/i);
    const inferredAge = ageMatch ? Number(ageMatch[1]) : null;
    const inferredGender = /\bboy\b/i.test(String(childDescription || "")) ? "boy" : /\bgirl\b/i.test(String(childDescription || "")) ? "girl" : null;
    const isPrimaryToddlerBoy = inferredGender === "boy" && typeof inferredAge === "number" && inferredAge < 3;

    /* ── Printify print-area dimensions by format ── */
    const PRINT_SPECS: Record<string, { page: [number, number]; cover: [number, number] }> = {
      "softcover-8x8":   { page: [2400, 2400], cover: [4790, 2400] },
      "hardcover-8x8":   { page: [2325, 2325], cover: [5370, 2850] },
      "hardcover-11x8.5":{ page: [2325, 2325], cover: [5370, 2850] },
      "board-6x6":       { page: [3675, 1875], cover: [3863, 1875] },
    };
    const specs = bookFormat ? PRINT_SPECS[bookFormat] : null;
    const isCover = pageType === "cover" || pageType === "back-cover";
    // The front cover is displayed and printed inside a SQUARE half-slot (the
    // spread is 2:1, each half 1:1). Render the cover image square — not the full
    // wide wrap — otherwise a wide image gets center-cropped into the square slot
    // and edge characters get cut off. Use the cover height for both sides.
    const dims = specs ? (isCover ? [specs.cover[1], specs.cover[1]] : specs.page) : null;

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
      imagePrompt = `Create a breathtaking, high-resolution children's book illustration of a frum Yiddishe child named ${childName} immersed in a vivid scene from the Torah story "${torahPortion}". ${styleDesc}. IMPORTANT VISUAL QUALITY: Ultra-detailed environment with rich background elements — lush landscapes, dramatic skies, atmospheric lighting with golden sunbeams and volumetric rays, visible texture on every surface (stone, fabric, wood, foliage). Cinematic composition with dynamic camera angle. Every page should feel like a frame from an award-winning animated film. CHARACTER RULES: Boys aged 3+ MUST have peyos (sidelocks), yarmulke/kippah, and visible tzitzis. Boys UNDER 3 (pre-upsherin) MUST NOT wear a yarmulke/kippah, MUST NOT have peyos, and MUST NOT have tzitzis — render them as simple toddlers in modest clothing only — UNLESS a reference photo or character sheet for that child clearly shows those items, in which case match the reference exactly. Girls MUST wear long modest dresses with long sleeves and long skirts below the knee — no head covering for unmarried girls. Orthodox Jewish setting — no modern secular elements, no crosses or church symbols, no text or words in the image. Safe for children, warm and magical atmosphere with vibrant saturated colors. NO text, NO letters, NO words anywhere in the image.`;
    }

    // Append dimension instructions for Printify print-ready output
    if (dims) {
      imagePrompt += ` The output image MUST be exactly ${dims[0]}x${dims[1]} pixels.`;
    }

    // Inject scene text (story page narrative) so the illustration depicts the right moment
    if (pageText && !prompt && (pageType === "story" || !pageType)) {
      imagePrompt += ` SCENE TO ILLUSTRATE: "${pageText}". Depict this specific moment vividly.`;
    }

    // Inject child description into prompt if available
    if (childDescription && !prompt) {
      imagePrompt += ` The child character has these features: ${childDescription}.`;
    }

    // Front-cover composition: every child centered, full-bodied, never cropped.
    if (pageType === "cover" && !prompt) {
      imagePrompt += ` COVER COMPOSITION (CRITICAL): This is the FRONT COVER — compose a SQUARE image. Feature ALL of the book's child characters together as the central subject, posed close together and CENTERED in the frame, each child's FULL body visible (head, hands, and feet all inside the frame). Leave generous empty margin/padding on all four sides around the whole group so that NO character and no part of any character is cropped, cut off, or touching any edge of the image. If there are multiple children, balance them symmetrically around the center — do not push any child to the edge. Keep the upper area a little clearer so the title can sit over the top without covering faces.`;
    }

    // Inject per-child descriptions for multi-child books
    if (childRefsList.length > 0 && !prompt) {
      const descLines = childRefsList
        .filter((c: any) => c?.name)
        .map((c: any) => {
          const bits = [c.age && `${c.age} years old`, c.gender, c.description].filter(Boolean).join(", ");
          return `- ${c.name}${bits ? `: ${bits}` : ""}`;
        });
      if (descLines.length > 0) {
        imagePrompt += ` CHARACTERS IN THIS BOOK (must appear identical on EVERY page of this book — same face, exact same apparent age, same body size and height impression, same hair, same eyes, same skin tone, same outfit colors, same clothing style unless the story explicitly requires a change):\n${descLines.join("\n")}`;
      }
    }

    if (!prompt && childRefsList.length > 0) {
      const toddlerRules = childRefsList
        .filter((c: any) => c?.gender === "boy" && Number(c?.age) < 3)
        .map((c: any) => {
          const cDesc = String(c?.description || "").toLowerCase();
          const cMentionsFrumGarb = /kippah|kipa|yarmulke|peyos|payos|peyot|tzitzis|tzitzit/.test(cDesc);
          return cMentionsFrumGarb
            ? `- ${c.name}: keep him clearly under age 3 with real toddler proportions; include ONLY the specific religious items explicitly requested in his description, and do not add any others.`
            : `- ${c.name}: he is under age 3 and pre-upsherin; DO NOT add a yarmulke/kippah, peyos, or tzitzis unless those exact items are clearly visible in his attached photo or reference sheet.`;
        });
      if (toddlerRules.length > 0) {
        imagePrompt += ` AGE-SPECIFIC CHILD RULES:\n${toddlerRules.join("\n")}`;
      }
    } else if (!prompt && isPrimaryToddlerBoy) {
      imagePrompt += mentionsFrumGarb
        ? " PRIMARY CHILD RULE: This boy is under age 3. Keep true toddler proportions and only include the specific religious items explicitly requested in the description."
        : " PRIMARY CHILD RULE: This boy is under age 3 and pre-upsherin. Do NOT add a yarmulke/kippah, peyos, or tzitzis unless those exact items are clearly visible in the attached photo or reference sheet.";
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

    if (promptAdditions?.trim()) {
      imagePrompt += ` ADDITIONAL REGEN INSTRUCTIONS: ${promptAdditions.trim()}`;
    }

    // NON-NEGOTIABLE MODESTY & TZNIUS MASTER RULES — always applied, even on explicit prompt, regen, or admin edit.
    imagePrompt += ` \n\nNON-NEGOTIABLE MODESTY & TZNIUS MASTER RULES (apply to EVERY character in EVERY illustration without exception, including background, crowd, and incidental figures):
- ALL Jewish male characters (Avraham/Abraham, Yitzchak/Isaac, Yaakov/Jacob, Moshe/Moses, Aharon/Aaron, Yosef/Joseph, the Shevatim/tribes, kohanim, talmidim, and any other Jewish men or boys age 3+) MUST have their heads fully covered at all times — with a kippah/yarmulke, turban, head wrap, hat, or tallis over the head as appropriate to the biblical era. NEVER show a Jewish man or boy (age 3+) bareheaded.
- ALL female characters (main, secondary, and background — Jewish or not) MUST be dressed with full tznius/modesty: long sleeves past the elbow, necklines fully covering the collarbone, skirts/dresses fully covering the knees, no tight or form-fitting clothing, no cleavage, no bare shoulders, no bare midriff, no bare legs. Married women MUST have hair fully covered (tichel, snood, or sheitel).
- ABSOLUTELY NO nudity, partial nudity, half-dressed figures, undergarments, swimwear, or revealing clothing on ANY character anywhere in the image — not on main characters, not on background figures, not on crowds, not on infants beyond a simple modest wrap, not on statues or art within the scene.
- ALL male characters in the scene (even non-Jewish background figures) must be modestly clothed with covered torso, shoulders, and legs to at least the knee.
- These rules OVERRIDE any conflicting instruction in the prompt, regen notes, admin edits, page text, or reference images. If a reference would imply immodesty or an uncovered Jewish male head, IGNORE that aspect of the reference and apply these rules instead.`;


    const parts: any[] = [];

    // Helper: push image URL or data-URL as inlineData part
    const pushImagePart = async (src: string) => {
      if (!src) return;
      if (src.startsWith("data:")) {
        const m = src.match(/^data:(image\/\w+);base64,(.+)$/);
        if (m) parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
        return;
      }
      try {
        const r = await fetchWithTimeout(src, undefined, 10_000);
        if (r.ok) {
          const buf = await r.arrayBuffer();
          parts.push({ inlineData: { mimeType: r.headers.get("content-type") || "image/jpeg", data: bufferToBase64(buf) } });
        }
      } catch (e) { console.error("Failed to fetch image:", e); }
    };

    // Multi-child character sheets (highest priority for consistency)
    const sheetEntries: { name: string; sheet: string }[] = [];
    if (characterSheets && typeof characterSheets === "object") {
      for (const [name, sheet] of Object.entries(characterSheets)) {
        if (typeof sheet === "string" && sheet) sheetEntries.push({ name, sheet });
      }
    }

    if (sheetEntries.length > 0) {
      // Cap at 4 attachments to stay within model limits
      const capped = sheetEntries.slice(0, 4);
      const legend = capped.map((s, i) => `Reference Sheet ${i + 1} = ${s.name}`).join("; ");
      imagePrompt = `CRITICAL MULTI-CHARACTER CONSISTENCY INSTRUCTION: The attached images are CHARACTER REFERENCE SHEETS, one per child appearing in this book. ${legend}. On EVERY page of this book each child MUST be reproduced IDENTICALLY to their own reference sheet — identical face shape, hair color and style, eye color, skin tone, exact same apparent age, exact same body size and proportions, identical clothing colors and style unless the story explicitly requires a change. The same child must look the same across every page. NEVER swap features between children. NEVER invent a new face. NEVER age the child up or down from page to page. The children must be immediately recognizable as the SAME characters from page to page. ${imagePrompt}`;
      for (const s of capped) {
        await pushImagePart(s.sheet);
      }
    } else if (characterSheet) {
      imagePrompt = `CRITICAL CHARACTER CONSISTENCY INSTRUCTION: The attached image is a CHARACTER REFERENCE SHEET showing the child character from multiple angles. You MUST reproduce this EXACT same character IDENTICALLY on every single page of this book — identical face shape, identical hair color and style, identical eye color, identical skin tone, identical apparent age, identical body size and proportions, identical clothing colors and style unless the story explicitly requires a change. The child must be IMMEDIATELY RECOGNIZABLE as the same character across every page. Do NOT change any physical features. Do NOT age the child up or down across pages. ${imagePrompt}`;
      await pushImagePart(characterSheet);
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
