import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Server-side book generator. Mirrors the admin browser flow
// (src/components/admin/AdminBookGenerationModal.tsx) so a paid book can be
// generated automatically — no admin "Play" click. It orchestrates the existing
// generate-character-sheet / generate-story / generate-image functions (calling
// them with the service-role key, which they accept as an internal call), then
// writes books.pages_data and leaves the book at "pending_review".
//
// RESUMABLE: image models (esp. gpt-image-2) are slow, and a full ~22-image book
// can exceed the edge wall-clock limit (Free 150s / Paid 400s). So instead of
// doing everything in one invocation, each run does a TIME-BOUNDED slice —
// character sheets, then the story, then as many image batches as fit in the
// budget — PERSISTS progress to the book after every step, and if work remains
// re-invokes itself (a fresh worker = a fresh wall-clock budget). This makes
// generation reliable on any plan: no single invocation must finish the book.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Per-invocation wall-clock budget. Kept safely under the Free-plan 150s limit
// by default (leaves room for one in-flight batch + the final persist). Bump via
// GEN_WALL_BUDGET_MS on a Paid plan (400s limit) to do more per invocation.
const WALL_BUDGET_MS = parseInt(Deno.env.get("GEN_WALL_BUDGET_MS") || "100000");
const CONCURRENCY = 6;
const MAX_PASSES = 30; // hard cap on self-re-invocations (runaway guard)

// Book has moved past generation — never touch it.
const TERMINAL = ["pending_review", "approved", "ordered", "printing", "shipped", "delivered"];

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
  for (let attempt = 0; attempt < 3; attempt++) {
    // Cool-off before the retry — an immediate re-fire against a rate-limited
    // provider just burns the attempt and forces another full pass later.
    if (attempt > 0) await new Promise((r) => setTimeout(r, 6_000));
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

// Re-trigger this same function for the next slice. The new request is a fresh
// edge worker with a fresh wall-clock budget. It returns 202 immediately (the
// work runs in its own background task), so we just fire it and let go.
async function reinvoke(bookId: string): Promise<boolean> {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    console.error("generate-book: CRON_SECRET missing — cannot chain resume for", bookId);
    return false;
  }
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/generate-book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": cronSecret,
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ bookId, resume: true }),
    });
    return true;
  } catch (e) {
    console.error("generate-book: reinvoke failed for", bookId, e);
    return false;
  }
}

// ── Back-cover "coming next" teasers ────────────────────────────────────────
// The 4 upcoming stories to preview on the back cover (generated WITH the book,
// so they show up in the preview — not lazily at print time). For a Megilla we
// show the OTHER Megillos; otherwise the next parshiyos in reading order.
const MEGILLOT = ["esther", "ruth", "shir-hashirim", "kohelet", "eicha"];
const TORAH_ORDER = [
  "bereishit", "noach", "lech-lecha", "vayera", "chayei-sarah", "toldot", "vayetzei", "vayishlach",
  "vayeshev", "miketz", "vayigash", "vayechi", "shemot", "vaera", "bo", "beshalach", "yitro",
  "mishpatim", "terumah", "tetzaveh", "ki-tisa", "vayakhel", "pekudei", "vayikra", "tzav", "shemini",
  "tazria", "metzora", "acharei-mot", "kedoshim", "emor", "behar", "bechukotai", "bamidbar", "naso",
  "behaalotecha", "shelach", "korach", "chukat", "balak", "pinchas", "matot", "masei", "devarim",
  "vaetchanan", "eikev", "reeh", "shoftim", "ki-teitzei", "ki-tavo", "nitzavim", "vayelech",
  "haazinu", "vezot-habracha",
];
// Each back-cover teaser re-dresses the kids in a different (modest) outfit so
// the "coming next" row looks varied and attractive instead of four identical
// looks. Cycled by teaser index; generate-image enforces identity + tznius.
const PREVIEW_OUTFITS = [
  "festive Shabbos best — boys in a navy vest over a crisp white shirt, girls in an elegant navy-and-cream long-sleeved dress",
  "warm autumn knits — boys in a rust-brown sweater, girls in a mustard-gold long-sleeved dress with a cozy cream cardigan",
  "fresh spring colors — boys in a soft sage-green shirt, girls in a blush-pink long-sleeved floral dress",
  "royal celebration — boys in a burgundy sweater-vest over a white shirt, girls in a deep burgundy velvet long-sleeved dress with delicate gold trim",
];

function upcomingPortions(current: string): string[] {
  if (MEGILLOT.includes(current)) return MEGILLOT.filter((m) => m !== current).slice(0, 4);
  const i = TORAH_ORDER.indexOf(current);
  if (i >= 0) {
    const out: string[] = [];
    for (let k = 1; out.length < 4 && k <= TORAH_ORDER.length; k++) out.push(TORAH_ORDER[(i + k) % TORAH_ORDER.length]);
    return out;
  }
  return TORAH_ORDER.slice(0, 4);
}

// Build the generate-image task bodies for every page that still needs an image.
// storyPageNumber is counted across ALL story pages (done or not) so numbering
// stays stable across resumes.
function buildPendingTasks(
  pages: any[],
  book: any,
  sdState: any,
  sheets: Record<string, string>,
  storyChars: Array<{ name: string; description: string }> = [],
  storySheets: Record<string, string> = {},
) {
  const bookOpts = sdState.bookOptions || {};
  const bookFormat = mapBookFormat(bookOpts.productType || "softcover", bookOpts.hardcoverSize || "8x8");
  const childDescriptions: any[] = sdState.childDescriptions || [];
  const childRefs = childDescriptions.map((c: any) => ({
    name: c.name, age: c.age, gender: c.gender, description: c.description || "",
    photoUrl: c.photoUrl || null, characterSheet: sheets[c.name] || null,
  }));
  const primaryName = childDescriptions[0]?.name || book.child_name;
  const primarySheet = sheets[primaryName] || null;
  const primaryDesc = childDescriptions[0]?.description || "";
  const primaryPhoto = childDescriptions[0]?.photoUrl || null;
  const primaryAge = childDescriptions[0]?.age ?? null; // `??` not `||` — age 0 is valid

  let storyPageNumber = 0;
  const tasks: { idx: number; body: any }[] = [];
  pages.forEach((pg, idx) => {
    if (pg.type === "story") storyPageNumber += 1;
    if (pg.type === "questions") return; // questions page has no image
    if (pg.image) return; // already generated — skip

    // Recurring Torah-story characters mentioned on THIS page — pass their fixed
    // descriptions (always) and reference sheets (when available) so they render
    // consistently. Cover features whichever characters lead the story.
    const text = String(pg.text || "").toLowerCase();
    const relevant = storyChars.filter((ch) =>
      ch?.name && (pg.type === "cover" || text.includes(ch.name.toLowerCase())),
    );
    const storyCharacterRefs = relevant.map((ch) => ({
      name: ch.name,
      description: ch.description || "",
      sheet: storySheets[ch.name] || null,
    }));

    // A "preview" page is a cover-style teaser for a DIFFERENT (upcoming) parsha,
    // still starring this child — so it uses that portion + a cover pageType, and
    // drops this story's recurring characters.
    const isPreview = pg.type === "preview";
    tasks.push({
      idx,
      body: {
        bookId: book.id,
        childName: book.child_name,
        age: primaryAge,
        artStyle: book.art_style,
        torahPortion: isPreview ? pg.portion : book.torah_portion,
        bookFormat,
        pageType: isPreview ? "cover" : pg.type,
        outfitVariant: isPreview ? pg.outfit || undefined : undefined,
        pageNumber: pg.type === "story" ? storyPageNumber : undefined,
        characterSheet: primarySheet,
        referenceImage: primaryPhoto,
        childDescription: primaryDesc,
        characterSheets: sheets,
        childRefs,
        storyCharacterRefs: isPreview ? [] : storyCharacterRefs,
        pageText: pg.text,
      },
    });
  });
  return tasks;
}

async function generate(bookId: string) {
  const start = Date.now();
  const overBudget = () => Date.now() - start > WALL_BUDGET_MS;
  const now = () => new Date().toISOString();
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: book } = await admin.from("books").select("*").eq("id", bookId).maybeSingle();
  if (!book) { console.error("generate-book: book not found:", bookId); return; }

  // Idempotency: never reprocess a book that has moved past generation.
  if (TERMINAL.includes(book.status)) {
    console.log("generate-book: skipping", bookId, "status=", book.status);
    return;
  }

  // Mutable resume state lives on books.story_data (jsonb). It starts as the
  // wizard's story_data (childDescriptions / childrenInfo / pageCount /
  // bookOptions) and accumulates the generated story + character sheets +
  // bookkeeping (_genPass / _noProgress) as we go.
  let sdState: any = (book.story_data as any) || {};
  let pages: any[] | null = Array.isArray(book.pages_data) && (book.pages_data as any[]).length
    ? (book.pages_data as any[]) : null;

  const pass = (sdState._genPass || 0) + 1;
  sdState = { ...sdState, _genPass: pass };
  console.log(`generate-book: pass ${pass} for ${bookId} (status=${book.status})`);

  const persist = (extra: Record<string, unknown> = {}) =>
    admin.from("books").update({
      story_data: sdState as any,
      ...(pages ? { pages_data: pages as any } : {}),
      status: "generating",
      updated_at: now(),
      ...extra,
    }).eq("id", bookId);

  const finalize = async () => {
    const cover = (pages || []).find((p) => p.type === "cover")?.image || (pages || [])[0]?.image || null;
    const got = (pages || []).filter((p) => p.image).length;
    await admin.from("books").update({
      pages_data: pages as any,
      story_data: sdState as any,
      cover_image_url: cover,
      status: "pending_review",
      updated_at: now(),
    }).eq("id", bookId);
    console.log(`generate-book: COMPLETE ${bookId} — ${got} images, ${pass} pass(es)`);
  };

  try {
    // Backfill back-cover teaser pages onto books made before previews existed,
    // so re-running generation adds (and then fills) them too.
    if (pages && !pages.some((p) => p.type === "preview")) {
      let maxId = pages.reduce((m, p) => Math.max(m, p.id || 0), 0);
      const backfillPortions = upcomingPortions(book.torah_portion);
      for (let i = 0; i < backfillPortions.length; i++) {
        pages.push({ id: ++maxId, text: "", image: null, type: "preview", portion: backfillPortions[i], outfit: PREVIEW_OUTFITS[i % PREVIEW_OUTFITS.length] });
      }
      await persist();
    }

    // Already fully generated (incl. teasers)? Just mark it for review and stop.
    // (Teasers ARE required here so an existing book flows into Phase C to fill
    // them; a teaser that then fails to generate won't block finalize — see below.)
    if (pages && pages.filter((p) => p.type !== "questions" && !p.image).length === 0) {
      await finalize();
      return;
    }

    if (pass > MAX_PASSES) {
      console.warn(`generate-book: pass cap reached for ${bookId} — finalizing with whatever exists`);
      if (pages) await finalize();
      else await admin.from("books").update({ status: "paid", updated_at: now() }).eq("id", bookId);
      return;
    }

    // ── Phase A: character reference sheets (once) ──
    if (!sdState._sheetsDone) {
      const childDescriptions: any[] = sdState.childDescriptions || [];
      const sheets: Record<string, string> = sdState._characterSheets || {};
      await Promise.all(childDescriptions.map(async (child: any) => {
        if (sheets[child.name]) return; // already have this child's sheet
        // Every child gets a character sheet — it locks ONE canonical outfit and
        // the stylized look, which is what keeps the child consistent across
        // pages. The real photo (when present) is passed as the likeness input.
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
            bookId: book.id,
            childName: child.name,
            age: child.age || "6",
            gender: child.gender || "boy",
            artStyle: book.art_style || "cartoon",
            description: child.description || "",
            referenceImage: photoUrl,
            torahPortion: book.torah_portion,
          });
          if (sheet?.imageUrl) sheets[child.name] = sheet.imageUrl;
        } catch (e) {
          console.error("generate-book: character sheet failed for", child?.name, e);
        }
      }));
      sdState = { ...sdState, _characterSheets: sheets, _sheetsDone: true };
      await persist();
    }
    const sheets: Record<string, string> = sdState._characterSheets || {};

    // Out of budget after the (slow) sheet phase? Hand off to a fresh worker.
    if (overBudget()) { await reinvoke(bookId); return; }

    // ── Phase B: story text + page skeleton (once) ──
    // The Claude story call is bounded at ~110s inside generate-story, so it must
    // START with most of the wall clock still available — otherwise a late start
    // can blow past the edge runtime's hard kill. If the sheet phase already ate
    // a chunk of this pass, hand the story off to a fresh worker instead.
    if (!pages && Date.now() - start > 25_000) { await persist(); await reinvoke(bookId); return; }
    if (!pages) {
      // Reserve one interior print slot for the discussion-questions page: the
      // Printify blueprint has exactly `pageCount` interior slots (Cover +
      // pageCount PAGES), and the questions page takes one, so ask for one fewer
      // story page — and hard-cap below in case the LLM overshoots — or the book
      // ends up over the slot count and Printify submit hard-fails ("22 vs 21").
      const pageCount = sdState.pageCount || 20;
      const storyPageCount = Math.max(1, pageCount - 1);
      const story = await callFn("generate-story", {
        childName: book.child_name,
        childrenInfo: sdState.childrenInfo || book.child_name,
        age: (sdState.childDescriptions?.[0]?.age) || "6",
        gender: (sdState.childDescriptions?.[0]?.gender) || "boy",
        torahPortion: book.torah_portion,
        torahPortionLabel: book.torah_portion,
        artStyle: book.art_style,
        language: book.language || "english",
        pageCount: storyPageCount,
      });

      const cover = story.cover || { title: `${book.child_name}'s Torah Adventure`, subtitle: "" };
      const questions = story.backCover?.questions || story.questions || [];

      let pageId = 0;
      pages = [];
      pages.push({ id: pageId++, text: cover.title, image: null, type: "cover", coverTitle: cover.title, coverSubtitle: cover.subtitle });
      for (const p of (story.pages || []).slice(0, storyPageCount)) pages.push({ id: pageId++, text: p.text, image: null, type: "story" });
      if (questions.length > 0) {
        const qText = questions.map((q: any) => `${q.number}. ${q.question}`).join("\n");
        pages.push({ id: pageId++, text: qText, image: null, type: "questions", questions });
      }
      // Back-cover teasers for the next 4 stories — generated now (with the book)
      // so they appear in the preview. Best-effort: failures never block the book.
      const teaserPortions = upcomingPortions(book.torah_portion);
      for (let i = 0; i < teaserPortions.length; i++) {
        pages.push({ id: pageId++, text: "", image: null, type: "preview", portion: teaserPortions[i], outfit: PREVIEW_OUTFITS[i % PREVIEW_OUTFITS.length] });
      }
      // Keep the generated story at the top level (existing downstream contract)
      // while retaining the resume fields (childDescriptions / _characterSheets).
      sdState = { ...sdState, ...story, _characterSheets: sheets, _sheetsDone: true, _storyBuilt: true };
      await persist();
    }

    // ── Phase B2: reference sheets for recurring Torah-story characters (once) ──
    // Each named non-star character (Moshe, Dovid, Golias, …) gets one fixed
    // reference so they look identical on every page they appear. Bounded +
    // resumable; fully fail-open — a book still generates without them.
    const storyChars: Array<{ name: string; description: string }> =
      Array.isArray(sdState.characters) ? sdState.characters : [];
    const storySheets: Record<string, string> = sdState._storyCharacterSheets || {};
    if (storyChars.length > 0 && !sdState._storyCharsDone) {
      const styleName = book.art_style || "cartoon";
      for (const ch of storyChars) {
        if (!ch?.name || storySheets[ch.name]) continue;
        if (overBudget()) { await persist(); await reinvoke(bookId); return; }
        try {
          // Render a clean single-character reference via generate-image's explicit
          // `prompt` path (skips the frum-child scaffolding but still enforces the
          // non-negotiable modesty rules, which apply even on explicit prompts).
          const sheetPrompt = `A clean CHARACTER REFERENCE illustration of ONE single Torah-story character on a plain white studio background, in a ${styleName} children's book illustration style. Full body, front view, neutral standing pose, even lighting, no scenery and no other characters. The character is ${ch.name}: ${ch.description || ch.name}. Render ONLY this one character, centered. NO text, NO words, NO labels anywhere in the image.`;
          const sheet = await callFn("generate-image", {
            bookId: book.id,
            prompt: sheetPrompt,
            artStyle: book.art_style,
            torahPortion: book.torah_portion,
            pageType: "character-sheet",
          });
          if (sheet?.imageUrl) storySheets[ch.name] = sheet.imageUrl;
        } catch (e) {
          console.error("generate-book: story character sheet failed for", ch?.name, e);
        }
      }
      sdState = { ...sdState, _storyCharacterSheets: storySheets, _storyCharsDone: true };
      await persist();
    }

    // ── Phase C: page images, time-bounded, persisted after each batch ──
    const tasks = buildPendingTasks(pages, book, sdState, sheets, storyChars, storySheets);
    let madeProgress = 0;
    for (let i = 0; i < tasks.length; i += CONCURRENCY) {
      if (overBudget()) {
        await persist();
        const ok = await reinvoke(bookId);
        console.log(`generate-book: budget hit for ${bookId} — ${tasks.length - i} image(s) left, handed off (${ok})`);
        if (ok) return; // a fresh worker will continue
        // couldn't chain (no CRON_SECRET) — fall through and finalize partial
        break;
      }
      const batch = tasks.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(async (t) => {
        const url = await callImageWithRetry(t.body);
        if (url) { pages![t.idx].image = url; madeProgress++; }
      }));
      await persist(); // save progress so a crash/timeout never loses finished pages
    }

    // All pending tasks attempted this pass. Anything still missing = failures.
    // Preview teasers are best-effort and never block finalize.
    const remaining = pages.filter((p) => p.type !== "questions" && p.type !== "preview" && !p.image).length;
    if (remaining === 0) { await finalize(); return; }

    const noProgress = madeProgress === 0 ? (sdState._noProgress || 0) + 1 : 0;
    sdState = { ...sdState, _noProgress: noProgress };
    // Keep retrying the still-missing pages across fresh workers. Only give up
    // after several consecutive passes make ZERO progress (a genuinely stuck
    // page) so a transient burst of rate-limits/timeouts doesn't leave a
    // subscriber's book with blank pages that an admin has to fix by hand.
    if (noProgress >= 4 || pass >= MAX_PASSES) {
      console.warn(`generate-book: ${remaining} image(s) still missing for ${bookId} after retries — finalizing partial (admin can regenerate)`);
      await finalize();
      return;
    }
    await persist();
    await reinvoke(bookId); // retry the still-missing images on a fresh worker
  } catch (e) {
    console.error("generate-book: pass FAILED", bookId, "pass", pass, e);
    if (pass < MAX_PASSES && (await reinvoke(bookId))) return; // retry from last checkpoint
    // Give up: roll back so the admin can retry via the Play button.
    await admin.from("books").update({ status: "paid", updated_at: now() }).eq("id", bookId);
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

  // Run this slice in the background; return immediately.
  // @ts-ignore EdgeRuntime is provided by the Supabase edge runtime.
  EdgeRuntime.waitUntil(generate(bookId));
  return json({ accepted: true, bookId }, 202);
});
