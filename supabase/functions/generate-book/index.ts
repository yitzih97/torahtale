import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Server-side book generator. Mirrors the admin browser flow
// (src/components/admin/AdminBookGenerationModal.tsx) so a paid book can be
// generated automatically — no admin "Play" click. It orchestrates the existing
// generate-character-sheet / generate-story / generate-image functions (calling
// them with the service-role key, which they accept as an internal call), then
// writes books.pages_data and leaves the book at "pending_review" for the admin
// to review and Approve. Runs in the background (EdgeRuntime.waitUntil) so the
// caller (the orders/paid webhook) returns immediately.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Call a sibling edge function as an internal (service-role) request.
async function callFn(name: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${name} [${res.status}]: ${t.slice(0, 200)}`);
  }
  return res.json();
}

async function callImageWithRetry(body: unknown): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const data = await callFn("generate-image", body);
      if (data?.imageUrl) return data.imageUrl as string;
    } catch (e) {
      console.error(`generate-image attempt ${attempt + 1} failed:`, e);
    }
  }
  return null;
}

function mapBookFormat(productType: string, hardcoverSize = "8x8"): string {
  return productType === "hardcover"
    ? `hardcover-${hardcoverSize}`
    : productType === "board"
    ? "board-6x6"
    : productType === "coloring"
    ? "coloring-8.5x11"
    : "softcover-8x8";
}

const SKIP_STATUSES = ["generating", "pending_review", "approved", "ordered", "printing", "shipped", "delivered"];

async function generate(bookId: string) {
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: book } = await admin.from("books").select("*").eq("id", bookId).maybeSingle();
  if (!book) { console.error("generate-book: book not found:", bookId); return; }

  // Idempotency: don't regenerate a book that already has content or has moved on.
  const hasPages = Array.isArray(book.pages_data) && (book.pages_data as any[]).length > 0;
  if (hasPages || SKIP_STATUSES.includes(book.status)) {
    console.log("generate-book: skipping", bookId, "status=", book.status, "hasPages=", hasPages);
    return;
  }

  await admin.from("books").update({ status: "generating", updated_at: new Date().toISOString() }).eq("id", bookId);
  console.log("generate-book: start", bookId);

  try {
    const sd: any = book.story_data || {};
    const childDescriptions: any[] = sd.childDescriptions || [];

    // ── Phase 1: character reference sheets (parallel per child) ──
    const characterSheets: Record<string, string> = {};
    await Promise.all(childDescriptions.map(async (child: any) => {
      try {
        let photoUrl: string | null = child.photoUrl || null;
        if (!photoUrl && child.hasPhoto) {
          const { data: files } = await admin.storage.from("child-photos").list(book.user_id);
          const match = files?.find((f: any) =>
            (book.child_id && f.name.includes(book.child_id)) ||
            f.name.includes(String(child.name || "").toLowerCase()));
          if (match) {
            const { data: signed } = await admin.storage.from("child-photos")
              .createSignedUrl(`${book.user_id}/${match.name}`, 60 * 60 * 24);
            photoUrl = signed?.signedUrl || null;
          }
        }
        const sheet = await callFn("generate-character-sheet", {
          childName: child.name,
          age: child.age || "6",
          gender: child.gender || "boy",
          artStyle: book.art_style || "cartoon",
          description: child.description || "",
          referenceImage: photoUrl,
        });
        if (sheet?.imageUrl) characterSheets[child.name] = sheet.imageUrl;
      } catch (e) {
        console.error("generate-book: character sheet failed for", child?.name, e);
      }
    }));

    // ── Phase 2: story text ──
    const story = await callFn("generate-story", {
      childName: book.child_name,
      childrenInfo: sd.childrenInfo || book.child_name,
      age: childDescriptions[0]?.age || "6",
      gender: childDescriptions[0]?.gender || "boy",
      torahPortion: book.torah_portion,
      torahPortionLabel: book.torah_portion,
      artStyle: book.art_style,
      language: book.language || "english",
      pageCount: sd.pageCount || 20,
    });

    const cover = story.cover || { title: `${book.child_name}'s Torah Adventure`, subtitle: "" };
    const questions = story.backCover?.questions || story.questions || [];

    let pageId = 0;
    const pages: any[] = [];
    pages.push({ id: pageId++, text: cover.title, image: null, type: "cover", coverTitle: cover.title, coverSubtitle: cover.subtitle });
    for (const p of (story.pages || [])) pages.push({ id: pageId++, text: p.text, image: null, type: "story" });
    if (questions.length > 0) {
      const qText = questions.map((q: any) => `${q.number}. ${q.question}`).join("\n");
      pages.push({ id: pageId++, text: qText, image: null, type: "questions", questions });
    }

    // ── Phase 3: page images (parallel batches; questions page has no image) ──
    const bookOpts = sd.bookOptions || {};
    const bookFormat = mapBookFormat(bookOpts.productType || "softcover", bookOpts.hardcoverSize || "8x8");
    const childRefs = childDescriptions.map((c: any) => ({
      name: c.name, age: c.age, gender: c.gender, description: c.description || "",
      photoUrl: c.photoUrl || null, characterSheet: characterSheets[c.name] || null,
    }));
    const primaryName = childDescriptions[0]?.name || book.child_name;
    const primarySheet = characterSheets[primaryName] || null;
    const primaryDesc = childDescriptions[0]?.description || "";
    const primaryPhoto = childDescriptions[0]?.photoUrl || null;

    let storyPageNumber = 0;
    const tasks: { idx: number; body: any }[] = [];
    pages.forEach((pg, idx) => {
      if (pg.type === "questions") return;
      let pageNumber: number | undefined;
      if (pg.type === "story") { storyPageNumber += 1; pageNumber = storyPageNumber; }
      tasks.push({
        idx,
        body: {
          childName: book.child_name,
          artStyle: book.art_style,
          torahPortion: book.torah_portion,
          bookFormat,
          pageType: pg.type,
          pageNumber,
          characterSheet: primarySheet,
          referenceImage: primaryPhoto,
          childDescription: primaryDesc,
          characterSheets,
          childRefs,
          pageText: pg.text,
        },
      });
    });

    const CONCURRENCY = 6;
    for (let i = 0; i < tasks.length; i += CONCURRENCY) {
      const batch = tasks.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(async (t) => {
        pages[t.idx].image = await callImageWithRetry(t.body);
      }));
    }

    const got = tasks.filter((t) => pages[t.idx].image).length;
    await admin.from("books").update({
      pages_data: pages as any,
      story_data: story,
      cover_image_url: pages[0]?.image || null,
      status: "pending_review",
      updated_at: new Date().toISOString(),
    }).eq("id", bookId);
    console.log(`generate-book: done ${bookId} — ${got}/${tasks.length} images`);
  } catch (e) {
    console.error("generate-book: FAILED", bookId, e);
    // Roll back so the admin can retry via the Play button.
    await admin.from("books").update({ status: "paid", updated_at: new Date().toISOString() }).eq("id", bookId);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Authorize: internal x-cron-secret OR an admin user JWT.
  let authorized = false;
  const cronSecret = Deno.env.get("CRON_SECRET");
  const headerSecret = req.headers.get("x-cron-secret");
  if (cronSecret && headerSecret && headerSecret === cronSecret) {
    authorized = true;
  } else {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const anon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data } = await anon.auth.getClaims(authHeader.replace("Bearer ", ""));
        const uid = data?.claims?.sub;
        if (uid) {
          const admin = createClient(SUPABASE_URL, SERVICE_KEY);
          const { data: role } = await admin.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
          if (role) authorized = true;
        }
      } catch (_e) { /* fall through to 401 */ }
    }
  }
  if (!authorized) return json({ error: "Unauthorized" }, 401);

  let bookId: string | undefined;
  try { ({ bookId } = await req.json()); } catch { /* no body */ }
  if (!bookId) return json({ error: "bookId required" }, 400);

  // Run generation in the background; return immediately.
  // @ts-ignore EdgeRuntime is provided by the Supabase edge runtime.
  EdgeRuntime.waitUntil(generate(bookId));
  return json({ accepted: true, bookId }, 202);
});
