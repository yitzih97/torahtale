import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// One-shot maintenance: move already-stored base64 book images OUT of the
// database and into the book-images bucket, replacing each data URL with a
// public URL in pages_data / story_data / cover_image_url. This drains the
// row bloat that was wedging Postgres. Idempotent and time-bounded: re-run
// until { remaining: 0 }. Auth: CRON_SECRET header or admin JWT.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WALL_BUDGET_MS = 110_000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

// Upload one base64 data URL to the bucket, return the public URL (or the
// original data URL if anything goes wrong — never lose an image).
async function uploadDataUrl(dataUrl: string, bookId: string): Promise<string> {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return dataUrl;
  const mimeType = m[1];
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  try {
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    const filePath = `${bookId}/backfill/${crypto.randomUUID()}.${ext}`;
    const { error } = await admin.storage.from("book-images").upload(filePath, bytes, { contentType: mimeType, upsert: true });
    if (error) { console.error("upload failed:", error.message); return dataUrl; }
    const { data } = admin.storage.from("book-images").getPublicUrl(filePath);
    return data?.publicUrl || dataUrl;
  } catch (e) {
    console.error("uploadDataUrl threw:", e);
    return dataUrl;
  }
}

// Recursively walk any JSON value; upload every "data:image/...;base64,..."
// string and replace it with its bucket URL. Returns [newValue, count].
async function convertDeep(value: unknown, bookId: string): Promise<[unknown, number]> {
  if (typeof value === "string") {
    if (value.startsWith("data:image")) {
      const url = await uploadDataUrl(value, bookId);
      return [url, url === value ? 0 : 1];
    }
    return [value, 0];
  }
  if (Array.isArray(value)) {
    let n = 0;
    const out = [];
    for (const item of value) {
      const [v, c] = await convertDeep(item, bookId);
      out.push(v); n += c;
    }
    return [out, n];
  }
  if (value && typeof value === "object") {
    let n = 0;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const [nv, c] = await convertDeep(v, bookId);
      out[k] = nv; n += c;
    }
    return [out, n];
  }
  return [value, 0];
}

async function authorize(req: Request): Promise<boolean> {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const headerSecret = req.headers.get("x-cron-secret");
  if (cronSecret && headerSecret && headerSecret === cronSecret) return true;
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  try {
    const anon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data } = await anon.auth.getClaims(authHeader.replace("Bearer ", ""));
    const uid = data?.claims?.sub;
    if (!uid) return false;
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
    return !!role;
  } catch { return false; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!(await authorize(req))) return json({ error: "Unauthorized" }, 401);

  const start = Date.now();
  // Only ~a dozen books — fetch IDs (tiny), then process each full row on its
  // own so we never pull all the base64 blobs in a single response.
  const { data: ids, error } = await admin
    .from("books")
    .select("id")
    .order("updated_at", { ascending: true });
  if (error) return json({ error: error.message }, 500);

  const total = ids?.length || 0;
  let processed = 0, imagesMoved = 0, budgetHit = false;

  for (const { id } of ids || []) {
    if (Date.now() - start > WALL_BUDGET_MS) { budgetHit = true; break; }
    const { data: book, error: rErr } = await admin
      .from("books")
      .select("pages_data, story_data, cover_image_url")
      .eq("id", id)
      .maybeSingle();
    if (rErr || !book) { console.error("read failed for", id, rErr?.message); continue; }

    const [pages, pc] = await convertDeep(book.pages_data, id);
    const [story, sc] = await convertDeep(book.story_data, id);
    let cover = book.cover_image_url as string | null;
    let cc = 0;
    if (typeof cover === "string" && cover.startsWith("data:image")) {
      const u = await uploadDataUrl(cover, id);
      if (u !== cover) { cover = u; cc = 1; }
    }
    if (pc + sc + cc === 0) { processed++; continue; } // already converted — skip write
    const { error: upErr } = await admin
      .from("books")
      .update({ pages_data: pages as any, story_data: story as any, cover_image_url: cover, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (upErr) { console.error("row update failed for", id, upErr.message); continue; }
    processed++; imagesMoved += pc + sc + cc;
    console.log(`backfill: ${id} — moved ${pc + sc + cc} image(s)`);
  }

  // done when we scanned every book this pass without hitting the time budget.
  return json({ scanned: total, processed, imagesMoved, done: !budgetHit });
});
