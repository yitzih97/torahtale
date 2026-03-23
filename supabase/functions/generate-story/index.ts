import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { childName, age, gender, torahPortion, torahPortionLabel, artStyle, language, pageCount } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a world-class children's book author who specializes in Jewish stories. You write warm, engaging, age-appropriate stories that weave Torah wisdom into magical adventures. The stories should be vivid, imaginative, and make the child the hero of the narrative.`;

    const userPrompt = `Write a ${pageCount || 4}-page personalized children's book story.

Details:
- Child's name: ${childName}
- Age: ${age} years old
- Gender: ${gender}
- Torah Portion / Holiday: ${torahPortionLabel} (${torahPortion})
- Art Style: ${artStyle}
- Language: ${language}

Requirements:
- Make ${childName} the main character and hero of the story
- Each page should be 2-3 sentences, appropriate for a ${age}-year-old
- Weave the Torah portion's key themes naturally into the adventure
- End with a warm, uplifting moral
- ${language === "bilingual" ? "Write each page in both English and Hebrew" : language === "hebrew" ? "Write in Hebrew" : "Write in English"}

Return a JSON array of objects with "page" (number) and "text" (the story text for that page). Nothing else.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-pro-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_story_pages",
              description: "Create the pages of a children's book story",
              parameters: {
                type: "object",
                properties: {
                  pages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        page: { type: "number" },
                        text: { type: "string" },
                      },
                      required: ["page", "text"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["pages"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_story_pages" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const body = await response.text();
      console.error("AI gateway error:", status, body);
      throw new Error(`AI gateway error [${status}]`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let pages;

    if (toolCall) {
      pages = JSON.parse(toolCall.function.arguments).pages;
    } else {
      // Fallback: try to parse content as JSON
      const content = data.choices?.[0]?.message?.content || "[]";
      const match = content.match(/\[[\s\S]*\]/);
      pages = match ? JSON.parse(match[0]) : [];
    }

    return new Response(JSON.stringify({ pages }), {
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
