import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { childName, childrenInfo, age, gender, torahPortion, torahPortionLabel, artStyle, language, pageCount } = await req.json();

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    // Page count is driven by book type (board=10, soft/hardcover=20). Validate to a sane range.
    const requestedPages = Number(pageCount);
    const pages = Number.isFinite(requestedPages) && requestedPages > 0
      ? Math.min(30, Math.max(4, Math.round(requestedPages)))
      : 10;

    // Try to load custom prompts from site_settings
    let customSystemPrompt: string | null = null;
    let customModel: string | null = null;
    let customTemperature: number | null = null;
    const pageTemplates: Record<string, string> = {}; // e.g. "cover:text" -> template, "page-1:text" -> template
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
- Boys aged 3 and older ALWAYS wear a yarmulke, have peyos (sidelocks), and tzitzis visible. Boys aged 0-2 do NOT wear a yarmulke/kippah (they have not yet had their upsherin), but may have beginning peyos
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

CRITICAL RULE: The MAJORITY of story pages (at least 70%) MUST depict the ACTUAL events from the Torah portion in vivid, specific detail. For example, if the story is about the Exodus, you must show the individual plagues, the splitting of the sea, etc. — not just mention them in passing. The child characters must be PRESENT IN and PARTICIPATING IN those actual Torah scenes, witnessing the miracles and events firsthand. Do NOT summarize the Torah events in 1-2 pages and spend the rest on generic adventure. Each Torah event deserves its own page with rich, specific detail.`;

    const characterDesc = childrenInfo
      ? `Characters: ${childrenInfo}`
      : `Main character: ${childName}, ${age} years old, ${gender}`;

    // Build per-page template guidance if admin has set templates
    let templateGuidance = "";
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
- Each story page should be 2-3 sentences, appropriate for a ${age}-year-old
- CRITICAL: At least 70% of the pages MUST depict SPECIFIC, ACTUAL events from the Torah portion. For example, for Va'era show the plagues one by one; for Beshalach show the crossing of the sea; for Bereishit show the days of creation. The child must be IN those scenes, witnessing and participating in the actual events — not just hearing about them or being told the story.
- DO NOT compress the Torah events into 1-2 pages. Spread the key events across most of the book, giving each major event its own page with vivid detail.
- The story MUST teach a clear moral lesson rooted in middos tovos — chesed, emes, hakaras hatov, ometz lev, kibud av va'em, yiras Shamayim
- The kinderlach should discover the hidden lesson behind the Torah story through their adventure
- End with a warm, uplifting moral that shows how they can apply the lesson in their own frum lives — at the Shabbos tish, in cheder/Bais Yaakov, with their mishpacha
- Boys aged 3+ MUST always wear a yarmulke, have peyos, and tzitzis; boys aged 0-2 do NOT wear a yarmulke (before upsherin); girls MUST wear long sleeves and long skirts — maintain strict tznius throughout
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
  }
}

The questions should be part of the back cover (inside the backCover object):
- Include exactly 20 questions
- Reflect the specific events, moral lessons, and values from the story
- Be age-appropriate for a ${age}-year-old
- Mix comprehension questions with moral/values questions
- Reference specific characters and scenes from the story
- Focus on what the children learned and how they can apply it in real life

No markdown, no explanation, just the JSON object.`;

    const storyModel = customModel || "gemini-2.5-pro";
    const temperature = customTemperature ?? 0.9;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${storyModel}:generateContent?key=${GOOGLE_AI_API_KEY}`,
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
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
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

    return new Response(JSON.stringify({ cover, pages: storyPages, backCover }), {
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
