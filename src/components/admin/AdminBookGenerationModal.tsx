import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { BookViewer, type BookPage } from "@/components/wizard/BookViewer";
import { supabase } from "@/integrations/supabase/client";
import { generateBookZip } from "@/lib/generateBookZip";
import { generateBookPdf } from "@/lib/generateBookPdf";
import { submitBookToPrintify } from "@/lib/submitToPrintify";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, CheckCircle2, Save, X, RefreshCw, Square,
  BookOpen, Sparkles, FileDown, Package, PenLine, Image as ImageIcon,
  AlertTriangle, ChevronRight, Wand2, Baby, Palette, Languages, Layers,
} from "lucide-react";
import { getPortionDisplay, bookLanguageCode, isBookRtl, getBackCoverPreviewPortions } from "@/components/wizard/TorahPortions";

type Phase = "idle" | "character" | "story" | "storyReview" | "images" | "done";

/** Per-page illustration status during the images phase. */
type PageStatus = "pending" | "generating" | "done" | "failed" | "skipped";

const IMAGE_CONCURRENCY = 3;

// Every book generates in the signature high-res style, regardless of what
// older rows have stored — the product no longer offers other styles.
const ART_STYLE = "3d-pixar";

interface Props {
  open: boolean;
  onClose: () => void;
  book: any;
  onBookUpdated: () => void;
}

const PAGE_COUNT_CHOICES = [10, 14, 20];

export function AdminBookGenerationModal({ open, onClose, book, onBookUpdated }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [pages, setPages] = useState<BookPage[]>([]);
  const [storyData, setStoryData] = useState<any>(null);
  const [statusText, setStatusText] = useState("");
  const [pageStatuses, setPageStatuses] = useState<PageStatus[]>([]);
  const [doneImages, setDoneImages] = useState(0);
  const [pageCount, setPageCount] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const abortRef = useRef(false);
  const characterSheetsRef = useRef<Record<string, string>>({});
  // Recurring Torah-story characters (Moshe, Dovid, Golias, …) + their reference
  // sheets, so they stay consistent across pages AND across single-page regens.
  const storyCharactersRef = useRef<Array<{ name: string; description: string }>>([]);
  const storyCharacterSheetsRef = useRef<Record<string, string>>({});
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedPagesRef = useRef<string>("");
  const imageDurationsRef = useRef<number[]>([]);

  const sd = useMemo(() => book?.story_data || {}, [book?.story_data]);
  const childDescriptions: any[] = useMemo(() => sd.childDescriptions || [], [sd.childDescriptions]);

  const bookFormat = useMemo(() => {
    // The product type can live in shipping_data (written at checkout) OR
    // story_data (written at the step-9 insert). Prefer whichever actually
    // carries a productType so a coloring/hardcover/board choice isn't lost.
    const shipOpts = (book?.shipping_data as any)?.bookOptions;
    const opts = (shipOpts?.productType ? shipOpts : sd.bookOptions) || {};
    return opts.productType === "hardcover"
      ? `hardcover-${opts.hardcoverSize || "8x8"}`
      : opts.productType === "board" ? "board-6x6"
      : opts.productType === "coloring" ? "coloring-8.5x11" : "softcover-8x8";
  }, [sd.bookOptions, book?.shipping_data]);

  // Persist pages to the books row (used by both auto-save and manual Save).
  const persistPages = useCallback(
    async (nextPages: BookPage[], nextStoryData: any) => {
      if (!book?.id || nextPages.length === 0) return;
      const serialized = JSON.stringify(nextPages);
      if (serialized === lastSavedPagesRef.current) return;
      lastSavedPagesRef.current = serialized;
      try {
        await supabase
          .from("books")
          .update({
            pages_data: nextPages as any,
            story_data: {
              ...(nextStoryData || book.story_data || {}),
              characterSheets: characterSheetsRef.current,
              characters: storyCharactersRef.current,
              _storyCharacterSheets: storyCharacterSheetsRef.current,
            },
            art_style: ART_STYLE,
            cover_image_url: nextPages[0]?.image || null,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", book.id);
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    },
    [book?.id, book?.story_data]
  );

  // Auto-save: debounced persist whenever pages change after generation is done.
  useEffect(() => {
    if (phase !== "done" || pages.length === 0) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      persistPages(pages, storyData);
    }, 800);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [pages, storyData, phase, persistPages]);

  useEffect(() => {
    if (open && book?.pages_data && (book.pages_data as any[]).length > 0) {
      const loaded = book.pages_data as BookPage[];
      setPages(loaded);
      setPhase("done");
      setStatusText("Book loaded — edits save automatically.");
      lastSavedPagesRef.current = JSON.stringify(loaded);
    } else if (open) {
      setPhase("idle");
      setPages([]);
      setStatusText("");
      lastSavedPagesRef.current = "";
    }
    if (open) {
      setConfirmRegen(false);
      // Default the length to the book's product size (softcover/hardcover → 20,
      // board → 10) rather than a flat 10, so regenerating a softcover offers the
      // full 20-page version by default.
      const productType = sd.bookOptions?.productType || "softcover";
      const productDefault = productType === "board" ? 10 : 20;
      setPageCount(sd.pageCount || productDefault);
      // Reuse the sheets from a previous generation so retries/regens keep the
      // exact same character look across sessions.
      characterSheetsRef.current = (sd.characterSheets as Record<string, string>) || {};
      storyCharactersRef.current = (sd.characters as Array<{ name: string; description: string }>) || [];
      storyCharacterSheetsRef.current = (sd._storyCharacterSheets as Record<string, string>) || {};
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, book?.id]);

  /* ─────────────── Phase 1: character sheets (photo-less children only) ─────────────── */

  const generateCharacterSheets = useCallback(async () => {
    // Every child gets a character sheet — it locks ONE canonical outfit and the
    // stylized look, which is what keeps the child consistent across pages. The
    // real photo (when present) is passed as the likeness input. Sheets from a
    // previous run are reused so the look never drifts between regenerations.
    const needsSheet = childDescriptions.filter((c: any) => c?.name && !characterSheetsRef.current[c.name]);
    if (needsSheet.length === 0) return;

    setPhase("character");
    for (let i = 0; i < needsSheet.length; i++) {
      if (abortRef.current) return;
      const child = needsSheet[i];
      setStatusText(`Creating character sheet for ${child.name} (${i + 1}/${needsSheet.length})…`);
      try {
        const { data: sheetData, error: sheetErr } = await supabase.functions.invoke("generate-character-sheet", {
          body: {
            childName: child.name,
            age: child.age || "6",
            gender: child.gender || "boy",
            artStyle: ART_STYLE,
            description: child.description || "",
            referenceImage: child.photoUrl || null,
          },
        });
        if (!sheetErr && sheetData?.imageUrl) {
          characterSheetsRef.current[child.name] = sheetData.imageUrl;
        }
      } catch (err) {
        console.error(`Failed to generate character sheet for ${child.name}:`, err);
      }
    }
  }, [childDescriptions]);

  /* ── Phase 1b: sheets for recurring Torah-story characters (consistency) ── */
  const generateStoryCharacterSheets = useCallback(async () => {
    const chars = storyCharactersRef.current || [];
    const needing = chars.filter((c) => c?.name && !storyCharacterSheetsRef.current[c.name]);
    if (needing.length === 0) return;
    setPhase("character");
    for (let i = 0; i < needing.length; i++) {
      if (abortRef.current) return;
      const ch = needing[i];
      setStatusText(`Creating character reference for ${ch.name} (${i + 1}/${needing.length})…`);
      try {
        // Explicit-prompt render (skips the frum-child scaffolding but keeps the
        // non-negotiable modesty rules) — a clean single-character reference.
        const sheetPrompt = `A clean CHARACTER REFERENCE illustration of ONE single Torah-story character on a plain white studio background, in a ${ART_STYLE} children's book illustration style. Full body, front view, neutral standing pose, even lighting, no scenery and no other characters. The character is ${ch.name}: ${ch.description || ch.name}. Render ONLY this one character, centered. NO text, NO words, NO labels anywhere in the image.`;
        const { data, error } = await supabase.functions.invoke("generate-image", {
          body: { prompt: sheetPrompt, artStyle: ART_STYLE, torahPortion: book.torah_portion, pageType: "character-sheet" },
        });
        if (!error && data?.imageUrl) storyCharacterSheetsRef.current[ch.name] = data.imageUrl;
      } catch (err) {
        console.error(`Failed to generate story-character sheet for ${ch.name}:`, err);
      }
    }
  }, [book?.torah_portion]);

  /* ─────────────── Phase 2: story ─────────────── */

  const generateStory = useCallback(async (): Promise<BookPage[] | null> => {
    setPhase("story");
    setStatusText("Writing the story…");
    try {
      const portionLabel = book.torah_portion ? getPortionDisplay(book.torah_portion, "en") : "";
      // The discussion-questions page prints as its OWN interior page (see
      // renderQuestionsSpread), not composited onto the last story page. Each
      // Printify blueprint's interior capacity is fixed at `pageCount` slots
      // (Cover + pageCount PAGES — see PAGES_BY_TYPE), so one of those slots
      // must go to the questions page: request one fewer story page here or
      // the questions page overflows the print product's slot count and gets
      // silently dropped at submit time.
      const storyPageCount = Math.max(1, pageCount - 1);
      const { data: storyResult, error: storyErr } = await supabase.functions.invoke("generate-story", {
        body: {
          childName: book.child_name,
          childrenInfo: sd.childrenInfo || book.child_name,
          age: childDescriptions[0]?.age || "6",
          gender: childDescriptions[0]?.gender || "boy",
          torahPortion: book.torah_portion,
          torahPortionLabel: portionLabel || book.torah_portion,
          artStyle: ART_STYLE,
          language: book.language || "english",
          pageCount: storyPageCount,
        },
      });
      if (storyErr) throw storyErr;
      if (abortRef.current) return null;

      // Merge onto the existing story_data instead of replacing it. generate-story
      // only returns the story (cover/pages/characters/backCover) — it does NOT
      // return the book "recipe" fields (childDescriptions, childrenInfo,
      // bookOptions, pageCount). Replacing wholesale dropped childDescriptions on
      // every regenerate, which then left illustration with no per-child reference
      // and printed generic kids instead of the real ones. Spread sd first so those
      // recipe fields (and the reused character sheets) survive.
      setStoryData({ ...sd, ...storyResult });
      storyCharactersRef.current = Array.isArray(storyResult.characters) ? storyResult.characters : [];
      const cover = storyResult.cover || { title: `${book.child_name}'s Torah Adventure`, subtitle: "" };
      const questions = storyResult.backCover?.questions || storyResult.questions || [];

      let pageId = 0;
      const allPages: BookPage[] = [];
      allPages.push({
        id: pageId++, text: cover.title, image: null, imageLoading: false,
        type: "cover", coverTitle: cover.title, coverSubtitle: cover.subtitle,
      });
      for (const p of storyResult.pages || []) {
        allPages.push({ id: pageId++, text: p.text, image: null, imageLoading: false, type: "story" });
      }
      if (questions.length > 0) {
        const questionsText = questions.map((q: any) => `${q.number}. ${q.question}`).join("\n");
        allPages.push({
          id: pageId++, text: questionsText, image: null, imageLoading: false,
          type: "questions", questions,
        });
      }
      // Back-cover teasers: the next 4 upcoming parshiyos, rendered as cover-style
      // thumbnails starring the same kids. Generated WITH the book (in the images
      // phase) so they show on the back cover instead of empty boxes.
      for (const { value } of getBackCoverPreviewPortions(book.torah_portion, bookLanguageCode(book.language))) {
        allPages.push({ id: pageId++, text: "", image: null, imageLoading: false, type: "preview", portion: value });
      }
      setPages(allPages);
      return allPages;
    } catch (err: any) {
      toast.error(err?.message || "Story generation failed");
      setPhase("idle");
      setStatusText("");
      return null;
    }
  }, [book, sd.childrenInfo, childDescriptions, pageCount]);

  /* ─────────────── Phase 3: illustrations (concurrent worker pool) ─────────────── */

  const buildImageBody = useCallback((pg: BookPage, pageNumber?: number) => {
    const characterSheetsMap = { ...characterSheetsRef.current };
    // Effective child references. Normally these come from childDescriptions, but
    // if that list is missing (an older book, or one whose recipe was dropped by a
    // past regenerate) fall back to the character-sheet names so the saved sheets
    // are still applied to every page — otherwise the sheet lookup below misses
    // (it would key on the combined "Adina & Ari" instead of "Ari"/"Adina") and
    // the pages print generic kids that ignore the real likenesses.
    const effectiveChildren: any[] = childDescriptions.length
      ? childDescriptions
      : Object.keys(characterSheetsRef.current || {}).map((name) => ({
          name, age: undefined, gender: undefined, description: "", photoUrl: null,
        }));
    const childRefs = effectiveChildren.map((c: any) => ({
      name: c.name,
      age: c.age,
      gender: c.gender,
      description: c.description || "",
      photoUrl: c.photoUrl || null,
      characterSheet: characterSheetsRef.current[c.name] || null,
    }));
    const primaryChildName = effectiveChildren[0]?.name || book.child_name;
    // A "preview" page is a cover-style teaser for a DIFFERENT (upcoming) parsha,
    // still starring these kids — so it uses that portion + a "cover" pageType and
    // drops this story's recurring characters.
    const isPreview = pg.type === "preview";
    // Recurring Torah characters named on this page (all of them on the cover).
    const text = String(pg.text || "").toLowerCase();
    const storyCharacterRefs = isPreview ? [] : (storyCharactersRef.current || [])
      .filter((ch) => ch?.name && (pg.type === "cover" || text.includes(ch.name.toLowerCase())))
      .map((ch) => ({ name: ch.name, description: ch.description || "", sheet: storyCharacterSheetsRef.current[ch.name] || null }));
    return {
      childName: book.child_name,
      artStyle: ART_STYLE,
      torahPortion: isPreview ? pg.portion : book.torah_portion,
      bookFormat,
      pageType: isPreview ? "cover" : pg.type,
      pageNumber: isPreview ? undefined : pageNumber,
      characterSheet: characterSheetsRef.current[primaryChildName] || null,
      referenceImage: effectiveChildren[0]?.photoUrl || null,
      childDescription: effectiveChildren[0]?.description || "",
      characterSheets: characterSheetsMap,
      childRefs,
      storyCharacterRefs,
      pageText: pg.text,
    };
  }, [book, childDescriptions, bookFormat]);

  const illustratePages = useCallback(async (allPages: BookPage[], onlyIndices?: number[]) => {
    setPhase("images");
    imageDurationsRef.current = [];

    // Story-page numbering (1-based, excluding cover) for admin per-page templates.
    const storyNumbers = new Map<number, number>();
    let n = 0;
    allPages.forEach((pg, i) => {
      if (pg.type === "story") storyNumbers.set(i, ++n);
    });

    const targets = (onlyIndices ?? allPages.map((_, i) => i)).filter((i) => allPages[i].type !== "questions");
    const statuses: PageStatus[] = allPages.map((pg, i) =>
      pg.type === "questions" ? "skipped" : targets.includes(i) ? "pending" : pg.image ? "done" : "pending"
    );
    setPageStatuses([...statuses]);
    setDoneImages(statuses.filter((s) => s === "done").length);

    const working = [...allPages];
    const queue = [...targets];

    const worker = async () => {
      while (queue.length > 0) {
        if (abortRef.current) return;
        const idx = queue.shift()!;
        statuses[idx] = "generating";
        setPageStatuses([...statuses]);
        const t0 = Date.now();
        try {
          // Do NOT pass `prompt` — the edge function honors admin per-page
          // templates, the global image-prompt-template, and master rules.
          const { data: imgData } = await supabase.functions.invoke("generate-image", {
            body: buildImageBody(working[idx], storyNumbers.get(idx)),
          });
          const url = imgData?.imageUrl || null;
          working[idx] = { ...working[idx], image: url, imageLoading: false };
          statuses[idx] = url ? "done" : "failed";
        } catch {
          working[idx] = { ...working[idx], image: working[idx].image || null, imageLoading: false };
          statuses[idx] = "failed";
        }
        imageDurationsRef.current.push(Date.now() - t0);
        setPageStatuses([...statuses]);
        setDoneImages(statuses.filter((s) => s === "done").length);
        setPages([...working]);
      }
    };

    await Promise.all(Array.from({ length: Math.min(IMAGE_CONCURRENCY, targets.length) }, worker));

    const failed = statuses.filter((s) => s === "failed").length;
    setPhase("done");
    setStatusText(
      abortRef.current
        ? "Generation stopped — progress saved. You can resume by retrying the remaining pages."
        : failed > 0
          ? `Illustrations complete with ${failed} failed page${failed > 1 ? "s" : ""} — retry them below.`
          : "Book generated and saved — edits keep saving automatically."
    );
    persistPages(working, storyData);
    if (!abortRef.current) {
      if (failed > 0) toast.warning(`${failed} page(s) failed — use "Retry failed pages".`);
      else toast.success("Book generated and saved.");
    }
    return working;
  }, [buildImageBody, persistPages, storyData]);

  /* ─────────────── Flows ─────────────── */

  // Recommended flow: character sheets → story → PAUSE for text review.
  const handleGenerateStory = useCallback(async () => {
    if (!book) return;
    abortRef.current = false;
    await generateCharacterSheets();
    if (abortRef.current) return;
    const result = await generateStory();
    if (result) {
      setPhase("storyReview");
      setStatusText("");
    }
  }, [book, generateCharacterSheets, generateStory]);

  // One-shot flow: everything without the review pause.
  const handleGenerateFull = useCallback(async () => {
    if (!book) return;
    abortRef.current = false;
    await generateCharacterSheets();
    if (abortRef.current) return;
    const result = await generateStory();
    if (!result || abortRef.current) return;
    await generateStoryCharacterSheets();
    if (abortRef.current) return;
    await illustratePages(result);
  }, [book, generateCharacterSheets, generateStory, generateStoryCharacterSheets, illustratePages]);

  const handleIllustrateReviewed = useCallback(async () => {
    abortRef.current = false;
    await generateStoryCharacterSheets();
    if (abortRef.current) return;
    await illustratePages(pages);
  }, [generateStoryCharacterSheets, illustratePages, pages]);

  const handleRetryFailed = useCallback(async () => {
    const failedIdx = pages
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.type !== "questions" && !p.image)
      .map(({ i }) => i);
    if (failedIdx.length === 0) return;
    setRetrying(true);
    abortRef.current = false;
    await illustratePages(pages, failedIdx);
    setRetrying(false);
  }, [pages, illustratePages]);

  const handleStop = () => {
    abortRef.current = true;
    setStatusText("Stopping after the pages currently in flight…");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from("books").update({
        pages_data: pages as any,
        story_data: { ...(storyData || book.story_data || {}), characterSheets: characterSheetsRef.current, characters: storyCharactersRef.current, _storyCharacterSheets: storyCharacterSheetsRef.current },
        cover_image_url: pages[0]?.image || null,
        art_style: ART_STYLE,
        status: "pending_review",
        updated_at: new Date().toISOString(),
      } as any).eq("id", book.id);
      toast.success("Book saved for review!");
      onBookUpdated();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setSaving(true);
    const toastId = toast.loading("Sending to Printify…");
    try {
      // Persist the latest edits, but DON'T claim "approved" yet — approval only
      // means something once Printify accepts the order (the edge function flips
      // the book to "printing" on success). Keep it at pending_review so a failed
      // submit is obvious instead of a book stuck at "approved" with no order.
      await supabase.from("books").update({
        pages_data: pages as any,
        story_data: { ...(storyData || book.story_data || {}), characterSheets: characterSheetsRef.current, characters: storyCharactersRef.current, _storyCharacterSheets: storyCharacterSheetsRef.current },
        cover_image_url: pages[0]?.image || null,
        art_style: ART_STYLE,
        status: "pending_review",
        updated_at: new Date().toISOString(),
      } as any).eq("id", book.id);

      // Render the print-ready images (cover wrap + each page WITH its caption
      // text baked in) and submit — not the raw, text-free stored illustrations.
      const result = await submitBookToPrintify({
        bookId: book.id,
        pages: pages as any,
        childName: book.child_name || "",
        torahPortion: book.torah_portion || "",
        bookFormat,
        lang: bookLanguageCode(book.language),
        rtl: isBookRtl(book.language),
        onProgress: (done, total) => toast.loading(`Uploading print images… ${done}/${total}`, { id: toastId }),
      });
      if (!result.success) {
        console.error("Printify submit error:", result.error);
        toast.error(`Printify submit failed: ${result.error}`, { id: toastId, duration: 12000 });
        onBookUpdated();
        return; // leave the modal open so the admin can retry
      }

      toast.success(
        result.duplicate ? "Already in Printify — order confirmed." : "Book approved & sent to Printify for printing!",
        { id: toastId },
      );
      onBookUpdated();
      onClose();
    } catch (e: any) {
      toast.error(`Failed to submit: ${e?.message || "unexpected error"}`, { id: toastId, duration: 12000 });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!pages.length) return;
    setDownloadingZip(true);
    try {
      const blob = await generateBookZip(pages as any, book.child_name || "book", book.order_number || book.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${book.order_number || book.id}-${book.child_name || "book"}-images.zip`.replace(/\s+/g, "-").toLowerCase();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("ZIP downloaded!");
    } catch { toast.error("ZIP failed"); }
    finally { setDownloadingZip(false); }
  };

  const handleDownloadPdf = async () => {
    if (!pages.length) return;
    setDownloadingPdf(true);
    try {
      const pt = (book as any)?.shipping_data?.bookOptions?.productType;
      const fmt = pt === "board" ? "board-6x6" : pt === "hardcover" ? "hardcover-8x8" : pt === "coloring" ? "coloring-8.5x11" : "softcover-8x8";
      const blob = await generateBookPdf(pages as any, book.child_name || "book", book.torah_portion || "", isBookRtl(book.language), fmt, bookLanguageCode(book.language));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${book.child_name || "book"}-${book.torah_portion || "torah-tale"}.pdf`.replace(/\s+/g, "-").toLowerCase();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    } catch { toast.error("PDF failed"); }
    finally { setDownloadingPdf(false); }
  };

  const handleClose = () => {
    abortRef.current = true;
    onClose();
  };

  /* ─────────────── Derived UI state ─────────────── */

  const illustratable = pages.filter((p) => p.type !== "questions").length;
  const failedCount = phase === "done" ? pages.filter((p) => p.type !== "questions" && !p.image).length : 0;

  const progressPercent =
    phase === "character" ? 4
    : phase === "story" ? 10
    : phase === "storyReview" ? 15
    : phase === "images" ? Math.round(15 + (doneImages / Math.max(illustratable, 1)) * 85)
    : phase === "done" ? 100 : 0;

  const etaText = useMemo(() => {
    if (phase !== "images" || imageDurationsRef.current.length === 0) return "";
    const avg = imageDurationsRef.current.reduce((a, b) => a + b, 0) / imageDurationsRef.current.length;
    const remaining = Math.max(illustratable - doneImages, 0);
    const secs = Math.round((avg * remaining) / IMAGE_CONCURRENCY / 1000);
    if (secs <= 0) return "";
    return secs >= 60 ? `~${Math.ceil(secs / 60)} min left` : `~${secs}s left`;
  }, [phase, doneImages, illustratable]);

  const STEPS: { key: Phase[]; label: string; icon: typeof PenLine }[] = [
    { key: ["idle", "character"], label: "Setup", icon: Baby },
    { key: ["story"], label: "Story", icon: PenLine },
    { key: ["storyReview"], label: "Review Text", icon: BookOpen },
    { key: ["images"], label: "Illustrate", icon: ImageIcon },
    { key: ["done"], label: "Finish", icon: CheckCircle2 },
  ];
  const activeStep = STEPS.findIndex((s) => s.key.includes(phase));

  const summaryChips = [
    { icon: Baby, label: book?.child_name },
    { icon: BookOpen, label: book?.torah_portion ? getPortionDisplay(book.torah_portion, "en") || book.torah_portion : "—" },
    { icon: Palette, label: book?.art_style, cap: true },
    { icon: Languages, label: book?.language || "english", cap: true },
    { icon: Layers, label: bookFormat.replace("-", " · ") },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="w-[calc(100vw-0.75rem)] sm:w-full max-w-5xl max-h-[96vh] overflow-y-auto p-0 gap-0 rounded-2xl sm:rounded-3xl border-border/50 shadow-soft-lg">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl sm:rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:flex w-10 h-10 rounded-2xl bg-accent/10 items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-base sm:text-lg font-bold text-primary truncate">
                  {book?.child_name}'s Book — {book?.torah_portion}
                </h2>
                <p className="text-xs text-muted-foreground">3D Pixar style · <span className="capitalize">{book?.language || "english"}</span></p>
              </div>
            </div>

            {/* Phase stepper */}
            <div className="hidden md:flex items-center gap-1 mx-4">
              {STEPS.map((s, i) => {
                const state = i < activeStep ? "past" : i === activeStep ? "active" : "future";
                return (
                  <div key={s.label} className="flex items-center gap-1">
                    <div
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        state === "active"
                          ? "bg-accent/15 text-accent"
                          : state === "past"
                            ? "text-green-600"
                            : "text-muted-foreground/50"
                      }`}
                    >
                      {state === "past" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                      {s.label}
                    </div>
                    {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/30" />}
                  </div>
                );
              })}
            </div>

            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Compact stepper for phones */}
          <div className="flex md:hidden items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i < activeStep ? "w-3 bg-green-500/70" : i === activeStep ? "w-5 bg-accent" : "w-3 bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground">
              Step {activeStep + 1} of {STEPS.length} · {STEPS[activeStep]?.label}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Progress bar (any generating phase) */}
          <AnimatePresence>
            {(phase === "character" || phase === "story" || phase === "images") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-accent animate-pulse flex-shrink-0" />
                    <span className="text-sm font-medium text-primary truncate">{statusText}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {phase === "images" && (
                      <span className="text-xs text-muted-foreground">
                        {doneImages}/{illustratable} pages{etaText ? ` · ${etaText}` : ""}
                      </span>
                    )}
                    <span className="text-xs font-mono text-muted-foreground">{progressPercent}%</span>
                    <Button variant="outline" size="sm" onClick={handleStop} className="gap-1.5 rounded-lg h-7 px-2.5 text-xs">
                      <Square className="w-3 h-3" /> Stop
                    </Button>
                  </div>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Setup / idle ── */}
          {phase === "idle" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 space-y-6">
              {/* Book summary */}
              <div className="flex flex-wrap justify-center gap-2">
                {summaryChips.map((c, i) => (
                  <span key={i} className={`inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground/80 ${c.cap ? "capitalize" : ""}`}>
                    <c.icon className="w-3.5 h-3.5 text-accent" /> {c.label}
                  </span>
                ))}
              </div>

              {/* Page count */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Story pages:</span>
                {PAGE_COUNT_CHOICES.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPageCount(n)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                      pageCount === n
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border/60 text-muted-foreground hover:border-accent/40"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Two flows */}
              <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <button
                  onClick={handleGenerateStory}
                  className="group text-left rounded-2xl border-2 border-accent/50 bg-accent/5 p-5 hover:border-accent hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                      <PenLine className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-accent bg-accent/10 rounded-full px-2 py-0.5">Recommended</span>
                  </div>
                  <p className="font-display font-bold text-foreground">Write story first, review, then illustrate</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Generate the story text, proofread and edit every page, then illustrate. Catches text issues before spending on images — the top-quality path.
                  </p>
                </button>

                <button
                  onClick={handleGenerateFull}
                  className="group text-left rounded-2xl border border-border/60 bg-card/50 p-5 hover:border-accent/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                      <Wand2 className="w-4 h-4 text-foreground/70" />
                    </div>
                  </div>
                  <p className="font-display font-bold text-foreground">Generate everything in one go</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Story and all illustrations without pausing. Fastest path — review and fix pages at the end.
                  </p>
                </button>
              </div>

              <p className="text-center text-[11px] text-muted-foreground">
                Illustrations run {IMAGE_CONCURRENCY} at a time · every page can be regenerated individually afterwards · progress auto-saves
              </p>
            </motion.div>
          )}

          {/* ── Story text review ── */}
          {phase === "storyReview" && pages.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-accent/10 border border-accent/25">
                <PenLine className="w-4 h-4 text-accent flex-shrink-0" />
                <p className="text-sm text-foreground/80">
                  <span className="font-semibold">Proofread before illustrating.</span> Fix names, nusach, and flow now — each page's text also guides its illustration.
                </p>
              </div>

              <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1">
                {pages.map((pg, i) => (
                  <div key={pg.id} className="rounded-2xl border border-border/50 bg-card/40 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
                      {pg.type === "cover" ? "Cover" : pg.type === "questions" ? "Review Questions (auto page)" : `Page ${i}`}
                    </p>
                    {pg.type === "cover" ? (
                      <div className="space-y-2">
                        <Input
                          value={pg.coverTitle || ""}
                          onChange={(e) => {
                            const next = [...pages];
                            next[i] = { ...pg, coverTitle: e.target.value, text: e.target.value };
                            setPages(next);
                          }}
                          className="rounded-xl font-display font-bold"
                          placeholder="Cover title"
                        />
                        <Input
                          value={pg.coverSubtitle || ""}
                          onChange={(e) => {
                            const next = [...pages];
                            next[i] = { ...pg, coverSubtitle: e.target.value };
                            setPages(next);
                          }}
                          className="rounded-xl text-sm"
                          placeholder="Cover subtitle"
                        />
                      </div>
                    ) : pg.type === "questions" ? (
                      <p className="text-xs text-muted-foreground whitespace-pre-line">{pg.text}</p>
                    ) : (
                      <Textarea
                        value={pg.text}
                        onChange={(e) => {
                          const next = [...pages];
                          next[i] = { ...pg, text: e.target.value };
                          setPages(next);
                        }}
                        className="rounded-xl text-sm min-h-[72px]"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <Button variant="ghost" size="sm" onClick={handleGenerateStory} className="gap-1.5 text-xs text-muted-foreground">
                  <RefreshCw className="w-3 h-3" /> Rewrite story from scratch
                </Button>
                <Button variant="gold" size="lg" onClick={handleIllustrateReviewed} className="gap-2 rounded-2xl w-full sm:w-auto">
                  <ImageIcon className="w-4 h-4" /> Illustrate {illustratable} pages
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Live page grid during illustration ── */}
          {phase === "images" && pages.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
              {pages.map((pg, i) => {
                const st = pageStatuses[i] || "pending";
                return (
                  <div
                    key={pg.id}
                    className={`relative aspect-square rounded-xl overflow-hidden border text-center ${
                      st === "failed" ? "border-red-400/60 bg-red-50" : "border-border/50 bg-muted/40"
                    }`}
                  >
                    {pg.image ? (
                      <img src={pg.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                        {st === "generating" && <Loader2 className="w-4 h-4 animate-spin text-accent" />}
                        {st === "failed" && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        {st === "skipped" && <BookOpen className="w-4 h-4 text-muted-foreground/40" />}
                        <span className="text-[9px] text-muted-foreground">
                          {pg.type === "cover" ? "Cover" : pg.type === "questions" ? "Q&A" : `p.${i}`}
                        </span>
                      </div>
                    )}
                    {st === "generating" && !pg.image && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-sheen" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Book viewer (review/done) ── */}
          {(phase === "done") && pages.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <BookViewer
                childName={book?.child_name || ""}
                torahPortion={book?.torah_portion || ""}
                artStyle={ART_STYLE}
                language={book?.language || "english"}
                pages={pages}
                onPagesChange={setPages}
                editable
                generationContext={{
                  childDescription: childDescriptions[0]?.description || "",
                  referenceImage: childDescriptions[0]?.photoUrl || null,
                  characterSheet: characterSheetsRef.current[childDescriptions[0]?.name || book?.child_name] || null,
                  characterSheets: { ...characterSheetsRef.current },
                  bookFormat,
                  childRefs: childDescriptions.map((c: any) => ({
                    name: c.name,
                    age: c.age,
                    gender: c.gender,
                    description: c.description || "",
                    photoUrl: c.photoUrl || null,
                    characterSheet: characterSheetsRef.current[c.name] || null,
                  })),
                  storyCharacters: (storyCharactersRef.current || []).map((ch) => ({
                    name: ch.name,
                    description: ch.description || "",
                    sheet: storyCharacterSheetsRef.current[ch.name] || null,
                  })),
                }}
              />
            </motion.div>
          )}

          {/* ── Done state ── */}
          {phase === "done" && pages.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className={`flex flex-col sm:flex-row sm:items-center items-start justify-between gap-3 p-3 rounded-2xl border ${
                failedCount > 0
                  ? "bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800"
                  : "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  {failedCount > 0
                    ? <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    : <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />}
                  <span className={`text-sm font-medium ${failedCount > 0 ? "text-amber-700 dark:text-amber-300" : "text-green-700 dark:text-green-300"}`}>
                    {statusText || `${pages.length} pages · ${pages.filter((p) => p.image).length} illustrated`}
                  </span>
                </div>
                {failedCount > 0 && (
                  <Button size="sm" onClick={handleRetryFailed} disabled={retrying} className="gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0">
                    {retrying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Retry {failedCount} failed
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button variant="outline" onClick={handleSave} disabled={saving} className="gap-2 rounded-xl">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </Button>
                <Button
                  variant="default"
                  onClick={handleApprove}
                  disabled={saving || failedCount > 0}
                  title={failedCount > 0 ? "Fix failed pages before approving" : undefined}
                  className="gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Approve & Print
                </Button>
                <Button variant="outline" onClick={handleDownloadZip} disabled={downloadingZip} className="gap-2 rounded-xl">
                  {downloadingZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />} ZIP
                </Button>
                <Button variant="outline" onClick={handleDownloadPdf} disabled={downloadingPdf} className="gap-2 rounded-xl">
                  {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} PDF
                </Button>
              </div>

              <div className="text-center">
                {confirmRegen ? (
                  <div className="inline-flex flex-col items-center gap-3 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950 px-4 py-3">
                    <span className="text-xs text-red-700 dark:text-red-300 font-medium">Overwrite the entire book?</span>
                    {/* Let the admin pick the length when regenerating — the book's
                        stored count is used by default, but they can bump it here. */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Story pages:</span>
                      {PAGE_COUNT_CHOICES.map((n) => (
                        <button
                          key={n}
                          onClick={() => setPageCount(n)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                            pageCount === n
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border/60 text-muted-foreground hover:border-accent/40"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="destructive" className="h-7 rounded-lg text-xs" onClick={() => { setConfirmRegen(false); handleGenerateStory(); }}>
                        Yes, regenerate {pageCount} pages
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs" onClick={() => setConfirmRegen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setConfirmRegen(true)} className="text-xs text-muted-foreground gap-1.5">
                    <Sparkles className="w-3 h-3" /> Re-generate entire book
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
