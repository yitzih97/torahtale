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

// Convert at most `budget.left` images per invocation so a huge book can't
// blow the edge worker's memory — decoding many base64 images at once trips
// WORKER_RESOURCE_LIMIT. Once the budget is spent, remaining data URLs are left
// in place and the caller re-invokes to finish them. Mutates budget.left.
type Budget = { left: number };
async function convertDeep(value: unknown, bookId: string, budget: Budget): Promise<[unknown, number]> {
  if (typeof value === "string") {
    if (value.startsWith("data:image") && budget.left > 0) {
      budget.left -= 1;
      const url = await uploadDataUrl(value, bookId);
      return [url, url === value ? 0 : 1];
    }
    return [value, 0];
  }
  if (Array.isArray(value)) {
    let n = 0;
    const out = [];
    for (const item of value) {
      const [v, c] = await convertDeep(item, bookId, budget);
      out.push(v); n += c;
    }
    return [out, n];
  }
  if (value && typeof value === "object") {
    let n = 0;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const [nv, c] = await convertDeep(v, bookId, budget);
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

  // Cap images converted per invocation to stay under the edge worker's memory
  // limit; a single very large book is finished across several calls.
  const MAX_IMAGES_PER_RUN = 5;

  // Find ONE book that still has an embedded base64 image and process it. Fetch
  // IDs first (tiny), then read one full row at a time.
  const { data: ids, error } = await admin
    .from("books")
    .select("id")
    .order("updated_at", { ascending: true });
  if (error) return json({ error: error.message }, 500);

  const budget: Budget = { left: MAX_IMAGES_PER_RUN };
  let imagesMoved = 0;
  let workedOn: string | null = null;

  for (const { id } of ids || []) {
    const { data: book, error: rErr } = await admin
      .from("books")
      .select("pages_data, story_data, cover_image_url")
      .eq("id", id)
      .maybeSingle();
    if (rErr || !book) { console.error("read failed for", id, rErr?.message); continue; }

    const hasB64 =
      JSON.stringify(book.pages_data ?? "").includes("data:image") ||
      JSON.stringify(book.story_data ?? "").includes("data:image") ||
      (typeof book.cover_image_url === "string" && book.cover_image_url.startsWith("data:image"));
    if (!hasB64) continue; // already fully converted — next book

    workedOn = id;
    const [pages, pc] = await convertDeep(book.pages_data, id, budget);
    const [story, sc] = await convertDeep(book.story_data, id, budget);
    let cover = book.cover_image_url as string | null;
    let cc = 0;
    if (typeof cover === "string" && cover.startsWith("data:image") && budget.left > 0) {
      budget.left -= 1;
      const u = await uploadDataUrl(cover, id);
      if (u !== cover) { cover = u; cc = 1; }
    }
    imagesMoved = pc + sc + cc;
    if (imagesMoved > 0) {
      const { error: upErr } = await admin
        .from("books")
        .update({ pages_data: pages as any, story_data: story as any, cover_image_url: cover, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (upErr) return json({ error: upErr.message, workedOn }, 500);
      console.log(`backfill: ${id} — moved ${imagesMoved} image(s) this pass`);
    }
    break; // one book per invocation — keep memory bounded
  }

  // done when no book still contained a base64 image this scan.
  return json({ workedOn, imagesMoved, done: workedOn === null });
});
