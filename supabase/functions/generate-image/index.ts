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
  const token = authHeader.replace("Bearer ", "");
  // Internal server-to-server calls (the generate-book orchestrator) authenticate
  // with the service-role key instead of a user JWT — accept it as authorized.
  const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (svcKey && token === svcKey) return null;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await supabase.auth.getClaims(token);
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
    const { prompt, promptAdditions, childName, age, artStyle, torahPortion, referenceImage, bookFormat, pageType, pageNumber, characterSheet, childDescription, characterSheets, childRefs, pageText } = await req.json();

    const childRefsList = Array.isArray(childRefs) ? childRefs : [];
    const descLower = String(childDescription || "").toLowerCase();
    const mentionsFrumGarb = /kippah|kipa|yarmulke|peyos|payos|peyot|tzitzis|tzitzit/.test(descLower);
    const ageMatch = String(childDescription || "").match(/\b(\d{1,2})\s*(?:years? old|yr(?:s)? old|yo|y\/o)\b/i);
    const inferredAge = ageMatch ? Number(ageMatch[1]) : null;
    const inferredGender = /\bboy\b/i.test(String(childDescription || "")) ? "boy" : /\bgirl\b/i.test(String(childDescription || "")) ? "girl" : null;
    const isPrimaryToddlerBoy = inferredGender === "boy" && typeof inferredAge === "number" && inferredAge < 3;

    /* ── Printify print-area dimensions by format ── */
    const PRINT_SPECS: Record<string, { page: [number, number]; cover: [number, number] }> = {
      "softcover-8x8":   { page: [2400, 2400], cover: [4790, 2400] }, // 8×8
      "hardcover-8x8":   { page: [2325, 2325], cover: [5370, 2850] }, // 8×8 (only hardcover size)
      "board-6x6":       { page: [3675, 1875], cover: [3863, 1875] }, // 6×6
      "coloring-8.5x11": { page: [2550, 3300], cover: [2550, 3300] }, // 8.5×11 line-art coloring book

    };
    const specs = bookFormat ? PRINT_SPECS[bookFormat] : null;
    const isCover = pageType === "cover" || pageType === "back-cover";
    // Board books (6×6) are SPREAD-based — one wide illustration per open spread
    // (board-6x6 page spec is already ~2:1). Softcover/Hardcover (8×8) are
    // PAGE-based — one square illustration per single page. The front cover is a
    // square front-cover image either way (the back cover is composited
    // separately). So just use the format's own page/cover spec.
    const isSpreadFormat = (bookFormat || "").startsWith("board");
    const dims = specs
      ? (isCover ? [specs.cover[1], specs.cover[1]] : specs.page)
      : null;

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
      // Service-role key: prompts/ai/book-templates are admin-only under RLS, so an
      // anon-key read returns [] and custom prompts/models would silently never apply.
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
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
      realistic: "a REAL photograph — photorealistic, indistinguishable from a real photo taken on a full-frame DSLR with an 85mm lens; true-to-life skin texture, pores and hair detail, natural soft lighting, realistic depth of field and bokeh, lifelike proportions and natural colors. NOT a painting, NOT an illustration, NOT cartoon, NOT 3D-rendered, NOT stylized — an actual photograph.",
      "graphic-novel": "graphic novel illustration with bold confident ink linework, dramatic dynamic composition with cinematic camera angles, rich flat color palette with halftone textures and cross-hatching details, high contrast lighting with deep shadows, premium print-quality detail",
    };

    // Standalone coloring book: render clean black-and-white line art instead of
    // the full-color illustration style.
    const isColoring = (bookFormat || "").startsWith("coloring");
    const coloringStyle = "clean black-and-white line-art coloring-book page: bold, smooth, evenly-weighted black outlines on a pure white background, NO color, NO grayscale shading, NO fills, NO gradients, generous open white areas for a child to color in, simple and friendly shapes, thick clear contours";
    const styleDesc = isColoring ? coloringStyle : (styleMap[artStyle] || styleMap.cartoon);

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

    // Interior illustrations leave a calm, low-detail area for story text to be
    // overlaid (hero-style). Board books are wide 2:1 spreads; 8×8 books are
    // single square pages — compose each accordingly.
    if (!isCover && !prompt) {
      imagePrompt += isColoring
        ? ` COMPOSITION: This is a single 8.5×11 PORTRAIT coloring-book page. Fill the page with a clear, friendly black-and-white line drawing of the scene for a child to color — bold clean outlines only, pure white background, NO color, NO shading, NO grey, NO fills. Keep details simple and the shapes large and open. Absolutely NO text, letters, or words in the image.`
        : isSpreadFormat
        ? ` COMPOSITION: This is a wide 2:1 two-page spread illustration. Arrange it as a cinematic scene with the main character(s) toward the lower portion and one side of the frame, leaving a generous calm area of open sky or soft, uncluttered negative space across the top and the opposite side so a short paragraph of story text can be overlaid there and stay easy to read. Do NOT center the subject so tightly that there is no breathing room. Absolutely NO text, letters, or words in the image.`
        : ` COMPOSITION: This is a single SQUARE page illustration. Arrange it with the main character(s) toward the lower/center of the frame, leaving a calm area of open sky or soft, uncluttered negative space across the top so a few lines of story text can be overlaid there and stay easy to read. Absolutely NO text, letters, or words in the image.`;
    }

    // Inject scene text (story page narrative) so the illustration depicts the right moment
    if (pageText && !prompt && (pageType === "story" || !pageType)) {
      imagePrompt += ` SCENE TO ILLUSTRATE: "${pageText}". Depict this specific moment vividly.`;
    }

    // Inject child description into prompt if available
    if (childDescription && !prompt) {
      imagePrompt += ` The child character has these features: ${childDescription}.`;
    }

    // Forceful age accuracy — image models tend to render children too young, and
    // the base prompt states no age at all, so state the EXACT age explicitly.
    if (!prompt) {
      const agedRefs = childRefsList.filter((c: any) => c?.name && c?.age);
      const primaryAge = age ?? childRefsList[0]?.age ?? inferredAge;
      const ageStatement = agedRefs.length > 0
        ? agedRefs.map((c: any) => `${c.name} is EXACTLY ${c.age} years old`).join("; ")
        : (primaryAge ? `${childName || "The child"} is EXACTLY ${primaryAge} years old` : "");
      if (ageStatement) {
        imagePrompt += ` CRITICAL AGE ACCURACY (do NOT ignore): ${ageStatement}. Render each child with the facial maturity, facial structure, head-to-body proportions, and height of their EXACT stated age — a 12–14 year old must look like a young teenager, a 7–9 year old like a child, a 3–5 year old like a small child. Do NOT default to a generic young child. The apparent age MUST match the stated age on every page.`;
      }
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
        imagePrompt += ` CHARACTERS IN THIS BOOK — each child below is a DISTINCT individual who must look like the SAME person on EVERY page (same face, hair, eyes, skin tone and outfit colours across pages), reproduced from their own reference image. CRITICAL RELATIVE SIZING: show the children at realistic sizes FOR THEIR AGES — a younger child is clearly SHORTER and SMALLER than an older child (a 1-year-old is much smaller than a 3-year-old; a toddler is much smaller than a 10-year-old). NEVER make a younger child the same size as, or bigger than, an older sibling. Match each child's facial maturity to their exact age:\n${descLines.join("\n")}`;
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

    // NON-NEGOTIABLE CHARACTER PLACEMENT & WARDROBE RULES — always applied, even on explicit prompt, regen, or admin edit.
    imagePrompt += ` \n\nNON-NEGOTIABLE CHARACTER PLACEMENT & WARDROBE RULES (apply to EVERY illustration without exception):
- Each named child character must appear EXACTLY ONCE in the image. NEVER duplicate, clone, mirror, twin, or repeat the same child anywhere in the scene — not in the foreground, not in the background, not as a reflection, not as a second copy. One child = one single figure on the page.
- A child's clothing comes ONLY from the story scene, the character reference sheet, and the modesty rules above. DO NOT copy the clothing, outfit, colors, prints, logos, brand marks, or accessories from any attached real-life PHOTOGRAPH of the child — a photograph is a guide to the child's FACE and HAIR ONLY, never to their wardrobe.`;


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

    // ── Attach ONE reference image PER CHILD. Prefer the child's REAL PHOTO (the
    // best likeness anchor); fall back to their character sheet. Attaching each
    // child's OWN photo — not just the primary's — keeps every sibling on-model
    // (previously only the primary photo was sent, so secondary children drifted).
    // The character sheet is a lossy gpt-image reinterpretation, so the real photo
    // takes priority whenever both exist.
    const refChildren: any[] = childRefsList.length > 0
      ? childRefsList
      : [{ name: childName, photoUrl: null, characterSheet }];
    const sheetMap: Record<string, string> = (characterSheets && typeof characterSheets === "object")
      ? (characterSheets as Record<string, string>) : {};
    const refItems: { name: string; src: string; isPhoto: boolean }[] = [];
    for (const c of refChildren) {
      const isSingle = refChildren.length === 1;
      const photo = c?.photoUrl || (isSingle && typeof referenceImage === "string" ? referenceImage : null);
      const sheet = c?.characterSheet || sheetMap[c?.name] || (isSingle ? characterSheet : null);
      const src = photo || sheet;
      if (typeof src === "string" && src) {
        refItems.push({ name: c?.name || childName || "the child", src, isPhoto: !!photo });
      }
    }
    const cappedRefs = refItems.slice(0, 4); // stay within model attachment limits
    if (cappedRefs.length > 0) {
      const legend = cappedRefs
        .map((r, i) => `Image ${i + 1} = ${r.name}${r.isPhoto ? " (a REAL PHOTO of this child — match their exact face shape, eye colour and shape, eyebrows, skin tone, and hair)" : " (a character reference sheet for this child)"}`)
        .join("; ");
      imagePrompt = `CRITICAL CHILD LIKENESS & CONSISTENCY (do NOT ignore): The attached image(s) are references for the child character(s) in this book. ${legend}. You MUST reproduce EACH child's face, hair, eye colour and skin tone faithfully from THEIR OWN reference, translated into the chosen art style, so each child is IMMEDIATELY and unmistakably recognizable as that same real child on EVERY page. NEVER invent a generic face and NEVER swap features between children. When a reference is a real photograph, use it for the child's FACE and HAIR ONLY — do NOT copy the clothing, outfit, colours, prints, logos or accessories from the photo (dress each child per the story scene and the modesty rules below). Keep each child's look identical across all pages. ${imagePrompt}`;
      for (const r of cappedRefs) await pushImagePart(r.src);
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

    // Upscale a base64 PNG toward print resolution. Fully guarded (dynamic
    // import + try/catch) so generation never breaks if it fails.
    const upscaleForPrint = async (b64: string): Promise<string> => {
      const targetMax = dims ? Math.max(dims[0], dims[1]) : null;
      if (!targetMax) return b64;
      try {
        const { Image } = await import("https://deno.land/x/imagescript@1.2.17/mod.ts");
        const img = await Image.decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
        const curMax = Math.max(img.width, img.height);
        if (curMax >= targetMax) return b64;
        const scale = targetMax / curMax;
        img.resize(Math.round(img.width * scale), Math.round(img.height * scale));
        const out = await img.encode();
        return bufferToBase64(out.buffer);
      } catch (e) {
        console.error("upscaleForPrint failed (returning original):", e);
        return b64;
      }
    };

    // ============= OPENAI GPT IMAGE (primary) =============
    // GPT Image is the primary generator now — including when a child photo is
    // attached (it goes through images/edits for likeness). "medium" quality so
    // a full 20-page auto-generation still fits the edge time budget. Falls back
    // to Gemini below if OpenAI is unavailable or errors.
    const requestedImageModel = customImageModel || "gpt-image-2";
    const isOpenAI = /^(gpt-image|dall-e)/i.test(requestedImageModel);
    if (isOpenAI) {
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      if (OPENAI_API_KEY) {
        try {
          const imageBlobs: { blob: Blob; name: string }[] = [];
          for (const p of parts) {
            if (p.inlineData) {
              const bin = Uint8Array.from(atob(p.inlineData.data), (c) => c.charCodeAt(0));
              const ext = (p.inlineData.mimeType || "image/png").split("/")[1] || "png";
              imageBlobs.push({ blob: new Blob([bin], { type: p.inlineData.mimeType }), name: `ref-${imageBlobs.length}.${ext}` });
            }
          }
          const size = "1024x1024"; // square pages; upscaled for print after
          let openaiResp: Response;
          if (imageBlobs.length > 0) {
            const fd = new FormData();
            fd.append("model", requestedImageModel);
            fd.append("prompt", imagePrompt);
            fd.append("size", size);
            fd.append("quality", "medium");
            fd.append("output_format", "jpeg"); // small JPEG straight from the model — no in-edge re-encoding
            fd.append("output_compression", "80");
            fd.append("n", "1");
            for (const ib of imageBlobs) fd.append("image[]", ib.blob, ib.name);
            openaiResp = await fetchWithTimeout("https://api.openai.com/v1/images/edits", {
              method: "POST",
              headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
              body: fd,
            }, 90_000);
          } else {
            openaiResp = await fetchWithTimeout("https://api.openai.com/v1/images/generations", {
              method: "POST",
              headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({ model: requestedImageModel, prompt: imagePrompt, size, quality: "medium", output_format: "jpeg", output_compression: 80, n: 1 }),
            }, 90_000);
          }
          if (openaiResp.ok) {
            const oData = await openaiResp.json();
            const b64 = oData.data?.[0]?.b64_json;
            if (b64) {
              console.log(`OpenAI image generation using model: ${requestedImageModel}`);
              // Return the model image as-is. Do NOT upscale in-edge: decoding +
              // resizing the image with ImageScript exceeds the edge CPU/memory
              // budget on gpt-image-2's larger output, and the runtime kills the
              // worker with a 546 WORKER_RESOURCE_LIMIT (not a catchable error) —
              // which is what was leaving pages blank. Any print-resolution
              // upscaling must happen off-edge (client-side / at submit time).
              return new Response(JSON.stringify({ imageUrl: `data:image/jpeg;base64,${b64}` }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
            console.error("OpenAI returned no image — falling back to Gemini.");
          } else {
            const errTxt = await openaiResp.text();
            console.error(`OpenAI ${requestedImageModel} error ${openaiResp.status}: ${errTxt.slice(0, 200)} — falling back to Gemini.`);
          }
        } catch (e) {
          console.error("OpenAI image generation threw — falling back to Gemini:", e);
        }
      } else {
        console.warn("OPENAI_API_KEY not configured — falling back to Gemini.");
      }
    }
    // ============= END OPENAI; fall through to Gemini fallback =============

    const imageModels = (customImageModel && !isOpenAI)
      ? [customImageModel, "gemini-3.1-flash-image-preview", "gemini-3.1-flash-image"]
      : [
          "gemini-3.1-flash-image-preview",
          "gemini-3.1-flash-image",
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
