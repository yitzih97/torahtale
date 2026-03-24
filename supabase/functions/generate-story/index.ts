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

    const pages = Math.min(Math.max(pageCount || 4, 2), 10);

    const systemPrompt = `You are a world-class children's book author who specializes in Jewish stories. You write warm, engaging, age-appropriate stories that weave Torah wisdom into magical adventures. Every story MUST teach a clear moral lesson and positive values — kindness, honesty, gratitude, courage, respect, generosity, empathy. The children should discover the hidden lesson behind the Torah story through their adventure, learning how to apply it in their own lives. The stories should be vivid, imaginative, and make the children the heroes of the narrative. You maintain a consistent narrative voice throughout — warm, gentle, and enchanting like a classic children's book.`;

    const characterDesc = childrenInfo
      ? `Characters: ${childrenInfo}`
      : `Main character: ${childName}, ${age} years old, ${gender}`;

    const userPrompt = `Write a personalized children's book with a front cover, ${pages} story pages, a back cover, and 10 discussion questions.

Details:
- ${characterDesc}
- Torah Portion / Holiday: ${torahPortionLabel} (${torahPortion})
- Art Style: ${artStyle}
- Language: ${language}

Requirements:
- Make the children the main characters and heroes of the story
- Each story page should be 2-3 sentences, appropriate for a ${age}-year-old
- Weave the Torah portion's key themes naturally into the adventure
- The story MUST teach a clear moral lesson and positive values (kindness, honesty, gratitude, courage, respect)
- The children should discover the hidden lesson behind the Torah story through their adventure
- End with a warm, uplifting moral that shows how they can apply the lesson in their own lives
- Maintain the SAME narrative voice and tone across every page — warm, gentle, enchanting
- ${language === "bilingual" ? "Write each page in both English and Hebrew" : language === "hebrew" ? "Write in Hebrew" : "Write in English"}

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.9,
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

    // Normalize: ensure we have all parts
    const storyPages = Array.isArray(parsed.pages) ? parsed.pages : parsed.pages || [];
    const cover = parsed.cover || { title: `${childName}'s Torah Adventure`, subtitle: torahPortionLabel };
    const questions = Array.isArray(parsed.backCover?.questions) ? parsed.backCover.questions : Array.isArray(parsed.questions) ? parsed.questions : [];
    const backCover = {
      synopsis: parsed.backCover?.synopsis || "A magical Torah adventure.",
      dedication: parsed.backCover?.dedication || `For ${childName}, with love.`,
      questions,
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
