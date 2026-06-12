import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RefreshCw, X, Wand2, Sparkles, BookOpen, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BookLoadingSkeleton } from "./BookLoadingSkeleton";
import type { TextStyle } from "./DraggableText";
import { EditableTextBox, DEFAULT_TEXT_LAYOUT, makeDefaultLayout, type TextLayout } from "./EditableTextBox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandMark } from "@/components/BrandMark";

export interface BookPage {
  id: number;
  text: string;
  image: string | null;
  imageLoading?: boolean;
  type?: "cover" | "story" | "back-cover" | "questions";
  coverTitle?: string;
  coverSubtitle?: string;
  synopsis?: string;
  dedication?: string;
  questions?: { number: number; question: string }[];
  textStyle?: TextStyle;
  textLayout?: TextLayout;
}

export type { TextLayout } from "./EditableTextBox";

/**
 * Legacy default text style — kept for backward-compatible code that
 * predates the per-page `textLayout` field.
 */
export const BOOK_TEXT_STYLE = {
  fontFamily: DEFAULT_TEXT_LAYOUT.fontFamily,
  fontSizePx: DEFAULT_TEXT_LAYOUT.fontSize,
  color: DEFAULT_TEXT_LAYOUT.color,
  bgColor: "rgba(252, 247, 236, 0.94)",
  lineHeight: 1.5,
  padding: 22,
  borderRadius: 18,
};

export const COVER_TAGLINE = ["Stories that inspire.", "Values that last.", "A love that grows."];
export const COVER_URL = "torahtale.com";

interface Props {
  childName: string;
  torahPortion: string;
  artStyle: string;
  pages: BookPage[];
  onPagesChange: (pages: BookPage[]) => void;
  generationContext?: {
    childDescription?: string;
    referenceImage?: string | null;
    characterSheet?: string | null;
    characterSheets?: Record<string, string>;
    bookFormat?: string;
    childRefs?: Array<{
      name: string;
      age?: string | number;
      gender?: string;
      description?: string;
      photoUrl?: string | null;
      characterSheet?: string | null;
    }>;
  };
}

export const BookViewer = ({ childName, torahPortion, artStyle, pages, onPagesChange, generationContext }: Props) => {
  // Hide any legacy "back-cover" pages — the cover spread renders both sides.
  const displayPages = pages.filter((p) => p.type !== "back-cover");

  const [currentPage, setCurrentPage] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const spreadRef = useRef<HTMLDivElement>(null);

  const safeIndex = Math.min(currentPage, Math.max(displayPages.length - 1, 0));
  const page = displayPages[safeIndex];
  const pageType = page?.type || "story";

  const updatePage = (id: number, patch: Partial<BookPage>) => {
    onPagesChange(pages.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const startEdit = () => {
    if (!page) return;
    setEditingId(page.id);
    setEditText(page.text || "");
  };

  const saveEdit = () => {
    if (editingId === null) return;
    updatePage(editingId, { text: editText });
    setEditingId(null);
    toast.success("Text updated");
  };

  const openPromptEditor = () => {
    if (!page) return;
    const styleMap: Record<string, string> = {
      cartoon: "colorful cartoon illustration, soft watercolor textures",
      "3d-pixar": "3D Pixar-style CGI render, warm lighting",
      "graphic-novel": "graphic novel, bold ink lines, flat colors",
    };
    const desc = page.type === "cover"
      ? `Book cover for "${page.coverTitle}". ${page.coverSubtitle || ""}`
      : page.text;
    const defaultPrompt = `A beautiful children's book illustration that fills a 2:1 landscape spread. ${desc}. Characters: children named ${childName}. Torah story: ${torahPortion}. Style: ${styleMap[artStyle] || styleMap.cartoon}. Composition: subject centered, with breathing room on both halves so text can sit over one side. Safe for children, warm magical atmosphere, vibrant colors.`;
    setCustomPrompt(defaultPrompt);
    setShowPromptEditor(true);
  };

  const regenImage = async (prompt?: string) => {
    if (!page) return;
    setRegeneratingId(page.id);
    setShowPromptEditor(false);
    try {
      const finalPrompt = prompt || customPrompt;
      const targetType = page.type || "story";
      const storyPages = pages.filter((p) => p.type === "story");
      const pageNumber = targetType === "story" ? storyPages.findIndex((p) => p.id === page.id) + 1 : undefined;
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          promptAdditions: finalPrompt
            ? `${finalPrompt}. NON-NEGOTIABLE: preserve the exact same child face, age, body size, clothing, and all age-specific rules from the existing book across this regenerated page.`
            : undefined,
          childName,
          artStyle,
          torahPortion,
          bookFormat: generationContext?.bookFormat,
          pageType: targetType,
          pageNumber,
          pageText: page.text,
          childDescription: generationContext?.childDescription,
          referenceImage: generationContext?.referenceImage,
          characterSheet: generationContext?.characterSheet,
          characterSheets: generationContext?.characterSheets,
          childRefs: generationContext?.childRefs,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      updatePage(page.id, { image: data.imageUrl });
      toast.success("Image regenerated!");
    } catch (err: any) {
      console.error("Image regen failed:", err);
      toast.error(err?.message || "Failed to regenerate image.");
    } finally {
      setRegeneratingId(null);
    }
  };

  const getPageLabel = () => {
    if (pageType === "cover") return "Cover (Back · Front)";
    if (pageType === "questions") return "Discussion Page";
    const storyPages = displayPages.filter((p) => p.type === "story");
    const storyIdx = storyPages.findIndex((p) => p.id === page?.id);
    return `Spread ${storyIdx + 1} of ${storyPages.length}`;
  };

  // Which half of the spread does the story-page text sit on?
  // First story spread → LEFT, then alternates.
  const storyTextOnLeft = (() => {
    if (pageType !== "story") return true;
    const storyPages = displayPages.filter((p) => p.type === "story");
    const storyIdx = storyPages.findIndex((p) => p.id === page?.id);
    return storyIdx % 2 === 0;
  })();

  const isRegenThis = page && regeneratingId === page.id;

  /* ── Renderers ───────────────────────────────────────────────────── */

  const renderCoverSpread = () => (
    <div className="absolute inset-0 grid grid-cols-2">
      {/* Back cover — left */}
      <div className="relative flex flex-col items-center justify-between p-6 sm:p-8 text-center bg-[hsl(42_50%_94%)]">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_30%,hsl(42_78%_70%/0.5),transparent_60%)]" />
        <div className="relative">
          <BrandMark stacked iconClassName="h-12 w-12" wordmarkClassName="h-7" />
        </div>
        <div className="relative font-body italic text-primary/80 leading-relaxed space-y-1 text-sm sm:text-base">
          {COVER_TAGLINE.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        <p className="relative font-mono text-xs tracking-[0.2em] text-gold uppercase">{COVER_URL}</p>
      </div>

      {/* Front cover — right */}
      <div className="relative bg-muted">
        {page?.image ? (
          <img src={page.image} alt={page.coverTitle || ""} className="absolute inset-0 w-full h-full object-cover" />
        ) : page?.imageLoading ? (
          <BookLoadingSkeleton type="cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 px-4 pt-5 pb-10 bg-gradient-to-b from-white/90 via-white/60 to-transparent text-center">
          <h1 className="font-display font-bold text-primary leading-tight text-lg sm:text-2xl">
            {page?.coverTitle || `${childName}'s Torah Tale`}
          </h1>
          {page?.coverSubtitle && (
            <p className="mt-1 font-body italic text-gold text-xs sm:text-sm">{page.coverSubtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStorySpread = () => {
    const imageOnLeft = !storyTextOnLeft;
    const layout = page?.textLayout || makeDefaultLayout(storyTextOnLeft ? "left" : "right");
    return (
      <div className="absolute inset-0 grid grid-cols-2">
        {/* Image half */}
        <div className={`relative bg-muted ${imageOnLeft ? "order-1" : "order-2"}`}>
          {page?.image ? (
            <motion.img
              key={`${page.id}-${page.image?.slice(-20)}`}
              src={page.image}
              alt={getPageLabel()}
              className={`absolute inset-0 w-full h-full object-cover ${isRegenThis ? "animate-pulse opacity-50" : ""}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: isRegenThis ? 0.5 : 1 }}
              transition={{ duration: 0.3 }}
            />
          ) : page?.imageLoading ? (
            <BookLoadingSkeleton type="story" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <p className="text-muted-foreground text-sm">Generating illustration…</p>
            </div>
          )}
        </div>
        {/* Text-paper half */}
        <div className={`relative bg-[hsl(42_50%_96%)] ${imageOnLeft ? "order-2" : "order-1"}`}>
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_50%,hsl(42_78%_80%/0.4),transparent_70%)]" />
        </div>

        {/* Draggable text on top of the whole spread */}
        {page && (
          <EditableTextBox
            layout={layout}
            text={page.text || ""}
            containerRef={spreadRef}
            onLayoutChange={(l) => updatePage(page.id, { textLayout: l })}
            onTextChange={(t) => updatePage(page.id, { text: t })}
            onReset={() => updatePage(page.id, { textLayout: makeDefaultLayout(storyTextOnLeft ? "left" : "right") })}
          />
        )}
      </div>
    );
  };

  const renderQuestionsSpread = () => {
    const layout = page?.textLayout || makeDefaultLayout("left");
    const questionsText = (page?.questions || []).map((q) => `${q.number}. ${q.question}`).join("\n\n");
    const combinedText = page?.text || questionsText;
    return (
      <div className="absolute inset-0 grid grid-cols-2">
        <div className="relative bg-[hsl(42_50%_96%)] order-1">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_50%,hsl(42_78%_80%/0.4),transparent_70%)]" />
        </div>
        <div className="relative bg-muted order-2">
          {page?.image ? (
            <img src={page.image} alt="Discussion" className="absolute inset-0 w-full h-full object-cover" />
          ) : page?.imageLoading ? (
            <BookLoadingSkeleton type="story" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-primary/10" />
          )}
        </div>
        {page && (
          <EditableTextBox
            layout={layout}
            text={combinedText}
            containerRef={spreadRef}
            onLayoutChange={(l) => updatePage(page.id, { textLayout: l })}
            onTextChange={(t) => updatePage(page.id, { text: t })}
            onReset={() => updatePage(page.id, { textLayout: makeDefaultLayout("left") })}
          />
        )}
      </div>
    );
  };


  return (
    <div className="space-y-4">
      {/* Spread frame */}
      <div
        ref={spreadRef}
        className="relative aspect-[2/1] w-full rounded-book overflow-hidden bg-secondary shadow-soft-lg"
      >
        {pageType === "cover" && renderCoverSpread()}
        {pageType === "story" && renderStorySpread()}
        {pageType === "questions" && renderQuestionsSpread()}

        {/* Center gutter */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-2 bg-gradient-to-r from-black/0 via-black/40 to-black/0" />

        {isRegenThis && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 shadow-soft-md">
              <RefreshCw className="w-5 h-5 text-accent animate-spin" />
              <span className="text-sm font-medium text-primary">Regenerating…</span>
            </div>
          </div>
        )}

        {/* Page nav */}
        <div className="absolute top-1/2 -translate-y-1/2 left-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={safeIndex === 0}
            className="rounded-full shadow-soft-sm h-9 w-9"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(displayPages.length - 1, p + 1))}
            disabled={safeIndex >= displayPages.length - 1}
            className="rounded-full shadow-soft-sm h-9 w-9"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Page label */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-primary">
          {getPageLabel()}
        </div>
      </div>

      {/* Page dots */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {displayPages.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setCurrentPage(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === safeIndex
                ? "bg-accent w-5"
                : p.type === "cover"
                  ? "bg-accent/30 w-2.5 hover:bg-accent/50"
                  : "bg-border w-2 hover:bg-muted-foreground/40"
            }`}
            aria-label={`Go to spread ${i + 1}`}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        {pageType === "story" && (
          <Button variant="outline" size="sm" onClick={startEdit} disabled={regeneratingId !== null} className="text-xs">
            <Pencil className="w-3.5 h-3.5" /> Edit Text
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => regenImage()}
          disabled={regeneratingId !== null}
          className={`text-xs ${pageType !== "story" ? "col-span-2" : ""}`}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Quick Regen
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={openPromptEditor}
          disabled={regeneratingId !== null}
          className="text-xs"
        >
          <Wand2 className="w-3.5 h-3.5" /> Custom Prompt
        </Button>
      </div>

      {/* Text editor */}
      {editingId !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 rounded-book border border-accent/30 bg-accent/5 p-4"
        >
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-primary flex items-center gap-2">
              <Pencil className="w-4 h-4 text-accent" /> Edit page text
            </Label>
            <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={4}
            className="text-sm bg-card"
            placeholder="Page text…"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={saveEdit}>
              <Sparkles className="w-3.5 h-3.5" /> Save text
            </Button>
          </div>
        </motion.div>
      )}

      {/* Custom prompt editor */}
      {showPromptEditor && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 rounded-book border border-accent/30 bg-accent/5 p-4"
        >
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-primary flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-accent" /> Image Prompt Editor
            </Label>
            <button onClick={() => setShowPromptEditor(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={4}
            className="text-xs bg-card"
            placeholder="Describe exactly how you want this illustration to look…"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowPromptEditor(false)}>
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={() => regenImage(customPrompt)} disabled={regeneratingId !== null}>
              <Sparkles className="w-3.5 h-3.5" /> Generate with Prompt
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
