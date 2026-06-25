import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// NOTE: no user-auth gate. The family-photo step runs BEFORE the wizard's login
// gate, so requiring a logged-in user 401'd anonymous users. This function only
// runs vision detection (no DB / no sensitive data), so it is safe to allow the
// anon/publishable key. (verify_jwt is also disabled in config.toml.)

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

// This endpoint is intentionally unauthenticated (it runs before the wizard login
// gate), so it is a soft target for cost-abuse: each call forwards an image to a
// paid vision API. Guard rails: a hard payload cap, a mime allowlist, and a
// best-effort per-IP rate limit. The limiter is in-memory (edge instances are
// ephemeral/distributed, so it is not a hard quota) but cheaply blunts a single
// client hammering one instance.
const MAX_B64_LEN = 12_000_000; // ~9 MB decoded image
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 15;
const ipHits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (ipHits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  ipHits.set(ip, recent);
  // Opportunistic cleanup so the map cannot grow unbounded on a long-lived instance.
  if (ipHits.size > 5000) {
    for (const [k, v] of ipHits) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) ipHits.delete(k);
    }
  }
  return recent.length > RATE_MAX;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY not configured");

    const clientIp = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    if (rateLimited(clientIp)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
      });
    }

    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "imageBase64 required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (imageBase64.length > MAX_B64_LEN) {
      return new Response(JSON.stringify({ error: "Image too large." }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Accept either a raw base64 string or a full data: URL.
    let b64 = imageBase64;
    let mime = mimeType || "image/jpeg";
    const dataMatch = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (dataMatch) { mime = dataMatch[1]; b64 = dataMatch[2]; }

    if (!ALLOWED_MIME.has(mime)) {
      return new Response(JSON.stringify({ error: "Unsupported image type." }), {
        status: 415, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Gemini directly. (The previous Lovable AI gateway + LOVABLE_API_KEY
    // is not available on this self-hosted project.) 45s timeout so the client
    // never spins forever on a stalled upstream request.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    let aiRes: Response;
    try {
      aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{
              role: "user",
              parts: [
                { text: "Detect every person in this family photo and return the JSON." },
                { inline_data: { mime_type: mime, data: b64 } },
              ],
            }],
            // thinkingBudget: 0 disables gemini-2.5-flash's "thinking" phase, which
            // otherwise makes vision calls slow enough to look like an endless spinner.
            generationConfig: { responseMimeType: "application/json", temperature: 0.2, thinkingConfig: { thinkingBudget: 0 } },
          }),
        },
      );
    } finally {
      clearTimeout(timer);
    }

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Gemini error", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI request failed", status: aiRes.status, detail: errText.slice(0, 300) }), {
        status: aiRes.status === 429 ? 429 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await aiRes.json();
    const raw = (payload?.candidates?.[0]?.content?.parts ?? [])
      .map((p: any) => p?.text).filter(Boolean).join("") || "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
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
