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

  const t0 = Date.now();
  try {
    const { childName, childrenInfo, age, gender, torahPortion, torahPortionLabel, artStyle, language, pageCount } = await req.json();

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!GOOGLE_AI_API_KEY && !ANTHROPIC_API_KEY) {
      throw new Error("No AI provider configured (set ANTHROPIC_API_KEY and/or GOOGLE_AI_API_KEY)");
    }

    // Parent nicknames follow the book's language selection so the cover, story
    // pages, and dedication always use the SAME pair: English-only → Daddy/Mommy;
    // Hebrew selected (incl. english+hebrew / legacy "bilingual") → Abba/Ima;
    // Yiddish selected → Totty/Mommy (Yiddish wins when combined with Hebrew).
    const langSelection = String(language || "english").toLowerCase();
    const hasYiddish = langSelection.includes("yiddish");
    const hasHebrew = langSelection.includes("hebrew") || langSelection === "bilingual";
    const parentFather = hasYiddish ? "Totty" : hasHebrew ? "Abba" : "Daddy";
    const parentMother = hasYiddish ? "Mommy" : hasHebrew ? "Ima" : "Mommy";

    // Resolve the selected languages from the stored value, which may be a single
    // language ("english") OR the wizard's "+"-joined multi-select ("english+hebrew")
    // OR the legacy literal "bilingual" (== english+hebrew). This drives whether we
    // ask for one language or a bilingual object per field.
    const hasEnglish = langSelection.includes("english") || langSelection === "bilingual";
    let selectedLangs: string[] = [];
    if (hasEnglish) selectedLangs.push("english");
    if (hasHebrew) selectedLangs.push("hebrew");
    if (hasYiddish) selectedLangs.push("yiddish");
    if (selectedLangs.length === 0) selectedLangs = ["english"];
    const isMultiLang = selectedLangs.length > 1;
    const langNames: Record<string, string> = {
      english: "English",
      hebrew: "Hebrew (modern Hebrew with full nikud where helpful)",
      yiddish: "Yiddish (Eastern/Litvish Yiddish in Hebrew script — the traditional Chareidi mama-loshen)",
    };
    const otherLangs = selectedLangs.filter((l) => l !== "english").map((l) => langNames[l]).join(" and ");

    /* ── Reading level ──────────────────────────────────────────────────────
     * A rhyming verse is right for a toddler and wrong for a nine-year-old:
     * squeezing the parsha into couplets means the STORY gets lost, and older
     * kinderlach end up with a babyish book. So only the 0–3 band rhymes; every
     * older band writes real narrative prose that actually TELLS the story, and
     * the oldest band carries genuine insights from the meforshim.
     *
     * With several stars, the OLDEST child sets the level — a younger sibling is
     * being read to anyway, while an older one handed a toddler's book notices.
     */
    const ageNum = Math.max(0, Math.min(18, Math.round(Number(age)) || 6));
    const band = ageNum <= 3 ? "toddler" : ageNum <= 6 ? "early" : ageNum <= 9 ? "reader" : "insight";
    const NARRATIVE_STYLE: Record<string, string> = {
      toddler: `READING LEVEL — ages 0–3 (RHYMING VERSE).
- Each page is a SHORT rhyming verse: 2 lines, roughly 6–10 words per line, a steady sing-song beat for reading aloud.
- Tiny, concrete words a toddler knows. One single idea per page. Lots of sound and repetition.
- The rhyme is REAL: matching end-sounds, never forced, slant, or absent.`,
      early: `READING LEVEL — ages 4–6 (SIMPLE STORYTELLING PROSE — NO RHYME).
- Do NOT rhyme. Write real sentences that TELL the story, the way a parent tells it at bedtime.
- 2–3 short, clear sentences per page. Simple words, but a genuine narrative: what happened, then what happened next.
- Include a little dialogue and feeling ("Noach looked up at the sky and wondered...") so it reads as a story, not a summary.`,
      reader: `READING LEVEL — ages 7–9 (REAL NARRATIVE STORYTELLING — NO RHYME).
- Absolutely NO rhyme and NO verse. This is a proper story, told in flowing prose.
- 4–6 sentences per page, with real dialogue, tension, and description. Vary sentence length so it reads well aloud.
- Actually NARRATE the events: build the scene, show what the characters do and say, carry the story forward page to page.
- Richer vocabulary is welcome — explain a harder word inside the sentence rather than avoiding it.`,
      insight: `READING LEVEL — ages 10+ (NARRATIVE STORYTELLING WITH REAL INSIGHT — NO RHYME).
- Absolutely NO rhyme and NO verse. Write engaging, substantial narrative prose.
- 5–8 sentences per page: vivid scene-setting, real dialogue, and the characters' inner thoughts and struggles.
- On MOST pages, weave in a genuine INSIGHT the way a good rebbe would — a Rashi, a Midrash, a mefarshim's question and its answer, or a mussar point drawn out of the pesukim. Introduce it inside the story ("Rashi teaches that...", "The Midrash asks: why...?"), never as a detached footnote.
- Ask the interesting question the text itself raises, and answer it. Treat the reader as capable of a real idea.
- Stay accurate to the pesukim and accepted meforshim — never invent a source or attribute an idea to someone who did not say it.`,
    };
    const narrativeStyle = NARRATIVE_STYLE[band];
    const rhymes = band === "toddler";

    const languageInstruction = isMultiLang
      ? `LANGUAGES — this is a BILINGUAL book. Write EVERYTHING in BOTH ${selectedLangs.map((l) => langNames[l]).join(" AND ")}: every page's text, the cover title and subtitle, the synopsis, the dedication, and every question. For each of those fields return a JSON OBJECT with one key per language — e.g. "text": { ${selectedLangs.map((l) => `"${l}": "..."`).join(", ")} }.
  · Each language conveys the SAME story beat, but is COMPOSED INDEPENDENTLY in that language — NEVER a word-for-word translation. Natural, idiomatic writing in each language comes FIRST: reword freely, keeping the meaning but sacrificing literalness so it reads beautifully in that language.
${rhymes
  ? `  · EVERY language must GENUINELY RHYME ON ITS OWN — English AND ${otherLangs} alike, with EQUAL care. On every page, in EACH language, the lines must end in real matching rhyming sounds, be grammatically correct and natural, and scan smoothly (a steady beat) when read aloud like a real children's rhyme in that language. A line that does not rhyme in ANY language is WRONG — rewrite it until it does.
  · HEBREW / YIDDISH specifically: correct grammar with gender/number agreement, natural word order, full nikud (Hebrew), and line-endings whose final stressed syllables actually rhyme (e.g. ...רַךְ / ...רָךְ, ...לוּשׁ / ...חוּשׁ) — never an off or slant rhyme.
  · SELF-CHECK before you finish: read every page's verse aloud in your head in EACH language separately. If any language's lines on any page don't clearly rhyme and flow, rewrite THAT language's verse for THAT page until they do.`
  : `  · Do NOT rhyme in ANY language. Every language gets real, flowing narrative prose at the reading level below — the same story beat, each told naturally in its own language.
  · HEBREW / YIDDISH specifically: correct grammar with gender/number agreement, natural word order, and full nikud (Hebrew). It must read like a book written IN that language, not translated into it.
  · SELF-CHECK before you finish: read each page aloud in your head in EACH language. If any reads as stilted, translated, or as a summary rather than a told story, rewrite it.`}`
      : rhymes
        ? `Write everything in ${langNames[selectedLangs[0]]}. Every page is a short verse that GENUINELY RHYMES in ${langNames[selectedLangs[0]]} — real matching end-sounds, a steady beat, grammatically correct and natural, never a forced, slant, or non-rhyming line. Before finishing, read each page aloud in your head; rewrite any page whose lines don't clearly rhyme and flow.`
        : `Write everything in ${langNames[selectedLangs[0]]}, as real narrative prose at the reading level below — NOT verse and NOT rhyme. It must read like a story written in ${langNames[selectedLangs[0]]}, natural and idiomatic, never translated-sounding. Before finishing, read each page aloud in your head; rewrite any page that reads as a summary rather than a told story.`;

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

    const baseSystemPrompt = customSystemPrompt || `You are a master storyteller for frum Yiddishe kinderlach in the Chareidi community. You write warm, engaging, age-appropriate retellings of the parsha in which the star kinderlach live INSIDE the Torah story itself. Every story MUST teach a clear moral lesson rooted in middos tovos — chesed, emes, hakaras hatov, ometz lev, kibud av va'em, yiras Shamayim, and ahavas Yisrael. The kinderlach discover the hidden lesson by living through the actual events of the Torah story, learning how to apply it in their own lives.

STORY STRUCTURE — NON-NEGOTIABLE (these rules OVERRIDE any admin page template or other guidance below if they ever conflict):
- The book opens INSIDE the Torah story. On PAGE 1 the star kinderlach are ALREADY present within the events of the parsha — standing in the scene and part of the action from the very first sentence. There is NO build-up, introduction, or setup at home.
- NEVER use any framing device that starts the child at home or magically transports them into the story: NO glowing or magical book, NO swirling light, sparkles, or Torah letters carrying them away, NO portal, NO dream, NO "suddenly the room shimmered/changed," NO narrator sending them on a journey. The child is simply a character who belongs in the Torah narrative from page 1.
- The story stays ENTIRELY within the parsha from beginning to end — every page IS the Torah story. Do NOT return the child home at the end, and do NOT fade any "magic" away.
- The FINAL page keeps a warm, uplifting moral, and then ENDS by building excitement and anticipation for the NEXT story — a single warm closing line inviting the child to come back for their next Torah Tale, hinting that another incredible parsha adventure is waiting for them next time. Keep this teaser general (do not name a specific next parsha unless one is provided) so it always fits.

IMPORTANT CULTURAL RULES:
- Boys aged 3 and older ALWAYS wear a yarmulke, have peyos (sidelocks), and tzitzis visible. Boys UNDER 3 (pre-upsherin) do NOT wear a yarmulke/kippah, do NOT have peyos, and do NOT wear tzitzis unless the child's description explicitly asks for them or a reference photo clearly shows those items. A reference photo by itself is NOT permission unless those items are actually visible in it
- Girls ALWAYS wear long sleeves, long skirts below the knee, modest clothing — no pants, no head covering for unmarried girls
- Use Chareidi terminology naturally: ${parentFather} (father), ${parentMother} (mother), Rebbe (teacher for boys), Morah (teacher for girls), davening (praying), bentching (grace after meals), learning (Torah study), Shabbos (never Shabbat), Hashem (never "God"), sefer/seforim (holy books), beis medrash (study hall), cheder/yeshiva (boys' school), Bais Yaakov (girls' school)
- Reference daily frum life: davening Shacharis, learning in cheder or Bais Yaakov, making brachos, the Shabbos table, zemiros, havdalah
- NO mention of TV, movies, video games, secular entertainment, or non-tznius activities
- The stories should be vivid, imaginative, and make the kinderlach the stars of the narrative
- Maintain a consistent narrative voice throughout — warm, gentle, and enchanting like a classic Yiddishe children's book, pitched to the READING LEVEL below

${narrativeStyle}

TELL THE STORY — applies to EVERY reading level: the text must actually NARRATE what happens, page by page, as a story with a beginning, middle and end. Never let form win over substance: a page that sounds pretty but doesn't move the story forward, or that merely gestures at an event instead of telling it, is WRONG. The reader should be able to follow the whole parsha from the pages alone.

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
- NEVER describe the star children's clothing, outfit, or clothing colors anywhere in the story text (no "wearing a blue shirt", no "her favorite skirt"). The illustrations control what the children wear, and clothing mentioned in text will contradict the pictures. Describe actions, feelings, and the scene — never the stars' wardrobe.

CRITICAL RULE: The MAJORITY of story pages (at least 70%) MUST depict the ACTUAL events from the Torah portion in vivid, specific detail. For example, if the story is about the Exodus, you must show the individual plagues, the splitting of the sea, etc. — not just mention them in passing. The child characters must be PRESENT IN and PARTICIPATING IN those actual Torah scenes, witnessing the miracles and events firsthand. Do NOT summarize the Torah events in 1-2 pages and spend the rest on generic adventure. Each Torah event deserves its own page with rich, specific detail.`;

    // The reading level is a PRODUCT rule, not a template detail — append it even
    // when an admin has replaced the system prompt from site_settings, or a custom
    // prompt would silently put every age back on rhyming verse.
    const systemPrompt = `${baseSystemPrompt}\n\n${narrativeStyle}`;

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
- Make the kinderlach the main characters and stars of the story
- OPEN INSIDE THE STORY: Page 1 must begin with the kinderlach ALREADY inside the events of the parsha — no home scene, no setup, no "one day at home," no magical book or glowing light transporting them anywhere. From the first sentence they are simply present within the Torah narrative, part of the action
- STAY IN THE STORY: every page is the actual parsha unfolding. Do NOT bring the child back home at the end, and do NOT use any dream/portal/magic-light device at any point
- END WITH ANTICIPATION: the final page delivers the warm moral and then closes with a single inviting line that builds excitement for the NEXT Torah Tale — hinting another wonderful parsha adventure is waiting next time — so the child can't wait for the next book. Keep it general (do not name a specific next parsha unless given)
- The kinderlach experience the story BY THEMSELVES — do NOT place their ${parentFather}, ${parentMother}, grandparents, or teachers into story scenes as on-scene characters (the illustrations must show only the kinderlach). Torah figures (Moshe Rabbeinu, Avraham Avinu, the meraglim, etc.) appear as the narrative requires. Parents may be warmly referenced in the dedication or closing moral, but never as characters inside a scene
- RHYME: Write the whole story in gentle, flowing RHYME. Each story page is a short rhyming verse — ideally a rhyming couplet (2 lines) or up to 4 short lines with a clear, natural rhyme scheme (AABB or ABCB). Keep the rhymes smooth and unforced, never sing-songy or awkward
- LINE BREAKS — CRITICAL: In each page's "text", put a REAL line break (a "\n" newline) at the END OF EVERY rhyming line / natural phrase, so each phrase sits on its own line and the reader never has to break a phrase mid-thought. One phrase per line. NEVER run two rhyming lines together on one line, and NEVER break in the middle of a phrase. Keep each line short enough to read comfortably on one line (aim for ~6 words / under ~40 characters per line); if a rhyming line is long, split it at a natural pause (a comma or dash) onto two lines rather than letting it run long. Example of a page's "text": "The midbar stretches golden wide,\nbeneath a wide and shining sky,\nas Molly walks with Bnei Yisrael\nwhere Clouds of Glory fly."
- KEEP IT SHORT: each page should be brief — roughly 2 short lines (about 12-24 words total), appropriate for a ${age}-year-old. Favour fewer, well-chosen rhyming words over long sentences
- AGE-APPROPRIATE LANGUAGE: Match the vocabulary and sentence complexity to a ${age}-year-old. For very young children (about 3-5) use simple, concrete everyday words, very short lines, and only the most familiar Hebrew terms (Hashem, sukkah, Torah). For ages 6-8 you may use common Hebrew/Torah terms with the surrounding line making their meaning clear. For ages 9 and up you may use richer vocabulary and more Hebrew/Torah terminology — but every word must still be understandable to a child that age; avoid abstract or unusually difficult words a child that age would not know. When in doubt, choose the clearer, more concrete word.
- UNIFORM LENGTH: EVERY page must be about the same brief length — this INCLUDES PAGE 1. The opening page is NOT a longer scene-setter; it is the same 2 short lines (12-24 words) as all the rest. Do not front-load extra description on page 1
- CRITICAL: At least 70% of the pages MUST depict SPECIFIC, ACTUAL events from the Torah portion. For example, for Va'era show the plagues one by one; for Beshalach show the crossing of the sea; for Bereishit show the days of creation. The child must be IN those scenes, witnessing and participating in the actual events — not just hearing about them or being told the story.
- DOUBLE PARSHA: If the Torah Portion name above joins TWO parshiyos (e.g. "Chukas-Balak", "Matos-Masei", "Tazria-Metzora") this is ONE book covering BOTH. Give balanced coverage to the key events of each parsha — roughly half the story pages for the first, half for the second — so both are meaningfully represented in the single book.
- DO NOT compress the Torah events into 1-2 pages. Spread the key events across most of the book, giving each major event its own page with vivid detail.
- The story MUST teach a clear moral lesson rooted in middos tovos — chesed, emes, hakaras hatov, ometz lev, kibud av va'em, yiras Shamayim
- The kinderlach should discover the hidden lesson by living through the actual events of the Torah story
- The closing moral should show how they can apply the lesson in their own frum lives — at the Shabbos table, in cheder/Bais Yaakov, with their family — and then finish with the warm anticipation line for the next Torah Tale described above
- Boys aged 3+ MUST always wear a yarmulke, have peyos, and tzitzis; boys UNDER 3 do NOT wear a yarmulke, peyos, or tzitzis (pre-upsherin) unless their description explicitly asks for them or their photo clearly shows them. A photo does NOT override this unless those items are visible. Girls MUST wear long sleeves and long skirts — maintain strict tznius throughout
- Use Chareidi terminology: ${parentFather}, ${parentMother}, Rebbe, Morah, davening, bentching, Shabbos, Hashem, sefer/seforim, beis medrash, cheder, Bais Yaakov
- PARENT NAMES — ABSOLUTE CONSISTENCY: whenever the children's parents are mentioned, their father is ALWAYS called "${parentFather}" and their mother is ALWAYS called "${parentMother}" — the exact same pair on the cover title and subtitle, on every story page, in the dedication, the synopsis, and the discussion questions. NEVER mix in any other parent nickname (${["Daddy", "Tatty", "Totty", "Abba", "Ima", "Mommy", "Papa"].filter((n) => n !== parentFather && n !== parentMother).join(", ")}, etc.) anywhere in this book, in any of its languages
- NO references to TV, movies, video games, or secular entertainment
- Maintain the SAME narrative voice and tone across every page — warm, gentle, enchanting like a Yiddishe bubbe telling a maaseh
- ${languageInstruction}
${templateGuidance}

You MUST respond with ONLY a valid JSON object with this exact structure:
{
  "cover": {
    "title": "A short, poetic, PERSONALIZED book title that names the star child AND evokes THIS parsha — e.g. 'Adina and the Great Teivah', 'Moshe and the Sea That Split', 'Dovid and the Hidden Light'. 2 to 6 words, warm and storybook-magical. Name the (first) child. Do NOT put the parsha label itself in the title (e.g. not 'Parshas Noach') — that is displayed separately in gold.",
    "subtitle": "A short evocative tagline, a few words"
  },
  "coverChildName": "The star child's name (or names) EXACTLY as they should be printed on the cover, written in THIS BOOK'S language and script — Hebrew letters for a Hebrew book, Yiddish (Hebrew-alphabet) for a Yiddish book, plain Latin for an English book. Just the child name(s) — NO 'with'/'עם'/'מיט' prefix, no parents, no title. For an English book return the name exactly as given. For multiple children join them naturally in that language (Hebrew example: 'אדינה וארי'). Example: an English name 'Ari' becomes 'ארי' on a Hebrew book.",
  "pages": [
    { "page": 1, "text": "First rhyming line,\nsecond rhyming line", "characters": ["ExactNameFromCharactersArray"] },
    ...
  ],
  "backCover": {
    "synopsis": "A short 1-2 sentence synopsis for the back cover",
    "dedication": "A warm dedication message to the child/children",
    "questions": [
      { "number": 1, "question": "Discussion question 1" },
      { "number": 2, "question": "Discussion question 2" },
      ...up to 10 questions
    ]
  },
  "characters": [
    { "name": "Dovid", "description": "a fixed, detailed visual description used to draw this character identically on every page" }
  ]
}

CHARACTERS ARRAY (CRITICAL for illustration consistency):
- List EVERY recurring named character from the Torah story who appears on more than one page — EXCEPT the star kinderlach themselves (they have their own reference photos). For example: Moshe, Aharon, Dovid, Golias, Paroh, Yishai, the meraglim, a malach, etc.
- For each, write ONE fixed, richly detailed VISUAL description (approx and hair, facial hair, skin tone, exact clothing and colors, headwear, distinguishing features, build/height) that an illustrator will reproduce IDENTICALLY every time that character appears, so the character looks the same on every page.
- Descriptions MUST obey the modesty and Bnei-Yisrael/non-Jew rules above (e.g. Jewish men age 3+ always have covered heads; non-Jews wear distinct foreign dress).
- Include at most 6 characters — the most important recurring ones. If the story has no recurring non-star characters, return an empty array.

PER-PAGE "characters" ARRAY (CRITICAL for illustration consistency):
- On EVERY page object, include a "characters" array listing the EXACT names (spelled identically to the characters array above) of every recurring named character who APPEARS in that page's scene — INCLUDING when the page's text refers to them only by a pronoun (he/she/they), a title (the queen, the wicked one), or does not name them at all but they are clearly present in the scene. This is what tells the illustrator whose fixed description to apply, so a character like Mordechai or Esther looks the SAME on every page they appear on.
- Use an empty array [] for a page where no recurring named character (only the star kinderlach) appears.
- Only list names that exist in the characters array above — never invent a name here.

The questions should be part of the back cover (inside the backCover object):
- Include exactly 10 questions
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
      required: ["cover", "coverChildName", "pages", "backCover"],
      properties: {
        cover: {
          type: "object",
          additionalProperties: false,
          required: ["title", "subtitle"],
          properties: { title: { type: "string" }, subtitle: { type: "string" } },
        },
        coverChildName: { type: "string" },
        pages: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            // `characters` MUST be in the schema: the prompt asks for a per-page
            // characters array, and without a slot for it the model crams the
            // "characters": [...] fragment INTO the text string (leaking garbage
            // like `"characters": …wait, no. (placeholder)` onto the page) AND
            // the per-page character consistency below never receives any names.
            required: ["page", "text", "characters"],
            properties: {
              page: { type: "integer" },
              text: { type: "string" },
              characters: { type: "array", items: { type: "string" } },
            },
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
          // only applies to the Gemini path. We deliberately do NOT use the server-side
          // Opus 4.8 fallback: running two models inside one HTTP request doubled the
          // latency and was the main cause of blowing the edge wall-clock limit. A Fable
          // refusal or stall now degrades to the fast Gemini fallback below instead.
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          };
          const reqBody: Record<string, unknown> = {
            model: storyModel,
            // A 20-page children's story is ~4–6k output tokens. 16000 only allowed
            // a slow long tail that pushed the request past the edge wall-clock limit.
            max_tokens: 10000,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
            output_config: { format: { type: "json_schema", schema: bookSchema } },
          };
          // Bounded so a slow generation degrades to the Gemini fallback instead of
          // blowing the edge wall-clock budget. Supabase kills any Edge Function that
          // hasn't responded within 150s (request idle timeout) and returns a gateway
          // timeout WITHOUT our CORS headers — which the browser surfaces as the opaque
          // "Failed to send a request to the Edge Function". Budget: 75s (Claude) + ~30s
          // (Gemini fallback) + overhead stays comfortably under 150s.
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 75_000);
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
          // Guard against a truncated / confused generation silently producing a
          // STUB book (e.g. it returned only 1-2 of the ${pages} pages). The admin
          // modal slices to the requested count, so a short response just shows a
          // near-empty book. Require a healthy fraction of the pages, else discard
          // and let the Gemini fallback try — better a slower full book than a
          // 2-page one. stop_reason==="max_tokens" means it was cut off mid-JSON.
          if (aData.stop_reason === "max_tokens") {
            throw new Error("Anthropic hit max_tokens (story truncated)");
          }
          const pageThreshold = Math.max(4, Math.ceil(pages * 0.6));
          let returnedPages = 0;
          try {
            const quick = JSON.parse(text);
            returnedPages = Array.isArray(quick?.pages) ? quick.pages.length : 0;
          } catch {
            throw new Error("Anthropic output did not parse as JSON");
          }
          if (returnedPages < pageThreshold) {
            throw new Error(`Anthropic returned only ${returnedPages}/${pages} pages (min ${pageThreshold})`);
          }
          console.log(`Story generated with Anthropic model: ${aData.model || storyModel} — ${returnedPages} pages`);
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

    // Defensive scrub of a page's story text: if the model ever leaks a JSON key
    // fragment INTO the caption (seen on the Gemini fallback, which does not
    // enforce the schema — e.g. `…would be!"characters": …wait, no.
    // (placeholder)`), cut it off at the leaked key and drop any "(placeholder)"
    // marker so the garbage never prints. Conservative: only triggers on the
    // literal leaked-key / placeholder patterns, never on normal prose.
    const cleanPageText = (s: string): string => {
      let out = s;
      // Cut everything from a leaked "characters"/"page"/"text" JSON key onward
      // (these keys never legitimately appear followed by a colon in a caption).
      out = out.replace(/\s*["“”]?\b(?:characters|page|text)\b["“”]?\s*:\s*[\s\S]*$/i, "");
      // Drop any "(placeholder)" self-correction marker.
      out = out.replace(/\s*\(?\s*placeholder\s*\)?/gi, "");
      // Drop a trailing "…wait, no" self-correction left dangling.
      out = out.replace(/\s*(?:\.\.\.|…)?\s*wait,?\s*no\.?\s*$/i, "");
      return out.trim();
    };

    // ── Per-language rhyme QA: re-roll any page whose verse doesn't rhyme ──
    // Hebrew/Yiddish rhyming is the hardest for the model to nail on the first
    // pass, so we audit every page in every language and rewrite only the verses
    // that don't genuinely rhyme. Time-boxed + fail-open so it can never break or
    // time out the main generation (skipped if too little wall-clock remains).
    const wantsRhymeQA = (hasHebrew || hasYiddish)
      && !!ANTHROPIC_API_KEY
      && Array.isArray(parsed.pages) && parsed.pages.length > 0;
    if (wantsRhymeQA && (Date.now() - t0) < 95_000) {
      try {
        const HEB = /[֐-׿]/;
        // Extract the per-language verses for one page (its text may be a bilingual
        // object {english, hebrew}, a single-language string, or a combined string).
        const pageLangs = (val: unknown): Record<string, string> => {
          if (val && typeof val === "object" && !Array.isArray(val)) {
            const o = val as Record<string, unknown>; const r: Record<string, string> = {};
            for (const l of selectedLangs) if (typeof o[l] === "string" && (o[l] as string).trim()) r[l] = o[l] as string;
            return r;
          }
          const s = String(val ?? "");
          if (selectedLangs.length === 1) return { [selectedLangs[0]]: s };
          const parts = s.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
          const heb = parts.filter((p) => HEB.test(p)).join("\n\n");
          const eng = parts.filter((p) => !HEB.test(p)).join("\n\n");
          const r: Record<string, string> = {};
          if (selectedLangs.includes("english") && eng) r.english = eng;
          if (selectedLangs.includes("hebrew") && heb) r.hebrew = heb;
          else if (selectedLangs.includes("yiddish") && heb) r.yiddish = heb;
          return r;
        };
        const inPages = parsed.pages.map((p: any, i: number) => ({
          page: typeof p.page === "number" ? p.page : i + 1,
          ...pageLangs(p.text),
        }));
        const qaSchema = {
          type: "object", additionalProperties: false, required: ["pages"],
          properties: {
            pages: {
              type: "array",
              items: {
                type: "object", additionalProperties: false,
                required: ["page", ...selectedLangs],
                properties: {
                  page: { type: "integer" },
                  ...Object.fromEntries(selectedLangs.map((l) => [l, { type: "string" }])),
                },
              },
            },
          },
        };
        const langList = selectedLangs.map((l) => langNames[l]).join(" and ");
        const qaSystem = `You are a master editor of children's rhyming verse in ${langList}. You make every verse genuinely rhyme without changing its meaning, and you are especially exacting about Hebrew and Yiddish rhyme (matching final stressed syllables, correct grammar and gender/number agreement, full nikud for Hebrew).`;
        const qaUser = `Here are the pages of a children's Torah book. Each page has its verse in ${langList}.
For EVERY page and EVERY language, read the verse aloud in your head and judge whether it GENUINELY RHYMES and flows with a steady beat.
- If a language's verse already rhymes cleanly, return it UNCHANGED.
- If it does NOT truly rhyme (matching end sounds) — most common in Hebrew/Yiddish — REWRITE that language's verse so it genuinely rhymes: keep the same meaning and story beat, keep every child/character name, keep the line breaks (one short phrase per line, "\\n" between lines), fix grammar and gender/number agreement, and use full nikud for Hebrew. Never leave a slant rhyme or a non-rhyme.
Return ALL ${inPages.length} pages, each with the final verse for every language.

PAGES:
${JSON.stringify(inPages, null, 2)}`;
        const qaController = new AbortController();
        const qaTimer = setTimeout(() => qaController.abort(), 45_000);
        let qaResp: Response;
        try {
          qaResp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
            body: JSON.stringify({
              model: storyModel,
              max_tokens: 8000,
              system: qaSystem,
              messages: [{ role: "user", content: qaUser }],
              output_config: { format: { type: "json_schema", schema: qaSchema } },
            }),
            signal: qaController.signal,
          });
        } finally { clearTimeout(qaTimer); }
        if (qaResp.ok) {
          const qaData = await qaResp.json();
          const qaTextOut = (qaData.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
          const qaParsed = JSON.parse(qaTextOut);
          if (Array.isArray(qaParsed?.pages)) {
            const byPage = new Map<number, any>(qaParsed.pages.map((p: any) => [p.page, p]));
            parsed.pages = parsed.pages.map((p: any, i: number) => {
              const key = typeof p.page === "number" ? p.page : i + 1;
              const fix = byPage.get(key);
              if (!fix) return p;
              const langObj: Record<string, string> = {};
              for (const l of selectedLangs) if (typeof fix[l] === "string" && fix[l].trim()) langObj[l] = fix[l];
              if (Object.keys(langObj).length === 0) return p;
              // Single-language book → plain string; multi-language → {lang: text}
              // object, which flattenText joins in the selected-language order.
              const newText = selectedLangs.length === 1 ? langObj[selectedLangs[0]] : langObj;
              return { ...p, text: newText };
            });
            console.log(`Rhyme QA pass applied to ${qaParsed.pages.length} pages (${langList})`);
          }
        } else {
          console.warn(`Rhyme QA call failed [${qaResp.status}] — keeping original verses`);
        }
      } catch (e) {
        console.warn("Rhyme QA pass skipped (fail-open):", e instanceof Error ? e.message : e);
      }
    }

    // Normalize: ensure we have all parts
    const rawPages = Array.isArray(parsed.pages) ? parsed.pages : parsed.pages || [];
    const storyPages = rawPages.map((p: any) => ({
      ...p,
      text: cleanPageText(flattenText(p.text)),
      // Names of recurring characters in this page's scene — drives per-page
      // injection of their fixed visual description so they stay consistent.
      characters: Array.isArray(p.characters)
        ? p.characters.map((n: any) => flattenText(n).trim()).filter(Boolean)
        : [],
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

    // Recurring Torah-story characters (not the star kids) with fixed visual
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
