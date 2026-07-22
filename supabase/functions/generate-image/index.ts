import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROVIDER_TIMEOUT_MS = 40_000;
// Image GENERATION calls get a much longer leash: 2K renders with several
// reference images attached routinely take 40-80s, and aborting them at 40s was
// the top cause of "failed pages" (both Gemini models "timed out" per book).
const IMAGE_GEN_TIMEOUT_MS = 90_000;

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

// Upload a base64 data URL to the book-images bucket and return its public URL,
// so the generated image lives in object storage instead of being stored as a
// multi-MB base64 blob inside the books row. Fail-open: on any error, return the
// original data URL so image generation never breaks because of storage.
async function uploadImageToStorage(dataUrl: string, pathPrefix: string): Promise<string> {
  try {
    if (!dataUrl.startsWith("data:")) return dataUrl; // already a URL
    const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return dataUrl;
    const mimeType = m[1];
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
    // Deterministic-enough unique name without Math.random (blocked in some runtimes).
    const rnd = crypto.randomUUID();
    const filePath = `${pathPrefix}/${rnd}.${ext}`;
    const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!svcKey) return dataUrl;
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, svcKey);
    const { error } = await admin.storage
      .from("book-images")
      .upload(filePath, bytes, { contentType: mimeType, upsert: true });
    if (error) {
      console.error("book-images upload failed (keeping data URL):", error.message);
      return dataUrl;
    }
    const { data: urlData } = admin.storage.from("book-images").getPublicUrl(filePath);
    return urlData?.publicUrl || dataUrl;
  } catch (e) {
    console.error("uploadImageToStorage threw (keeping data URL):", e);
    return dataUrl;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authErr = await requireUser(req);
  if (authErr) return authErr;

  try {
    const { prompt, promptAdditions, childName, age, artStyle, torahPortion, referenceImage, bookFormat, pageType, pageNumber, characterSheet, childDescription, characterSheets, childRefs, pageText, bookId, storyCharacterRefs, outfitVariant } = await req.json();

    // GLOBAL REQUEST BUDGET: Supabase's gateway kills any function that hasn't
    // responded within ~150s and returns a CORS-less gateway error the browser
    // can't even read. Every long operation below (model attempts, safety
    // escalations, QA re-rolls) draws from this one budget so we ALWAYS answer
    // — with an image or a real error — before the gateway cuts us off.
    const requestStartedAt = Date.now();
    const REQUEST_BUDGET_MS = 130_000;
    const remainingMs = () => REQUEST_BUDGET_MS - (Date.now() - requestStartedAt);

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
    const isColoringFmt = (bookFormat || "").startsWith("coloring");
    const dims = specs
      // Bound 8×8/board covers are a SQUARE front-cover image (back composited
      // separately). The coloring book has a single 8.5×11 PORTRAIT front cover.
      ? (isCover ? (isColoringFmt ? specs.cover : [specs.cover[1], specs.cover[1]]) : specs.page)
      : null;

    // ASPECT RATIO — request it from the model, not just as a text hint. Gemini
    // only accepts a fixed set of ratios, so snap the target dims to the nearest
    // one; the canvas crops the small remainder to the exact print size. Without
    // this the model returned whatever framing it liked (often square), so a
    // regenerated board spread came back square while its siblings were wide —
    // the "ratios don't match after regenerate" bug. A single source of truth
    // per format means EVERY page (first pass or retry) gets the same framing.
    const ASPECTS: [string, number][] = [
      ["1:1", 1], ["4:5", 0.8], ["3:4", 0.75], ["2:3", 2 / 3], ["9:16", 0.5625],
      ["5:4", 1.25], ["4:3", 4 / 3], ["3:2", 1.5], ["16:9", 16 / 9], ["21:9", 21 / 9],
    ];
    const aspectRatio = dims
      ? ASPECTS.reduce((best, o) => Math.abs(o[1] - dims[0] / dims[1]) < Math.abs(best[1] - dims[0] / dims[1]) ? o : best)[0]
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

    // Standalone coloring book: the COVER is a normal full-color illustration
    // (attractive on the shelf), but every INTERIOR page is clean black-and-white
    // line art the child colors in. So line art applies to non-cover pages only.
    const isColoring = (bookFormat || "").startsWith("coloring");
    const isColoringPage = isColoring && !isCover;
    const coloringStyle = "clean, elegant black-and-white line-art coloring-book page, in the style of a professionally published children's coloring book. PURE BLACK outlines on a PURE WHITE background. This MUST be LOW-INK and genuinely easy to color: use clean, smooth, evenly-weighted OUTLINES only, with generous OPEN WHITE space inside every shape and across the page. Absolutely NO shading, NO cross-hatching, NO hatching, NO stippling, NO dotted or scribbled textures, NO gray tones, NO solid black fills, NO blacked-in or filled areas, NO dark, night, or heavily-detailed ink-heavy backgrounds — every region (hair, clothing, skin, sky, ground, objects) is left OPEN and WHITE inside for a child to color. Suggest form with a few confident contour lines rather than dense detail; the finished page should read as mostly white paper with tasteful, uncluttered black outlines. CRITICAL: draw EVERYTHING as open white outlines, INCLUDING items that are normally dark — boots, shoes, sandals, hats, belts, hair, and dark clothing (pants, coats) must be OUTLINED and left WHITE inside, NEVER filled in black or solid. There must be zero solid-black or filled-in areas anywhere on the page.";
    const styleDesc = isColoringPage ? coloringStyle : (styleMap[artStyle] || styleMap.cartoon);

    // Short human-readable name for the chosen style, used in the style-lock
    // clause below.
    const styleNameMap: Record<string, string> = {
      cartoon: "hand-painted cartoon illustration",
      "3d-pixar": "3D Pixar/DreamWorks-style CGI render",
      realistic: "photograph",
      "graphic-novel": "graphic-novel illustration",
    };
    const styleName = isColoringPage ? "black-and-white line-art coloring page" : (styleNameMap[artStyle] || styleNameMap.cartoon);

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
      imagePrompt = `Create a breathtaking, high-resolution children's book illustration of a Jewish child named ${childName} immersed in a vivid scene from the Torah story "${torahPortion}". ${styleDesc}. IMPORTANT VISUAL QUALITY: Ultra-detailed environment with rich background elements — lush landscapes, dramatic skies, atmospheric lighting with golden sunbeams and volumetric rays, visible texture on every surface (stone, fabric, wood, foliage). Cinematic composition with dynamic camera angle. Every page should feel like a frame from an award-winning animated film. CHARACTER RULES (match the REAL child): every star child must be immediately recognizable as the child in their reference photo/character sheet — same face shape, same hair color and style, and the same EXACT skin tone (NEVER lighten or darken a child's complexion; a darker-skinned child stays exactly as dark as their photo shows). Do NOT add a yarmulke/kippah, peyos (sidelocks), or tzitzis to ANY star child unless those exact items are clearly visible in their reference photo/character sheet or explicitly requested in their description — a boy whose photo shows no peyos has NO peyos in the book, and a boy whose photo shows no kippah has NO kippah. Girls MUST wear long modest dresses with long sleeves and long skirts below the knee — no head covering for unmarried girls. Orthodox Jewish setting — no modern secular elements, no crosses or church symbols, no text or words in the image. Safe for children, warm and magical atmosphere with vibrant saturated colors. NO text, NO letters, NO words anywhere in the image.`;
    }

    // Append dimension instructions for Printify print-ready output
    if (dims) {
      imagePrompt += ` The output image MUST be exactly ${dims[0]}x${dims[1]} pixels.`;
    }

    // Interior illustrations leave a calm, low-detail area for story text to be
    // overlaid (hero-style). Board books are wide 2:1 spreads; 8×8 books are
    // single square pages — compose each accordingly.
    if (!isCover && !prompt) {
      imagePrompt += isColoringPage
        ? ` COMPOSITION: This is a single 8.5×11 PORTRAIT coloring-book page. Draw the scene as CLEAN black OUTLINE line art on a mostly-white page — outlines only, with large OPEN white areas for a child to color. You may include a simple, uncluttered background (a few key setting elements), but keep it airy and light: NO shading, NO hatching, NO stippling, NO solid black fills, NO blacked-in shapes, NO dark or night skies, NO dense textures or busy patterns that would waste ink. Every shape — hair, clothing, skin, sky, ground, props — is an EMPTY white outline. Items that are normally dark (boots, shoes, hats, belts, hair, dark pants or coats) must ALSO be drawn as OUTLINES left WHITE inside — NEVER filled solid black. There must be zero filled-in or solid-black areas. Favor fewer, cleaner lines over heavy detail. Absolutely NO text, letters, or words in the image.`
        : isSpreadFormat
        ? ` COMPOSITION: This is a wide 2:1 two-page spread illustration painted as ONE SINGLE CONTINUOUS SCENE — one sky, one horizon, one consistent lighting direction from the top edge to the bottom edge. Arrange it as a cinematic scene with the main character(s) toward the lower portion and one side of the frame, leaving a generous calm area of open sky or soft, uncluttered negative space across the top and the opposite side so a short paragraph of story text can be overlaid there and stay easy to read. Do NOT center the subject so tightly that there is no breathing room. The calm areas must be fully painted parts of the SAME scene (its own open sky, soft landscape) with the same palette and lighting — never an empty strip, solid bar, blank panel, or a SECOND sky pasted along an edge; there must be NO horizontal seam or visible line where the top of the image meets the rest — clouds, light, and color must flow continuously from the very top edge down into the scene. Absolutely NO text, letters, or words in the image.`
        : ` COMPOSITION: This is a single SQUARE page illustration and it must be FULL-BLEED: ONE SINGLE CONTINUOUS painted scene filling the entire square edge-to-edge, composed in one pass with ONE sky, ONE horizon, and ONE consistent lighting direction. NEVER paint a separate strip, solid-color bar, blank panel, frame, border, or a SECOND sky at the top or bottom — there must be NO horizontal seam, edge, or visible line where the upper part of the image looks attached or pasted onto the scene below; clouds, light, and colors must flow continuously and seamlessly from the very top edge down into the scene. Compose the scene so its OWN natural upper portion is calm and quiet (the scene's sky with soft clouds, gentle light rays, or distant landscape — same palette, lighting, and texture as everything below, just lower-detail, with no faces or story details up there). Keep all characters and action in the middle and lower portions of the frame. A few lines of story text will later be overlaid on that calm upper area, so it must genuinely be part of the SAME scene — never a bar, box, or panel. Absolutely NO text, letters, or words in the image.`;
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
      // age 0 (infant) is a real value — don't let truthiness checks drop it.
      const agedRefs = childRefsList.filter((c: any) => c?.name && c?.age != null && c?.age !== "");
      const primaryAge = age ?? childRefsList[0]?.age ?? inferredAge;
      const hasPrimaryAge = primaryAge != null && primaryAge !== "";
      const ageStatement = agedRefs.length > 0
        ? agedRefs.map((c: any) => `${c.name} is EXACTLY ${c.age} years old`).join("; ")
        : (hasPrimaryAge ? `${childName || "The child"} is EXACTLY ${primaryAge} years old` : "");
      if (ageStatement) {
        imagePrompt += ` CRITICAL AGE ACCURACY (do NOT ignore): ${ageStatement}. Render each child with the facial maturity, facial structure, head-to-body proportions, and height of their EXACT stated age — a 12–14 year old must look like a young teenager, a 7–9 year old like a child, a 3–5 year old like a small child. Do NOT default to a generic young child. The apparent age MUST match the stated age on every page.`;
      }
    }

    // Front-cover composition: every child centered, full-bodied, never cropped.
    if (pageType === "cover" && !prompt) {
      imagePrompt += ` COVER COMPOSITION (CRITICAL): This is the FRONT COVER — compose a ${isColoringFmt ? "TALL 8.5×11 PORTRAIT" : "SQUARE"} full-color image. Feature ALL of the book's child characters together as the central subject, posed close together and CENTERED in the frame, each child's FULL body visible (head, hands, and feet all inside the frame). Leave generous empty margin/padding on all four sides around the whole group so that NO character and no part of any character is cropped, cut off, or touching any edge of the image. If there are multiple children, balance them symmetrically around the center — do not push any child to the edge. COVER AGE ACCURACY (CRITICAL): render every child at their EXACT stated age with true proportions and height — the SAME ages and relative sizes as the interior pages. A 1-year-old is a small baby/toddler, clearly smaller than a 3-year-old. NEVER draw the children older, taller, or more mature on the cover than their stated ages. MAJESTIC ESSENCE (this is the COVER — make it unforgettable): capture the whole heart and wonder of "${torahPortion}" in ONE breathtaking, poetic, reverent image, like the cover of a treasured classic storybook. Weave the parsha's own iconic imagery — its signature landmark, setting, objects, and symbols — beautifully AROUND the children so a glance instantly says which parsha this is (e.g. Noach → the great wooden teivah, a radiant rainbow, pairs of animals, a returning dove; Bereishis → a glowing new world; Yetzias Mitzrayim → the split sea). Fill it with cinematic golden light, volumetric sunbeams, atmospheric depth, soft magical particles, and a sense of grandeur, awe, and kedushah — richly detailed, warm, and emotionally moving, never flat or generic. OVERLAY SPACE (composition): keep the TOP THIRD of the frame calm and open — its own luminous sky, soft clouds, gentle light, distant scenery, NO faces or busy detail there — and keep the very BOTTOM edge of the scene calm and simple as well; printed wording is added over those areas LATER by software, entirely outside this image. Place the children and main action in the middle-to-lower portion. Do NOT put anything important in the outer ~6% margin on any side (a decorative frame will sit there). ABSOLUTELY NO TEXT (CRITICAL): this image must be completely WORDLESS — do NOT paint any title, name, tagline, caption, letters, words, numbers, or writing of any kind anywhere in the image; no banners, ribbons, or signs bearing text.`;
    }

    // Intentional per-cover outfit change (back-cover "coming next" teasers cycle
    // through fresh outfits so the row looks varied and attractive). Identity is
    // preserved; ONLY the clothing changes, and it must stay modest.
    if (outfitVariant && !prompt) {
      imagePrompt += ` WARDROBE FOR THIS COVER (INTENTIONAL OUTFIT CHANGE): for THIS image only, dress the children in a fresh outfit instead of their usual one: ${outfitVariant}. Keep every child's face, hair color and style, eye color, skin tone, age, height, and identity EXACTLY as in their reference images — ONLY the clothing changes. All clothing must remain modest (tznius): long sleeves, high necklines, girls in long dresses or skirts (never pants), and NEVER a kippah or head covering on a girl.`;
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
      // Religious garb is PHOTO-DRIVEN for every star boy (not just toddlers):
      // a kippah/peyos/tzitzis appears only if his photo/sheet/description has it.
      const boyGarbRules = childRefsList
        .filter((c: any) => c?.gender === "boy")
        .map((c: any) => {
          const cDesc = String(c?.description || "").toLowerCase();
          const cMentionsFrumGarb = /kippah|kipa|yarmulke|peyos|payos|peyot|tzitzis|tzitzit/.test(cDesc);
          const under3 = Number(c?.age) < 3;
          return cMentionsFrumGarb
            ? `- ${c.name}: include ONLY the specific religious items explicitly requested in his description, and do not add any others.${under3 ? " Keep him clearly under age 3 with real toddler proportions." : ""}`
            : `- ${c.name}: DO NOT add a yarmulke/kippah, peyos, or tzitzis — none of these appear in his reference; draw him exactly as his photo/sheet shows.${under3 ? " Keep him clearly under age 3 with real toddler proportions." : ""}`;
        });
      if (boyGarbRules.length > 0) {
        imagePrompt += ` CHILD-SPECIFIC APPEARANCE RULES:\n${boyGarbRules.join("\n")}`;
      }
    } else if (!prompt && inferredGender === "boy") {
      imagePrompt += mentionsFrumGarb
        ? ` PRIMARY CHILD RULE: include ONLY the specific religious items explicitly requested in the description, and do not add any others.${isPrimaryToddlerBoy ? " He is under age 3 — keep true toddler proportions." : ""}`
        : ` PRIMARY CHILD RULE: DO NOT add a yarmulke/kippah, peyos, or tzitzis to this boy unless those exact items are clearly visible in the attached photo or reference sheet.${isPrimaryToddlerBoy ? " He is under age 3 — keep true toddler proportions." : ""}`;
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
- ALL Jewish male characters FROM THE TORAH NARRATIVE (Avraham/Abraham, Yitzchak/Isaac, Yaakov/Jacob, Moshe/Moses, Aharon/Aaron, Yosef/Joseph, the Shevatim/tribes, kohanim, talmidim, and any other Torah-story Jewish men or boys age 3+) MUST have their heads fully covered at all times — with a kippah/yarmulke, turban, head wrap, hat, or tallis over the head as appropriate to the biblical era. NEVER show a Torah-narrative Jewish man or boy (age 3+) bareheaded. EXCEPTION — the modern STAR CHILDREN (the named kids rendered from reference photos/character sheets) are NOT covered by this bullet: each star child wears ONLY what their own photo/sheet shows; NEVER add a kippah, head covering, peyos, or tzitzis to a star child who does not have them in their reference.
- ALL female characters (main, secondary, and background — Jewish or not) MUST be dressed with full tznius/modesty: long sleeves past the elbow, necklines fully covering the collarbone, skirts/dresses fully covering the knees, no tight or form-fitting clothing, no cleavage, no bare shoulders, no bare midriff, no bare legs. Married women MUST have hair fully covered (tichel, snood, or sheitel).
- ABSOLUTELY NO nudity, partial nudity, half-dressed figures, undergarments, swimwear, or revealing clothing on ANY character anywhere in the image — not on main characters, not on background figures, not on crowds, not on infants beyond a simple modest wrap, not on statues or art within the scene.
- ALL male characters in the scene (even non-Jewish background figures) must be modestly clothed with covered torso, shoulders, and legs to at least the knee. This includes giants, warriors, kings, and villains (Og, Golias, Paroh, soldiers, guards): ALWAYS fully dressed with a shirt/tunic covering the chest and torso — NEVER bare-chested, NEVER shirtless, NEVER open-robed.
- CLEAR BNEI YISRAEL / NON-JEW DISTINCTION: Jewish/Bnei Yisrael men and boys (age 3+) always have covered heads (yarmulke, turban, head wrap, or tallis). NON-Jewish characters (Mitzrim/Egyptians, Edomim, Moavim, Amalek, Romans, and all other nations) must NOT wear a yarmulke, tallis, tzitzis, or peyos — give them clearly different, era-appropriate foreign dress (still fully modest) with uncovered or distinctly foreign head coverings, so a child can tell at a glance who is from Bnei Yisrael and who is not.
- These rules OVERRIDE any conflicting instruction in the prompt, regen notes, admin edits, page text, or reference images. If a reference would imply immodesty or an uncovered Jewish male head, IGNORE that aspect of the reference and apply these rules instead.`;

    // NON-NEGOTIABLE CHARACTER PLACEMENT & WARDROBE RULES — always applied, even on explicit prompt, regen, or admin edit.
    imagePrompt += ` \n\nNON-NEGOTIABLE CHARACTER PLACEMENT & WARDROBE RULES (apply to EVERY illustration without exception):
- Each named child character must appear EXACTLY ONCE in the image. NEVER duplicate, clone, mirror, twin, or repeat the same child anywhere in the scene — not in the foreground, not in the background, not as a reflection, not as a second copy. One child = one single figure on the page.
- A child's clothing comes ONLY from their character reference sheet and the modesty rules above. DO NOT copy the clothing, outfit, colors, prints, logos, brand marks, or accessories from any attached real-life PHOTOGRAPH of the child — a photograph is a guide to the child's FACE and HAIR ONLY, never to their wardrobe.
- WARDROBE LOCK: the star children have travelled INTO the Torah story's biblical era, so dress each child in modest, PERIOD-AUTHENTIC clothing for that era — flowing tunics/robes, sashes, simple sandals — kept the SAME on EVERY page and in EVERY scene (a head covering on a star child ONLY if their own photo/character sheet shows one). Match the outfit on their character sheet where it is already era-appropriate; never restyle, recolor, or swap the outfit between pages.
- NEVER dress the star child in MODERN clothing — no button-down shirts, no trousers/pants, no modern dresses, no t-shirts, no jeans, no hoodies, no sneakers, no logos or printed graphics. Even if a reference shows modern clothing, render period-authentic biblical clothing instead.
- HAIR & FEATURE LOCK: each child's hair COLOR, hair style, eye color, and skin tone must EXACTLY match their character sheet on every page. If the sheet shows brown hair, the hair is that exact same brown on every single page — never blonde, never a different shade, never a different style. SKIN TONE IS IDENTITY: reproduce each child's complexion EXACTLY as their photo/sheet shows — never lighter, never darker, never averaged toward a generic tone; siblings with different complexions keep their DIFFERENT complexions.
- INFANTS SIT: any child aged 0 (a baby under 1 year old) must ALWAYS be depicted SITTING (on the ground, on a blanket, on a lap) or held in someone's arms — NEVER standing, walking, or running. Children aged 1 and up may stand and walk normally.
- STAR CHILDREN ONLY — NO PARENTS: the star child(ren) experience the story ON THEIR OWN. NEVER add their parents, Tatty, Mommy, bubby, zeidy, siblings not named in this book, teachers, or any other modern-day family adults to the scene — not holding them, not reading to them, not standing behind them. The ONLY adults allowed are figures from the Torah narrative itself (Moshe, Avraham, the meraglim, Paroh, soldiers, etc.) when the scene depicts them. If the page text mentions Tatty/Mommy, still show ONLY the star child(ren) in the illustration.
- KAVOD HASEFORIM — NEVER place a sefer, book, chumash, or siddur on the floor or ground. Books are ALWAYS held respectfully in hands, or resting on a table, shtender, bookshelf, or bimah — never lying on a rug, floor, or the ground, never scattered, never stepped over.
- ONE SEAMLESS IMAGE: the illustration must be one single continuous scene with one sky and one lighting scheme — never two skies, never a horizontal seam, and never a strip that looks pasted on at the top or bottom.`;


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
    const sheetMap: Record<string, string> = (characterSheets && typeof characterSheets === "object")
      ? (characterSheets as Record<string, string>) : {};
    // Prefer the explicit per-child refs from the client. If none were sent but we
    // DO have character sheets, rebuild the refs from the sheet names so the saved
    // likenesses still anchor every page — otherwise the single fallback below
    // keys the sheet on the combined childName ("Adina & Ari") and finds nothing,
    // printing generic kids. Last resort: a single nameless child.
    const sheetNames = Object.keys(sheetMap);
    const refChildren: any[] = childRefsList.length > 0
      ? childRefsList
      : sheetNames.length > 0
        ? sheetNames.map((name) => ({ name, photoUrl: null, characterSheet: sheetMap[name] }))
        : [{ name: childName, photoUrl: null, characterSheet }];
    const refItems: { name: string; src: string; isPhoto: boolean }[] = [];
    for (const c of refChildren) {
      const isSingle = refChildren.length === 1;
      const photo = c?.photoUrl || (isSingle && typeof referenceImage === "string" ? referenceImage : null);
      const sheet = c?.characterSheet || sheetMap[c?.name] || (isSingle ? characterSheet : null);
      const nm = c?.name || childName || "the child";
      // The character SHEET is the one canonical anchor — it was generated from
      // the child's photo and locks the face, hair color, and outfit in-style.
      // Anchoring pages on the sheet ONLY (never sheet+photo together) removes
      // conflicting references — mixed anchors made hair color flip between pages.
      const src = (typeof sheet === "string" && sheet) ? sheet : ((typeof photo === "string" && photo) ? photo : null);
      if (src) refItems.push({ name: nm, src, isPhoto: src === photo });
    }
    // Stay within model attachment limits (4). Past the cap, keep every child's
    // SHEET first (it carries both likeness and the locked outfit), then photos.
    let cappedRefs = refItems;
    if (refItems.length > 4) {
      cappedRefs = [...refItems.filter((r) => !r.isPhoto), ...refItems.filter((r) => r.isPhoto)].slice(0, 4);
    }
    // NOTE: coloring INTERIOR pages KEEP the character-sheet refs (so the kids
    // stay consistent page-to-page). The sheets are full-color, which can bleed
    // colour into the line art — that's scrubbed out on the client, which
    // thresholds the finished coloring page to pure black-and-white.
    if (cappedRefs.length > 0) {
      const legend = cappedRefs
        .map((r, i) => `Image ${i + 1} = ${r.name}${r.isPhoto ? " (a REAL PHOTO of this child — match their exact face shape, eye colour and shape, eyebrows, skin tone, and hair from it. FACE AND HAIR ONLY — never copy the clothing in this photo)" : " (this child's OFFICIAL CHARACTER SHEET — it defines their permanent look INCLUDING the exact outfit: reproduce the SAME clothing, colors, head covering and styling shown on the sheet)"}`)
        .join("; ");
      imagePrompt = `CRITICAL CHILD LIKENESS & CONSISTENCY (do NOT ignore): The attached image(s) are references for the child character(s) in this book. ${legend}. You MUST reproduce EACH child's face, hair, eye colour and skin tone faithfully from THEIR OWN reference, translated into the chosen art style, so each child is IMMEDIATELY and unmistakably recognizable as that same real child on EVERY page. NEVER invent a generic face and NEVER swap features between children. When a reference is a real photograph, use it for the child's FACE and HAIR ONLY — do NOT copy the clothing, outfit, colours, prints, logos or accessories from the photo (dress each child per the story scene and the modesty rules below). Keep each child's look identical across all pages. ${imagePrompt}`;
      for (const r of cappedRefs) await pushImagePart(r.src);
    }

    // Recurring Torah-story characters (Moshe, Dovid, Golias, …): keep each one
    // identical across pages. Inject their fixed description ALWAYS (text lock),
    // and attach their reference sheet in whatever attachment slots remain after
    // the star children (character attachments are capped at 4 total).
    const storyRefsList: any[] = Array.isArray(storyCharacterRefs) ? storyCharacterRefs : [];
    if (!isColoring && !prompt && storyRefsList.length > 0) {
      const descLines = storyRefsList
        .filter((s) => s?.name && s?.description)
        .map((s) => `- ${s.name}: ${s.description}`);
      if (descLines.length > 0) {
        imagePrompt += ` \n\nRECURRING STORY CHARACTERS — every character below must look EXACTLY the same each time they appear in the book. Render each one precisely matching this fixed description (face, hair, facial hair, build, exact clothing and colours, headwear). Do NOT restyle or recolour them between pages:\n${descLines.join("\n")}`;
      }
      const remaining = Math.max(0, 4 - cappedRefs.length);
      const storySheetRefs = storyRefsList
        .filter((s) => typeof s?.sheet === "string" && s.sheet)
        .slice(0, remaining);
      if (storySheetRefs.length > 0) {
        const startIdx = cappedRefs.length;
        const legend2 = storySheetRefs
          .map((s, i) => `Image ${startIdx + i + 1} = ${s.name} (this Torah character's OFFICIAL CHARACTER SHEET — reproduce them looking exactly as shown here)`)
          .join("; ");
        imagePrompt += ` ADDITIONAL CHARACTER REFERENCE SHEETS attached: ${legend2}.`;
        for (const s of storySheetRefs) await pushImagePart(s.sheet);
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

    // ── ART-STYLE LOCK ──────────────────────────────────────────────────────
    // When a real child PHOTO is attached as a likeness reference, gpt-image
    // (via images/edits) and the Gemini fallback both tend to carry the photo's
    // PHOTOGRAPHIC realism into the output — so within a single "3D Pixar" book
    // roughly half the pages came back looking like real photos instead of the
    // chosen style. The style was stated only once, buried mid-prompt, while the
    // likeness preamble strongly pushes faithful photo reproduction. Re-assert
    // the target style LAST (most salient position) and explicitly forbid a
    // photographic result — unless the chosen style genuinely IS "realistic".
    const hasPhotoRef = cappedRefs.some((r) => r.isPhoto);
    if (hasPhotoRef && !isColoring && artStyle !== "realistic") {
      imagePrompt += ` ⚠️ ART-STYLE LOCK (HIGHEST PRIORITY — overrides the visual look of any attached photo): The FINAL image MUST be a ${styleName}, rendered ENTIRELY in this style: ${styleDesc}. The attached photo is ONLY a likeness reference for the child's face and hair — do NOT reproduce its photographic look, lighting or texture. The output must NOT be a real photograph, NOT photorealistic, and NOT a lightly-edited photo. Fully re-render the child and the entire scene from scratch as a ${styleName}. EVERY page of this book must share this exact same ${styleName} art style — never mix in a realistic/photographic page.`;
    }

    // ── CAPTION SPACE ───────────────────────────────────────────────────────
    // Reserve a calm band along the bottom of story-page illustrations so the app
    // can auto-place the story text there without overlapping faces or action.
    // This is what lets caption placement/sizing run almost fully autonomously —
    // there is always a clean, low-detail zone waiting for the text.

    // Final, most-salient reminder — image models weight the end of the prompt heavily.
    if (cappedRefs.length > 0) {
      const hasSheet = cappedRefs.some((r) => !r.isPhoto);
      imagePrompt += ` \n\nFINAL CHECK BEFORE RENDERING (highest priority, overrides everything else): (1) each named child appears EXACTLY ONCE in the image — no duplicates, no twins, no reflections, no second copy in the background; (2) each child's hair color and hair style EXACTLY match their character sheet.`;
      if (hasSheet) {
        imagePrompt += ` (3) OUTFIT — the children have travelled INTO this Torah story's biblical era, so dress each child in modest, PERIOD-AUTHENTIC clothing for that era: flowing ankle-length tunics/robes, era-appropriate cloth head coverings, sashes, simple sandals — NEVER modern clothing (no button-down shirts, trousers, modern dresses, t-shirts, jeans, or sneakers). Keep each child in the SAME era-appropriate outfit on EVERY page — match the outfit on their character sheet, and do NOT let the scene change what they wear. (Boys age 3+ keep peyos, a covered head, and tzitzis in era-appropriate form; girls stay fully tznius.)`;
      }
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

    // Force a finished coloring page to pure black-and-white line art. Even with
    // the (full-color) character sheet attached for consistency, the model can
    // leave colour/tints inside the outlines. A luminance threshold keeps the
    // dark OUTLINES black and whitens everything else (fills, tints, stray light
    // rays) — leaving clean empty shapes for a child to color. Fail-open.
    // NOTE: coloring pages are converted to clean black-and-white line art on
    // the CLIENT now (src/lib/lineArt.ts), not here. Doing the ImageScript
    // decode + threshold + fill-hollowing + re-encode on the edge blew the
    // worker's CPU/memory budget at 2K (an uncatchable 546 kill) and forced
    // coloring pages down to a soft 1K. The edge now just stores the raw 2K
    // generation and the browser does the conversion where there's no limit.

    // One full generation attempt (OpenAI primary → Gemini fallback). Reads the
    // current `parts` array, so the QA gate can amend the prompt and re-run it.
    const generateOnce = async (): Promise<string> => {
    // ============= MODEL DISPATCH =============
    // Nano Banana 2 (Gemini 3.1 Flash Image) is the primary generator. An admin
    // can still route to OpenAI by selecting a gpt-image model in the CMS — that
    // path goes through images/edits for likeness and falls back to Gemini on
    // error or when OpenAI is unavailable.
    const requestedImageModel = customImageModel || "gemini-3.1-flash-image-preview";
    // The front cover always carries the MOST reference images of any page in
    // the book (every recurring Torah character is attached, not just the ones
    // mentioned on a given page, capped at 4) plus a title-safe-area scene —
    // the single most complex generation in the book. That combination is what
    // was failing against OpenAI's images/edits endpoint while ordinary pages
    // (fewer/no side-character refs) succeeded. Keep the cover on the same
    // Gemini pipeline the rest of the book already relies on instead of ever
    // routing it through OpenAI.
    const isOpenAI = !isCover && /^(gpt-image|dall-e)/i.test(requestedImageModel);
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
          // Match the OpenAI size to the format's aspect so a page isn't rendered
          // square and then heavily cropped: coloring is portrait (8.5×11), board
          // is a wide spread (~2:1), everything else is a square page.
          const size = isColoring ? "1024x1536" : isSpreadFormat ? "1536x1024" : "1024x1024";
          // Coloring pages are the ones reported as low quality — request the
          // top quality tier for them specifically (other formats stay at the
          // existing "medium" tier rather than doubling cost/latency broadly).
          const quality = isColoring ? "high" : "medium";
          let openaiResp: Response;
          if (imageBlobs.length > 0) {
            const fd = new FormData();
            fd.append("model", requestedImageModel);
            fd.append("prompt", imagePrompt);
            fd.append("size", size);
            fd.append("quality", quality);
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
              body: JSON.stringify({ model: requestedImageModel, prompt: imagePrompt, size, quality, output_format: "jpeg", output_compression: 80, n: 1 }),
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
              return `data:image/jpeg;base64,${b64}`;
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

    // Only seed the Gemini list with customImageModel when it's actually a
    // Gemini-style name — for a cover forced off OpenAI (isOpenAI false above
    // even though the requested model is an OpenAI one), customImageModel would
    // otherwise be an OpenAI model name that Google's endpoint can't serve.
    const customIsGemini = typeof customImageModel === "string" && !/^(gpt-image|dall-e)/i.test(customImageModel);
    const imageModels = (customImageModel && customIsGemini)
      ? [customImageModel, "gemini-3.1-flash-lite-image", "gemini-3.1-flash-image-preview", "gemini-3.1-flash-image", "gemini-2.5-flash-image"]
      : [
          "gemini-3.1-flash-lite-image",
          "gemini-3.1-flash-image-preview",
          "gemini-3.1-flash-image",
          "gemini-2.5-flash-image",
        ];

    // Nano Banana 2 Lite (~4s/image, ~1/3 the price) carries interior pages, but
    // it only outputs 1K — so the COVER (the print surface where 2K sharpness
    // matters) skips lite and renders on the full models at 2K.
    const modelChain = [...new Set(imageModels)].filter(
      (m) => pageType !== "cover" || !m.includes("lite"),
    );

    let response: Response | null = null;
    let selectedModel: string | null = null;
    let lastErrorStatus: number | null = null;
    let lastErrorBody = "";
    let saw429 = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Resilient dispatch: a timed-out or rate-limited model moves on to the next
    // model in the list (each has its own quota) instead of failing the whole
    // page. A 429 gets ONE short backoff + same-model retry first, since preview
    // models rate-limit in bursts under the orchestrator's concurrency.
    for (const model of modelChain) {
      // Out of budget for another full attempt — fall through to the 1K rescue
      // (fast) instead of starting a 2K render we'd have to abort mid-flight.
      if (lastErrorStatus !== null && remainingMs() < 45_000) break;
      let modelDone = false;
      for (let modelTry = 0; modelTry < 2 && !modelDone; modelTry++) {
        let attempt: Response;
        try {
          const generationConfig: Record<string, unknown> = { responseModalities: ["TEXT", "IMAGE"] };
          if (model.startsWith("gemini-3")) {
            // 2K on every gemini-3 model EXCEPT lite (Nano Banana 2 Lite only
            // outputs 1K — asking it for 2K would get the request rejected and
            // skip the model entirely, defeating its speed/cost advantage).
            const wants2K = !model.includes("lite");
            const imageConfig = { ...(wants2K ? { imageSize: "2K" } : {}), ...(aspectRatio ? { aspectRatio } : {}) };
            if (Object.keys(imageConfig).length > 0) generationConfig.imageConfig = imageConfig;
          }
          attempt = await fetchWithTimeout(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_AI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts }],
                generationConfig,
              }),
            },
            // As much of the long leash as the request budget allows, always
            // reserving time for the 1K rescue + upload + response.
            Math.max(15_000, Math.min(IMAGE_GEN_TIMEOUT_MS, remainingMs() - 30_000)),
          );
        } catch (e) {
          const isTimeout = e instanceof DOMException && e.name === "AbortError";
          console.error(`Gemini model ${model} ${isTimeout ? "timed out" : "threw"} — trying next model:`, e);
          lastErrorStatus = isTimeout ? 504 : 500;
          lastErrorBody = String(e);
          break; // next model — a hung model won't improve on an immediate retry
        }

        if (attempt.ok) {
          response = attempt;
          selectedModel = model;
          modelDone = true;
          break;
        }

        const body = await attempt.text();
        lastErrorStatus = attempt.status;
        lastErrorBody = body;
        console.error(`Gemini image generation error with model ${model}:`, attempt.status, body);

        if (attempt.status === 429) {
          saw429 = true;
          if (modelTry === 0) {
            await sleep(7_000); // brief cool-off, then retry the same model once
            continue;
          }
          break; // still limited — fall through to the next model's separate quota
        }

        const retryableModelError =
          attempt.status === 404 ||
          (attempt.status === 400 && /not found|not supported|generatecontent|responsemodalities|imageconfig|imagesize|aspectratio/i.test(body));

        if (!retryableModelError) {
          throw new Error(`Gemini image generation error [${attempt.status}]`);
        }
        break; // model unavailable — next model
      }
      if (response) break;
    }

    // RESCUE PASS: if every model TIMED OUT (Gemini running slow — 2K renders
    // with reference images can outlast even the long timeout), try once more at
    // the default 1K size, which renders much faster. A slightly softer page
    // beats a failed one, and the admin can regenerate it at full quality later.
    if (!response && !saw429 && lastErrorStatus === 504 && remainingMs() > 20_000) {
      // Lite is the fastest 1K model there is — exactly what a rescue wants.
      const rescueModel = "gemini-3.1-flash-lite-image";
      const rescueConfig: Record<string, unknown> = { responseModalities: ["TEXT", "IMAGE"] };
      if (rescueModel.startsWith("gemini-3") && aspectRatio) rescueConfig.imageConfig = { aspectRatio };
      try {
        const rescue = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${rescueModel}:generateContent?key=${GOOGLE_AI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: rescueConfig }),
          },
          Math.max(10_000, Math.min(60_000, remainingMs() - 8_000)),
        );
        if (rescue.ok) {
          response = rescue;
          selectedModel = rescueModel;
          console.log(`Rescued page at default resolution with ${rescueModel} after 2K timeouts.`);
        } else {
          console.error(`1K rescue attempt failed: ${rescue.status} ${(await rescue.text()).slice(0, 200)}`);
        }
      } catch (e) {
        console.error("1K rescue attempt failed too:", e);
      }
    }

    if (!response) {
      if (saw429) {
        const rateErr = new Error("Rate limited — please try again in a moment.") as Error & { status?: number };
        rateErr.status = 429;
        throw rateErr;
      }
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
      // A blocked generation comes back OK-status but with no image and a
      // safety/blocked finishReason (Gemini's image-safety filter). Tag it so
      // the caller can retry with a softened, child-friendly prompt instead of
      // failing the page outright — this is the usual cause of certain scenes
      // (e.g. Tisha B'Av churban: fire, siege, mourning) failing every time.
      const fr = String(data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason || "");
      const err = new Error(`No image returned from Gemini${fr ? ` (${fr})` : ""}`) as Error & { safetyBlocked?: boolean };
      err.safetyBlocked = !!data.promptFeedback?.blockReason || /SAFETY|PROHIBITED|BLOCK|RECITATION/i.test(fr);
      throw err;
    }

    return imageUrl;
    };

    // ── CHARACTER QA GATE ────────────────────────────────────────────────────
    // Prompt rules steer, but they don't guarantee. After generating, a fast
    // vision model inspects the page against the character sheet(s) for the
    // three failure modes users actually see — duplicated child, wrong hair
    // color, wrong outfit — and, on failure, ONE corrective regeneration runs
    // with the inspector's findings appended to the prompt. Fail-open: any QA
    // error keeps the first image.
    const sheetRefs = cappedRefs.filter((r) => !r.isPhoto);

    const collectInline = async (src: string, out: any[]) => {
      if (!src) return;
      if (src.startsWith("data:")) {
        const m = src.match(/^data:(image\/\w+);base64,(.+)$/);
        if (m) out.push({ inlineData: { mimeType: m[1], data: m[2] } });
        return;
      }
      try {
        const r = await fetchWithTimeout(src, undefined, 10_000);
        if (r.ok) {
          const buf = await r.arrayBuffer();
          out.push({ inlineData: { mimeType: r.headers.get("content-type") || "image/jpeg", data: bufferToBase64(buf) } });
        }
      } catch { /* fail-open */ }
    };

    const qaCheck = async (imgUrl: string): Promise<string | null> => {
      try {
        const qaParts: any[] = [];
        await collectInline(imgUrl, qaParts);
        if (qaParts.length === 0) return null;
        const usableSheets = sheetRefs.slice(0, 2);
        for (const r of usableSheets) await collectInline(r.src, qaParts);
        if (qaParts.length < 2) return null; // need the page + at least one sheet
        const names = usableSheets.map((r) => r.name).join(", ");
        const agesLine = childRefsList
          .filter((c: any) => c?.name && c?.age)
          .map((c: any) => `${c.name} is ${c.age} years old`)
          .join("; ") || "ages as shown on the sheets";
        // Image 1 is a colorless line-art page for coloring books — the sheets
        // are still full-color, so a color-based hair check would ALWAYS "fail"
        // (there's no color at all to compare). Judge hair by STYLE/shape instead.
        const hairDefectLine = isColoringPage
          ? "2) hairMismatch — a star child's hair STYLE or length clearly differs from their character sheet (e.g. short hair on the page but long/braided on the sheet). Ignore color — this page has none."
          : "2) hairMismatch — a star child's hair COLOR clearly differs from their character sheet (e.g. blonde on the page but brown on the sheet).";
        // Teaser covers intentionally re-dress the kids — a "wrong" outfit is
        // correct there, so the inspector must not flag (and re-roll) it.
        const outfitDefectLine = outfitVariant
          ? "3) outfitMismatch — IGNORE this defect for this page: the outfit was INTENTIONALLY changed for this special cover, so clothing that differs from the sheet is CORRECT; always answer false."
          : "3) outfitMismatch — a star child's clothing shape/style clearly differs from the outfit on their character sheet (e.g. modern t-shirt instead of the sheet outfit).";
        qaParts.push({ text: `You are a strict QA inspector for a children's book. Image 1 is a GENERATED book page${isColoringPage ? " (a black-and-white LINE-ART coloring page — judge shapes/silhouettes only, ignore that it has no color)" : ""}. The following ${usableSheets.length} image(s) are the OFFICIAL character sheet(s) for the star child(ren): ${names}. Inspect the generated page for ONLY these defects:
1) duplicate — the SAME star child appears more than once in the page (a twin, clone, mirror or extra copy of the same child).
${hairDefectLine}
${outfitDefectLine}
4) ageMismatch — a star child looks CLEARLY older or younger than their real age (${agesLine}) — e.g. drawn as a teenager or grown child when they should be a toddler.
5) styleMismatch — the page is clearly NOT rendered as a ${styleName} (e.g. a flat 2D cartoon or a real photograph when it must be a 3D CGI render).
6) flatBand — a flat, solid-color, EMPTY horizontal band or strip (top or bottom) that looks like a blank text box or pasted-on panel, OR a visible horizontal SEAM where the top region does not continue the same scene — e.g. TWO different skies, a straight line where two images appear joined, or mismatched lighting/palette between a top strip and the rest of the image.
7) extraAdult — a modern-day parent or family adult (father/Tatty, mother/Mommy, grandparent, teacher) appears WITH the star child(ren). Adults in biblical/Torah dress who belong to the Torah scene are FINE and must NOT be flagged.
8) bookOnFloor — a book, sefer, chumash, or siddur is lying on the floor, rug, or ground (books held in hands or on tables/shelves/shtenders are fine).
9) bakedText — clearly readable TEXT is painted into the image itself: a title, a child's name, a tagline, a caption, or any legible words, letters, or numbers anywhere (ignore faint, illegible decorative marks). All wording is overlaid later by software, so ANY painted text is a defect.
Judge ONLY the star child(ren) shown on the sheets for defects 1-4 — ignore background/biblical figures. Be tolerant of art-style differences, lighting, and pose; flag only CLEAR problems. Reply with STRICT minified JSON only, no prose: {"duplicate":false,"hairMismatch":false,"outfitMismatch":false,"ageMismatch":false,"styleMismatch":false,"flatBand":false,"extraAdult":false,"bookOnFloor":false,"bakedText":false,"details":""}` });
        const r = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ role: "user", parts: qaParts }], generationConfig: { temperature: 0 } }),
          },
          20_000,
        );
        if (!r.ok) return null;
        const j = await r.json();
        const txt = (j.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("");
        const m = txt.match(/\{[\s\S]*\}/);
        if (!m) return null;
        const v = JSON.parse(m[0]);
        const issues: string[] = [];
        if (v.duplicate) issues.push("the same star child appeared MORE THAN ONCE — render each named child EXACTLY ONCE, with no duplicate anywhere in the scene");
        if (v.hairMismatch) issues.push(isColoringPage
          ? "a star child's HAIR STYLE/length did not match the character sheet — copy the exact hair style and length from the sheet"
          : "a star child's HAIR COLOR did not match the character sheet — copy the exact hair color and shade from the sheet");
        if (v.outfitMismatch) issues.push("a star child's OUTFIT did not match the character sheet — dress them in exactly the outfit shown on the sheet");
        if (v.ageMismatch) issues.push(`a star child was drawn at the WRONG AGE — render each child at their exact stated age (${agesLine}) with true proportions, never older or younger`);
        if (v.styleMismatch) issues.push(`the page was NOT rendered in the required art style — the final image must be a ${styleName}, matching every other page of the book`);
        if (v.flatBand) issues.push("the image contained a pasted-on band/strip or a second sky with a visible horizontal seam — repaint as ONE single continuous scene with ONE sky and ONE lighting scheme; clouds, light, and color must flow seamlessly from the very top edge down into the scene, with no line where two images appear joined");
        if (v.extraAdult) issues.push("a modern parent/family adult appeared with the star child(ren) — remove ALL parents and modern adults; show ONLY the star child(ren), plus Torah-narrative figures if the scene depicts them");
        if (v.bookOnFloor) issues.push("a sefer/book was lying on the floor or ground — kavod haseforim: books must be held in hands or rest on a table, shtender, or shelf, NEVER on the floor");
        if (v.bakedText) issues.push("painted TEXT appeared in the image — repaint the SAME scene completely WORDLESS: no titles, names, taglines, captions, letters, words, or numbers anywhere; all wording is added later by software");
        if (issues.length === 0) return null;
        const details = typeof v.details === "string" && v.details.trim() ? ` (inspector notes: ${v.details.slice(0, 200)})` : "";
        return issues.join("; ") + details;
      } catch (e) {
        console.error("QA check failed (fail-open):", e);
        return null;
      }
    };

    const isSafetyBlocked = (e: unknown) => !!(e as { safetyBlocked?: boolean })?.safetyBlocked;

    const qaStartedAt = Date.now();
    // Torah scenes of churban/plagues/war (Tisha B'Av, Va'era, Beshalach…)
    // depict destruction that trips Gemini's image-safety filter even though the
    // book wants a gentle, kid-safe rendering. On a block, retry with escalating
    // softening: first ask for a gentle/symbolic version of the SAME scene, then
    // — if still blocked — abandon the scene entirely for a calm, generic image
    // of the children, so a blocked page never hard-fails (500) the whole page.
    const SAFETY_ESCALATIONS = [
      ` \n\nIMPORTANT: Render this GENTLY and symbolically for a young child's storybook — absolutely NO fire, flames, smoke, weapons, blood, injury, death, rubble of bodies, or frightening/graphic imagery. Keep it calm, wholesome, tasteful, and hopeful; suggest sad or difficult moments softly (a lone tear, a quiet embrace, distant simple buildings) rather than depicting any violence or destruction.`,
      ` \n\nDO NOT depict the difficult event at all. Instead draw ONLY the star child(ren) standing quietly and thoughtfully in a calm, peaceful, entirely non-violent setting with soft light — a gentle, hopeful, wholesome scene suitable for a young child. Nothing frightening, nothing on fire, no destruction, no weapons, no people in distress.`,
    ];
    let finalImageUrl: string;
    try {
      finalImageUrl = await generateOnce();
    } catch (e) {
      if (!isSafetyBlocked(e)) throw e;
      let recovered: string | undefined;
      for (const escalation of SAFETY_ESCALATIONS) {
        console.warn("Generation blocked by safety filter — retrying with a softened prompt.");
        imagePrompt += escalation;
        parts[parts.length - 1] = { text: imagePrompt };
        try {
          recovered = await generateOnce();
          break;
        } catch (e2) {
          if (!isSafetyBlocked(e2)) throw e2;
          // else: still blocked — escalate to the next, more neutral prompt
        }
      }
      if (recovered === undefined) throw e; // exhausted escalations (rare)
      finalImageUrl = recovered;
    }

    if (sheetRefs.length > 0 && Date.now() - qaStartedAt < 75_000 && remainingMs() > 35_000) {
      const issues = await qaCheck(finalImageUrl);
      if (issues) {
        console.warn("QA gate rejected page — regenerating once:", issues);
        imagePrompt += ` \n\n⚠️ PREVIOUS ATTEMPT REJECTED BY AUTOMATED QA — it had these exact problems: ${issues}. Fix them now: every named child appears EXACTLY ONCE, with hair color, hair style, and outfit copied EXACTLY from their character sheet.`;
        parts[parts.length - 1] = { text: imagePrompt };
        try {
          finalImageUrl = await generateOnce();
        } catch (e) {
          console.error("QA retry failed — keeping first attempt:", e);
        }
      }
    }

    // Coloring interior pages are stored as the raw 2K generation; the browser
    // converts them to clean B&W line art at display/print time (see
    // src/lib/lineArt.ts) — off the edge, where 2K processing is safe.

    // Move the finished image into object storage and return its URL, so the
    // caller (generate-book) stores a short URL in pages_data instead of a
    // multi-MB base64 blob. Namespaced by book + page for easy cleanup.
    const pageTag = pageType ? `${pageType}${pageNumber ? `-${pageNumber}` : ""}` : "page";
    const storedUrl = await uploadImageToStorage(finalImageUrl, `${bookId || "adhoc"}/${pageTag}`);

    return new Response(JSON.stringify({ imageUrl: storedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    const isTimeout = e instanceof DOMException && e.name === "AbortError";
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: isTimeout ? 504 : ((e as Error & { status?: number })?.status || 500),
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
