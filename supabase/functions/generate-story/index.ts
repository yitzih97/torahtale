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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authErr = await requireUser(req);
  if (authErr) return authErr;

  try {
    const { childName, childrenInfo, age, gender, torahPortion, torahPortionLabel, artStyle, language, pageCount } = await req.json();

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!GOOGLE_AI_API_KEY && !ANTHROPIC_API_KEY) {
      throw new Error("No AI provider configured (set ANTHROPIC_API_KEY and/or GOOGLE_AI_API_KEY)");
    }

    // Page count is driven by book type (board=10, soft/hardcover=20). Validate to a sane range.
    const requestedPages = Number(pageCount);
    const pages = Number.isFinite(requestedPages) && requestedPages > 0
      ? Math.min(30, Math.max(4, Math.round(requestedPages)))
      : 10;

    // Try to load custom prompts from site_settings
    let customSystemPrompt: string | null = null;
    let customModel: string | null = null;
    let customTemperature: number | null = null;
    let masterBookRules: string | null = null;
    const pageTemplates: Record<string, string> = {}; // e.g. "cover:text" -> template, "page-1:text" -> template
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
        customSystemPrompt = settings.find((s: any) => s.category === "prompts" && s.key === "story-system-prompt")?.value || null;
        customModel = settings.find((s: any) => s.category === "ai" && s.key === "story-model")?.value || null;
        customTemperature = (() => {
          const v = settings.find((s: any) => s.category === "ai" && s.key === "story-temperature")?.value;
          return v ? parseFloat(v) : null;
        })();

        // Global master rules (apply to every page of every book)
        masterBookRules = settings.find((s: any) => s.category === "book-templates" && s.key === "master-rules")?.value || null;

        // Load book-templates for this Torah portion
        if (torahPortion) {
          settings
            .filter((s: any) => s.category === "book-templates" && s.key.startsWith(`${torahPortion}:`))
            .forEach((s: any) => {
              // key format: portion:page-N:text or portion:cover:text
              const suffix = s.key.replace(`${torahPortion}:`, "");
              pageTemplates[suffix] = s.value;
            });
        }
      }
    } catch (e) { console.error("Failed to load site_settings:", e); }

    const systemPrompt = customSystemPrompt || `You are a master storyteller for frum Yiddishe kinderlach in the Chareidi community. You write warm, engaging, age-appropriate stories that weave Torah wisdom into magical adventures. Every story MUST teach a clear moral lesson rooted in middos tovos — chesed, emes, hakaras hatov, ometz lev, kibud av va'em, yiras Shamayim, and ahavas Yisrael. The kinderlach should discover the hidden lesson behind the Torah story through their adventure, learning how to apply it in their own lives.

IMPORTANT CULTURAL RULES:
- Boys aged 3 and older ALWAYS wear a yarmulke, have peyos (sidelocks), and tzitzis visible. Boys UNDER 3 (pre-upsherin) do NOT wear a yarmulke/kippah, do NOT have peyos, and do NOT wear tzitzis unless the child's description explicitly asks for them or a reference photo clearly shows those items. A reference photo by itself is NOT permission unless those items are actually visible in it
- Girls ALWAYS wear long sleeves, long skirts below the knee, modest clothing — no pants, no head covering for unmarried girls
- Use Chareidi terminology naturally: Tatty (father), Mommy (mother), Rebbe (teacher for boys), Morah (teacher for girls), davening (praying), bentching (grace after meals), learning (Torah study), Shabbos (never Shabbat), Hashem (never "God"), sefer/seforim (holy books), beis medrash (study hall), cheder/yeshiva (boys' school), Bais Yaakov (girls' school)
- Reference daily frum life: davening Shacharis, learning in cheder or Bais Yaakov, making brachos, the Shabbos tish, zemiros, havdalah
- NO mention of TV, movies, video games, secular entertainment, or non-tznius activities
- The stories should be vivid, imaginative, and make the kinderlach the heroes of the narrative
- Maintain a consistent narrative voice throughout — warm, gentle, and enchanting like a classic Yiddishe children's book

CRITICAL NAME TRANSLITERATION RULES — ALWAYS use the Yiddish/Hebrew transliterations, NEVER the English/Christian versions:
- Avraham (NOT Abraham), Yitzchak (NOT Isaac), Yaakov (NOT Jacob)
- Moshe (NOT Moses), Aharon (NOT Aaron), Miriam (NOT Miriam is fine)
- Dovid (NOT David), Shlomo (NOT Solomon), Shaul (NOT Saul)
- Yosef (NOT Joseph), Binyamin (NOT Benjamin), Yehuda (NOT Judah)
- Rivka (NOT Rebecca), Rochel (NOT Rachel), Leah is fine, Sarah is fine
- Noach (NOT Noah), Adom (NOT Adam), Chava (NOT Eve)
- Golias (NOT Goliath), Paroh (NOT Pharaoh), Eisav (NOT Esau)
- Pinchas (NOT Phinehas), Yehoshua (NOT Joshua), Shimshon (NOT Samson)
- Eliyahu (NOT Elijah), Elisha is fine, Shmuel (NOT Samuel)
- Doniel (NOT Daniel), Mordechai (NOT Mordecai), Esther is fine
- Reuven (NOT Reuben), Shimon (NOT Simon), Levi is fine, Menashe (NOT Manasseh)
- Efraim (NOT Ephraim), Naftali (NOT Naphtali), Dan is fine, Gad is fine
- Yissachar (NOT Issachar), Zevulun (NOT Zebulun), Asher is fine
- Use Bnei Yisrael (NOT Israelites), Mitzrayim (NOT Egypt in Torah context), Eretz Yisrael (NOT Land of Israel/Canaan)
- Use the Yam Suf (NOT Red Sea), Har Sinai (NOT Mount Sinai), Gan Eden (NOT Garden of Eden)
- Refer to non-Jewish nations by their Hebrew names when possible

CRITICAL ACCURACY RULES:
- The story MUST follow the ACTUAL events of the Torah portion with complete accuracy, according to the pesukim and accepted midrashim. NEVER change, soften, or reverse an outcome — if the Torah says a request was refused (for example, the Melech of Edom REFUSED to let Bnei Yisrael pass through his land), then in the story it is refused. Do not invent friendlier or different endings to real Torah events.
- NEVER describe the hero children's clothing, outfit, or clothing colors anywhere in the story text (no "wearing a blue shirt", no "her favorite skirt"). The illustrations control what the children wear, and clothing mentioned in text will contradict the pictures. Describe actions, feelings, and the scene — never the heroes' wardrobe.

CRITICAL RULE: The MAJORITY of story pages (at least 70%) MUST depict the ACTUAL events from the Torah portion in vivid, specific detail. For example, if the story is about the Exodus, you must show the individual plagues, the splitting of the sea, etc. — not just mention them in passing. The child characters must be PRESENT IN and PARTICIPATING IN those actual Torah scenes, witnessing the miracles and events firsthand. Do NOT summarize the Torah events in 1-2 pages and spend the rest on generic adventure. Each Torah event deserves its own page with rich, specific detail.`;

    const characterDesc = childrenInfo
      ? `Characters: ${childrenInfo}`
      : `Main character: ${childName}, ${age} years old, ${gender}`;

    // Build master + per-page template guidance if admin has set them
    let templateGuidance = "";

    if (masterBookRules?.trim()) {
      const rules = masterBookRules
        .replace(/\{childName\}/g, childName || "the child")
        .replace(/\{age\}/g, age || "")
        .replace(/\{gender\}/g, gender || "")
        .replace(/\{artStyle\}/g, artStyle || "")
        .replace(/\{language\}/g, language || "english")
        .replace(/\{torahPortion\}/g, torahPortionLabel || torahPortion || "");
      templateGuidance += `\n\nMASTER BOOK RULES — These rules apply to EVERY page of this book without exception:\n${rules}`;
    }

    const hasTemplates = Object.keys(pageTemplates).some((k) => k.endsWith(":text") && pageTemplates[k]?.trim());
    if (hasTemplates) {
      const lines: string[] = [];
      lines.push("\n\nADMIN PAGE TEMPLATES — Follow these narrative guidelines closely for each page:");
      const coverText = pageTemplates["cover:text"];
      if (coverText?.trim()) {
        lines.push(`- COVER: ${coverText.replace(/\{childName\}/g, childName || "the child").replace(/\{age\}/g, age || "").replace(/\{gender\}/g, gender || "").replace(/\{artStyle\}/g, artStyle || "").replace(/\{language\}/g, language || "english")}`);
      }
      for (let i = 1; i <= pages; i++) {
        const t = pageTemplates[`page-${i}:text`];
        if (t?.trim()) {
          lines.push(`- PAGE ${i}: ${t.replace(/\{childName\}/g, childName || "the child").replace(/\{age\}/g, age || "").replace(/\{gender\}/g, gender || "").replace(/\{artStyle\}/g, artStyle || "").replace(/\{language\}/g, language || "english")}`);
        }
      }
      const backText = pageTemplates["back-cover:text"];
      if (backText?.trim()) {
        lines.push(`- BACK COVER: ${backText.replace(/\{childName\}/g, childName || "the child").replace(/\{age\}/g, age || "").replace(/\{gender\}/g, gender || "").replace(/\{artStyle\}/g, artStyle || "").replace(/\{language\}/g, language || "english")}`);
      }
      templateGuidance = lines.join("\n");
    }

    const userPrompt = `Write a personalized children's book with a front cover, ${pages} story pages, a back cover, and 10 discussion questions.

Details:
- ${characterDesc}
- Torah Portion / Holiday: ${torahPortionLabel} (${torahPortion})
- Art Style: ${artStyle}
- Language: ${language}

Requirements:
- Make the kinderlach the main characters and heroes of the story
- The kinderlach experience the adventure BY THEMSELVES — do NOT place their Tatty, Mommy, grandparents, or teachers into story scenes as on-scene characters (the illustrations must show only the kinderlach). Torah figures (Moshe Rabbeinu, Avraham Avinu, the meraglim, etc.) appear as the narrative requires. Parents may be warmly referenced in the dedication or closing moral, but never as characters inside a scene
- Each story page should be 2-3 sentences, appropriate for a ${age}-year-old
- CRITICAL: At least 70% of the pages MUST depict SPECIFIC, ACTUAL events from the Torah portion. For example, for Va'era show the plagues one by one; for Beshalach show the crossing of the sea; for Bereishit show the days of creation. The child must be IN those scenes, witnessing and participating in the actual events — not just hearing about them or being told the story.
- DOUBLE PARSHA: If the Torah Portion name above joins TWO parshiyos (e.g. "Chukas-Balak", "Matos-Masei", "Tazria-Metzora") this is ONE book covering BOTH. Give balanced coverage to the key events of each parsha — roughly half the story pages for the first, half for the second — so both are meaningfully represented in the single book.
- DO NOT compress the Torah events into 1-2 pages. Spread the key events across most of the book, giving each major event its own page with vivid detail.
- The story MUST teach a clear moral lesson rooted in middos tovos — chesed, emes, hakaras hatov, ometz lev, kibud av va'em, yiras Shamayim
- The kinderlach should discover the hidden lesson behind the Torah story through their adventure
- End with a warm, uplifting moral that shows how they can apply the lesson in their own frum lives — at the Shabbos tish, in cheder/Bais Yaakov, with their mishpacha
- Boys aged 3+ MUST always wear a yarmulke, have peyos, and tzitzis; boys UNDER 3 do NOT wear a yarmulke, peyos, or tzitzis (pre-upsherin) unless their description explicitly asks for them or their photo clearly shows them. A photo does NOT override this unless those items are visible. Girls MUST wear long sleeves and long skirts — maintain strict tznius throughout
- Use Chareidi terminology: Tatty, Mommy, Rebbe, Morah, davening, bentching, Shabbos, Hashem, sefer/seforim, beis medrash, cheder, Bais Yaakov
- NO references to TV, movies, video games, or secular entertainment
- Maintain the SAME narrative voice and tone across every page — warm, gentle, enchanting like a Yiddishe bubbe telling a maaseh
- ${language === "bilingual" ? "Write each page in both English and Hebrew" : language === "hebrew" ? "Write in Hebrew (modern Hebrew with full nikud where helpful)" : language === "yiddish" ? "Write in Yiddish (Eastern/Litvish Yiddish in Hebrew script — the traditional Chareidi mama-loshen used in chassidish/yeshivish homes)" : "Write in English"}
${templateGuidance}

You MUST respond with ONLY a valid JSON object with this exact structure:
{
  "cover": {
    "title": "The book title",
    "subtitle": "A short subtitle or tagline"
  },
  "pages": [
    { "page": 1, "text": "Story text for page 1" },
    ...
  ],
  "backCover": {
    "synopsis": "A short 1-2 sentence synopsis for the back cover",
    "dedication": "A warm dedication message to the child/children",
    "questions": [
      { "number": 1, "question": "Discussion question 1" },
      { "number": 2, "question": "Discussion question 2" },
      ...up to 20 questions
    ]
  },
  "characters": [
    { "name": "Dovid", "description": "a fixed, detailed visual description used to draw this character identically on every page" }
  ]
}

CHARACTERS ARRAY (CRITICAL for illustration consistency):
- List EVERY recurring named character from the Torah story who appears on more than one page — EXCEPT the hero kinderlach themselves (they have their own reference photos). For example: Moshe, Aharon, Dovid, Golias, Paroh, Yishai, the meraglim, a malach, etc.
- For each, write ONE fixed, richly detailed VISUAL description (approx and hair, facial hair, skin tone, exact clothing and colors, headwear, distinguishing features, build/height) that an illustrator will reproduce IDENTICALLY every time that character appears, so the character looks the same on every page.
- Descriptions MUST obey the modesty and Bnei-Yisrael/non-Jew rules above (e.g. Jewish men age 3+ always have covered heads; non-Jews wear distinct foreign dress).
- Include at most 6 characters — the most important recurring ones. If the story has no recurring non-hero characters, return an empty array.

The questions should be part of the back cover (inside the backCover object):
- Include exactly 20 questions
- Reflect the specific events, moral lessons, and values from the story
- Be age-appropriate for a ${age}-year-old
- Mix comprehension questions with moral/values questions
- Reference specific characters and scenes from the story
- Focus on what the children learned and how they can apply it in real life

No markdown, no explanation, just the JSON object.`;

    const storyModel = customModel || "claude-fable-5";
    const temperature = customTemperature ?? 0.9;
    const isClaude = /^claude/i.test(storyModel);

    // JSON schema for the book — enforced via Anthropic structured outputs so the
    // response is guaranteed parseable (no markdown fences, no truncated JSON).
    const bookSchema = {
      type: "object",
      additionalProperties: false,
      required: ["cover", "pages", "backCover"],
      properties: {
        cover: {
          type: "object",
          additionalProperties: false,
          required: ["title", "subtitle"],
          properties: { title: { type: "string" }, subtitle: { type: "string" } },
        },
        pages: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["page", "text"],
            properties: { page: { type: "integer" }, text: { type: "string" } },
          },
        },
        backCover: {
          type: "object",
          additionalProperties: false,
          required: ["synopsis", "dedication", "questions"],
          properties: {
            synopsis: { type: "string" },
            dedication: { type: "string" },
            questions: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["number", "question"],
                properties: { number: { type: "integer" }, question: { type: "string" } },
              },
            },
          },
        },
        characters: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "description"],
            properties: { name: { type: "string" }, description: { type: "string" } },
          },
        },
      },
    };

    let content: string | null = null;

    // ============= ANTHROPIC CLAUDE (primary story writer) =============
    if (isClaude) {
      if (!ANTHROPIC_API_KEY) {
        console.warn("ANTHROPIC_API_KEY not configured — falling back to Gemini for the story.");
      } else {
        try {
          // Claude Fable 5: thinking is always on (no `thinking` param) and sampling
          // params (temperature) are rejected — the admin story-temperature setting
          // only applies to the Gemini path. The server-side fallback re-serves the
          // rare safety-classifier refusal on Opus 4.8 inside the same call.
          const isFable = storyModel.startsWith("claude-fable");
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          };
          const reqBody: Record<string, unknown> = {
            model: storyModel,
            max_tokens: 16000,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
            output_config: { format: { type: "json_schema", schema: bookSchema } },
          };
          if (isFable) {
            headers["anthropic-beta"] = "server-side-fallback-2026-06-01";
            reqBody.fallbacks = [{ model: "claude-opus-4-8" }];
          }
          // Bounded so a slow generation degrades to the Gemini fallback instead of
          // blowing the edge wall-clock budget of the generate-book orchestrator.
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 110_000);
          let aResp: Response;
          try {
            aResp = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers,
              body: JSON.stringify(reqBody),
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timer);
          }
          if (!aResp.ok) {
            const t = await aResp.text();
            throw new Error(`Anthropic API error [${aResp.status}]: ${t.slice(0, 300)}`);
          }
          const aData = await aResp.json();
          if (aData.stop_reason === "refusal") {
            throw new Error("Anthropic declined the request (stop_reason=refusal)");
          }
          const text = (aData.content ?? [])
            .filter((b: { type: string }) => b.type === "text")
            .map((b: { text: string }) => b.text)
            .join("");
          if (!text) throw new Error("Anthropic returned no text content");
          console.log(`Story generated with Anthropic model: ${aData.model || storyModel}`);
          content = text;
        } catch (e) {
          console.error("Anthropic story generation failed — falling back to Gemini:", e);
        }
      }
    }

    // ============= GEMINI (explicit gemini-* model, or Claude fallback) =============
    if (content === null) {
      if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");
      const geminiModel = isClaude ? "gemini-2.5-pro" : storyModel;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GOOGLE_AI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature,
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
        console.error("Gemini API error:", status, body);
        throw new Error(`Gemini API error [${status}]`);
      }

      const data = await response.json();
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    }

    const storyJson = content ?? "{}";
    let parsed;
    try {
      parsed = JSON.parse(storyJson);
    } catch {
      const match = storyJson.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    // Helper: flatten bilingual objects like {english: "...", hebrew: "..."} into a string
    const flattenText = (val: unknown): string => {
      if (typeof val === "string") return val;
      if (val && typeof val === "object" && !Array.isArray(val)) {
        const obj = val as Record<string, unknown>;
        if (typeof obj.english === "string" && typeof obj.hebrew === "string") {
          return `${obj.english}\n\n${obj.hebrew}`;
        }
        // fallback: join all string values
        return Object.values(obj).filter(v => typeof v === "string").join("\n\n");
      }
      return String(val ?? "");
    };

    // Normalize: ensure we have all parts
    const rawPages = Array.isArray(parsed.pages) ? parsed.pages : parsed.pages || [];
    const storyPages = rawPages.map((p: any) => ({
      ...p,
      text: flattenText(p.text),
    }));
    const cover = parsed.cover || { title: `${childName}'s Torah Adventure`, subtitle: torahPortionLabel };
    cover.title = flattenText(cover.title);
    cover.subtitle = flattenText(cover.subtitle);
    const questions = Array.isArray(parsed.backCover?.questions) ? parsed.backCover.questions : Array.isArray(parsed.questions) ? parsed.questions : [];
    const normalizedQuestions = questions.map((q: any) => ({
      ...q,
      question: flattenText(q.question),
    }));
    const backCover = {
      synopsis: flattenText(parsed.backCover?.synopsis || "A magical Torah adventure."),
      dedication: flattenText(parsed.backCover?.dedication || `For ${childName}, with love and brachos.`),
      questions: normalizedQuestions,
    };

    // Recurring Torah-story characters (not the hero kids) with fixed visual
    // descriptions — used to keep them looking identical across every page.
    const characters = Array.isArray(parsed.characters)
      ? parsed.characters
          .filter((c: any) => c && typeof c.name === "string" && c.name.trim())
          .slice(0, 6)
          .map((c: any) => ({ name: flattenText(c.name).trim(), description: flattenText(c.description).trim() }))
      : [];

    return new Response(JSON.stringify({ cover, pages: storyPages, backCover, characters }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-story error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
