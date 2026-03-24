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

    const systemPrompt = `You are a world-class children's book author who specializes in Jewish stories. You write warm, engaging, age-appropriate stories that weave Torah wisdom into magical adventures. The stories should be vivid, imaginative, and make the children the heroes of the narrative.`;

    const characterDesc = childrenInfo
      ? `Characters: ${childrenInfo}`
      : `Main character: ${childName}, ${age} years old, ${gender}`;

    const userPrompt = `Write a ${pages}-page personalized children's book story.

Details:
- ${characterDesc}
- Torah Portion / Holiday: ${torahPortionLabel} (${torahPortion})
- Art Style: ${artStyle}
- Language: ${language}

Requirements:
- Make the children the main characters and heroes of the story
- Each page should be 2-3 sentences, appropriate for a ${age}-year-old
- Weave the Torah portion's key themes naturally into the adventure
- End with a warm, uplifting moral
- ${language === "bilingual" ? "Write each page in both English and Hebrew" : language === "hebrew" ? "Write in Hebrew" : "Write in English"}

You MUST respond with ONLY a valid JSON array of objects with "page" (number) and "text" (the story text for that page). No markdown, no explanation, just the JSON array.`;

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
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    let storyPages;
    try {
      const parsed = JSON.parse(content);
      storyPages = Array.isArray(parsed) ? parsed : parsed.pages || [];
    } catch {
      const match = content.match(/\[[\s\S]*\]/);
      storyPages = match ? JSON.parse(match[0]) : [];
    }

    return new Response(JSON.stringify({ pages: storyPages }), {
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
