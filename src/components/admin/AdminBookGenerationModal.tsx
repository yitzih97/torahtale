import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookViewer, type BookPage } from "@/components/wizard/BookViewer";
import { supabase } from "@/integrations/supabase/client";
import { generateBookZip } from "@/lib/generateBookZip";
import { generateBookPdf } from "@/lib/generateBookPdf";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Loader2, CheckCircle2, Download, Save, X,
  BookOpen, Sparkles, FileDown, Package,
} from "lucide-react";

type Phase = "idle" | "story" | "images" | "done";

interface Props {
  open: boolean;
  onClose: () => void;
  book: any;
  onBookUpdated: () => void;
}

export function AdminBookGenerationModal({ open, onClose, book, onBookUpdated }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [pages, setPages] = useState<BookPage[]>([]);
  const [storyData, setStoryData] = useState<any>(null);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const abortRef = useRef(false);

  // If book already has pages, load them for editing
  useEffect(() => {
    if (open && book?.pages_data && (book.pages_data as any[]).length > 0) {
      setPages(book.pages_data as BookPage[]);
      setPhase("done");
      setStatusText("Book loaded — edit and save changes.");
    } else if (open) {
      setPhase("idle");
      setPages([]);
      setStatusText("");
    }
  }, [open, book?.id]);

  const handleGenerate = useCallback(async () => {
    if (!book) return;
    abortRef.current = false;
    setPhase("story");
    setStatusText("Generating story text...");
    setPages([]);

    try {
      const sd = book.story_data || {};
      const { data: storyResult, error: storyErr } = await supabase.functions.invoke("generate-story", {
        body: {
          childName: book.child_name,
          childrenInfo: sd.childrenInfo || book.child_name,
          age: sd.childDescriptions?.[0]?.age || "6",
          gender: sd.childDescriptions?.[0]?.gender || "boy",
          torahPortion: book.torah_portion,
          torahPortionLabel: book.torah_portion,
          artStyle: book.art_style,
          language: book.language || "english",
          pageCount: sd.pageCount || 4,
        },
      });
      if (storyErr) throw storyErr;
      if (abortRef.current) return;

      setStoryData(storyResult);
      const cover = storyResult.cover || { title: `${book.child_name}'s Torah Adventure`, subtitle: "" };
      const backCover = storyResult.backCover || { synopsis: "", dedication: "" };
      const questions = storyResult.backCover?.questions || storyResult.questions || [];

      let pageId = 0;
      const allPages: BookPage[] = [];
      allPages.push({ id: pageId++, text: cover.title, image: null, imageLoading: true, type: "cover", coverTitle: cover.title, coverSubtitle: cover.subtitle });
      for (const p of storyResult.pages || []) {
        allPages.push({ id: pageId++, text: p.text, image: null, imageLoading: true, type: "story" });
      }
      allPages.push({ id: pageId++, text: backCover.synopsis || "", image: null, imageLoading: true, type: "back-cover", synopsis: backCover.synopsis, dedication: backCover.dedication, questions });

      setPages(allPages);
      setPhase("images");
      setTotalImages(allPages.length);
      setCurrentImageIdx(0);

      const styleMap: Record<string, string> = {
        cartoon: "colorful cartoon illustration, soft watercolor textures, children's book style",
        "3d-pixar": "3D Pixar-style CGI render, warm lighting, soft shadows",
        realistic: "photorealistic illustration, natural lighting, lifelike detail, warm cinematic tones",
      };
      const style = styleMap[book.art_style] || styleMap.cartoon;

      const bookOpts = sd.bookOptions || {};
      const productType = bookOpts.productType || "softcover";
      const hardcoverSize = bookOpts.hardcoverSize || "8x8";
      const bookFormat = productType === "hardcover"
        ? `hardcover-${hardcoverSize}`
        : productType === "board"
        ? "board-6x6"
        : "softcover-8x8";

      for (let i = 0; i < allPages.length; i++) {
        if (abortRef.current) return;
        setCurrentImageIdx(i);
        const pg = allPages[i];
        setStatusText(`Generating image ${i + 1} of ${allPages.length}...`);

        const prompt = pg.type === "cover"
          ? `A stunning children's book FRONT COVER illustration. Scene from Torah story "${book.torah_portion}". Style: ${style}. No text.`
          : pg.type === "back-cover"
          ? `A beautiful children's book BACK COVER illustration. Torah story "${book.torah_portion}". Style: ${style}. No text.`
          : `A beautiful children's book illustration. Scene: "${pg.text}". Torah story: "${book.torah_portion}". Style: ${style}. No text.`;

        try {
          const { data: imgData } = await supabase.functions.invoke("generate-image", {
            body: { prompt, childName: book.child_name, artStyle: book.art_style, torahPortion: book.torah_portion, bookFormat, pageType: pg.type },
          });
          allPages[i] = { ...allPages[i], image: imgData?.imageUrl || null, imageLoading: false };
        } catch {
          allPages[i] = { ...allPages[i], image: null, imageLoading: false };
        }
        setPages([...allPages]);
      }

      setPhase("done");
      setStatusText("Generation complete! Review, edit, and save.");
      toast.success("Book generated — review and approve.");
    } catch (err: any) {
      toast.error(err?.message || "Generation failed");
      setPhase("idle");
      setStatusText("");
    }
  }, [book]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from("books").update({
        pages_data: pages as any,
        story_data: storyData || book.story_data,
        cover_image_url: pages[0]?.image || null,
        status: "ordered",
        updated_at: new Date().toISOString(),
      } as any).eq("id", book.id);
      toast.success("Book saved!");
      onBookUpdated();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      await supabase.from("books").update({
        pages_data: pages as any,
        story_data: storyData || book.story_data,
        cover_image_url: pages[0]?.image || null,
        status: "approved",
        updated_at: new Date().toISOString(),
      } as any).eq("id", book.id);
      toast.success("Book approved for printing!");
      onBookUpdated();
      onClose();
    } catch {
      toast.error("Failed to approve");
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
      const blob = await generateBookPdf(pages as any, book.child_name || "book", book.torah_portion || "");
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

  const progressPercent = phase === "story" ? 5
    : phase === "images" ? Math.round(10 + (currentImageIdx / Math.max(totalImages, 1)) * 85)
    : phase === "done" ? 100 : 0;

  const handleClose = () => {
    abortRef.current = true;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0 gap-0 rounded-3xl border-border/50 shadow-soft-lg">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-primary">
                {book?.child_name}'s Book — {book?.torah_portion}
              </h2>
              <p className="text-xs text-muted-foreground capitalize">{book?.art_style} style</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress bar (during generation) */}
          <AnimatePresence>
            {(phase === "story" || phase === "images") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                    <span className="text-sm font-medium text-primary">{statusText}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Idle state — show generate button */}
          {phase === "idle" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 space-y-4"
            >
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                <Play className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-display text-xl font-bold text-primary">Ready to Generate</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                This will generate the story text and all illustrations. You'll see each page appear in real-time
                and can edit everything before saving.
              </p>
              <Button variant="gold" size="lg" onClick={handleGenerate} className="gap-2 rounded-2xl">
                <Sparkles className="w-4 h-4" /> Start Generation
              </Button>
            </motion.div>
          )}

          {/* Book viewer — shows during image gen and after done */}
          {pages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <BookViewer
                childName={book?.child_name || ""}
                torahPortion={book?.torah_portion || ""}
                artStyle={book?.art_style || "cartoon"}
                pages={pages}
                onPagesChange={setPages}
              />
            </motion.div>
          )}

          {/* Done state — action buttons */}
          {phase === "done" && pages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">{statusText}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2 rounded-xl"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </Button>
                <Button
                  variant="default"
                  onClick={handleApprove}
                  disabled={saving}
                  className="gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadZip}
                  disabled={downloadingZip}
                  className="gap-2 rounded-xl"
                >
                  {downloadingZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                  ZIP
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="gap-2 rounded-xl"
                >
                  {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                  PDF
                </Button>
              </div>

              {/* Re-generate option */}
              <div className="text-center">
                <Button variant="ghost" size="sm" onClick={handleGenerate} className="text-xs text-muted-foreground gap-1.5">
                  <Sparkles className="w-3 h-3" /> Re-generate entire book
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
