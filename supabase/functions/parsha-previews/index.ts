import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Returns one preview illustration URL per requested Torah portion, for the
// "coming next" teaser on a book's back cover. Previews are GENERIC (not tied to
// a child) and cached once per portion in site_settings (category "previews"),
// so the first book that needs a given portion pays for the generation and every
// later book reuses it. Fail-soft: a portion that can't be generated returns a
// null url and the caller falls back to a styled name card.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Admin-only.
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");
    const { data: roleData } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) throw new Error("Not authorized — admin only");

    const body = await req.json();
    const portions: string[] = Array.isArray(body.portions)
      ? body.portions.filter((p: unknown) => typeof p === "string" && p)
      : [];
    if (!portions.length) {
      return new Response(JSON.stringify({ previews: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Preload the cache (category "previews").
    const { data: cachedRows } = await supabase
      .from("site_settings").select("key, value").eq("category", "previews");
    const cache = new Map<string, string>((cachedRows || []).map((r: any) => [r.key, r.value]));

    const previews: { portion: string; url: string | null }[] = [];
    for (const portion of portions) {
      const key = `preview-${portion}`;
      const hit = cache.get(key);
      if (hit) { previews.push({ portion, url: hit }); continue; }
      let url: string | null = null;
      try {
        // Generic cover illustration for this portion (no child personalization).
        const res = await fetch(`${supabaseUrl}/functions/v1/generate-image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            pageType: "cover",
            torahPortion: portion,
            artStyle: "3d-pixar",
            childName: "",
            promptAdditions: "A gentle, inviting book-cover teaser image for this story. No child required. No text.",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          url = typeof data?.imageUrl === "string" ? data.imageUrl : null;
        } else {
          console.error(`preview gen failed for ${portion}: ${res.status} ${(await res.text()).slice(0, 160)}`);
        }
      } catch (e) {
        console.error(`preview gen error for ${portion}:`, e);
      }
      if (url) {
        // Best-effort cache (service role bypasses RLS). Never fail the request on this.
        try {
          await supabase.from("site_settings").upsert(
            { category: "previews", key, value: url },
            { onConflict: "category,key" },
          );
        } catch (e) { console.error("preview cache write failed:", e); }
      }
      previews.push({ portion, url });
    }

    return new Response(JSON.stringify({ previews }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parsha-previews error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
