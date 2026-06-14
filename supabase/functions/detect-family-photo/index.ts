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

const SYSTEM_PROMPT = `You are a vision assistant helping detect people in a family photo for an Orthodox Jewish children's book app.

Return STRICT JSON with shape:
{
  "people": [
    {
      "role": "tatty" | "mommy" | "child",
      "gender": "boy" | "girl",
      "approxAge": number,            // best-guess age in years
      "description": string,           // short visual description (hair, clothing, peyos, kippah, head-covering, etc.)
      "bbox": { "x": number, "y": number, "w": number, "h": number }  // normalized 0..1, tight crop around the head & shoulders
    }
  ]
}

Rules:
- "tatty" = father (adult man), "mommy" = mother (adult woman), "child" = anyone under ~17.
- For children, set gender ("boy"/"girl") accurately.
- bbox MUST be normalized [0..1] of the image dimensions, framing head + upper shoulders generously (~1.4x face height) so the crop reads as a portrait.
- Order: oldest → youngest, parents first.
- If no people are detected, return { "people": [] }.
- Output JSON only, no prose, no markdown fences.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authErr = await requireUser(req);
  if (authErr) return authErr;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "imageBase64 required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:${mimeType || "image/jpeg"};base64,${imageBase64}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Detect every person in this family photo and return the JSON." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI request failed", status: aiRes.status, detail: errText }), {
        status: aiRes.status === 402 || aiRes.status === 429 ? aiRes.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await aiRes.json();
    const raw = payload?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      const m = String(raw).match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { people: [] };
    }

    const people = Array.isArray(parsed?.people) ? parsed.people : [];
    const clean = people
      .map((p: any) => ({
        role: ["tatty", "mommy", "child"].includes(p?.role) ? p.role : "child",
        gender: p?.gender === "girl" ? "girl" : "boy",
        approxAge: Math.max(0, Math.min(99, Number(p?.approxAge) || 0)),
        description: typeof p?.description === "string" ? p.description.slice(0, 400) : "",
        bbox: {
          x: Math.max(0, Math.min(1, Number(p?.bbox?.x) || 0)),
          y: Math.max(0, Math.min(1, Number(p?.bbox?.y) || 0)),
          w: Math.max(0.05, Math.min(1, Number(p?.bbox?.w) || 0.3)),
          h: Math.max(0.05, Math.min(1, Number(p?.bbox?.h) || 0.3)),
        },
      }))
      .slice(0, 8);

    return new Response(JSON.stringify({ people: clean }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("detect-family-photo error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
