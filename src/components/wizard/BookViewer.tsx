import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pencil, RefreshCw, Check, X, ImageIcon, Wand2, Sparkles, BookOpen, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BookLoadingSkeleton } from "./BookLoadingSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BookPage {
  id: number;
  text: string;
  image: string | null;
  imageLoading?: boolean;
  type?: "cover" | "story" | "back-cover";
  coverTitle?: string;
  coverSubtitle?: string;
  synopsis?: string;
  dedication?: string;
  questions?: { number: number; question: string }[];
}

interface Props {
  childName: string;
  torahPortion: string;
  artStyle: string;
  pages: BookPage[];
  onPagesChange: (pages: BookPage[]) => void;
}

export const BookViewer = ({ childName, torahPortion, artStyle, pages, onPagesChange }: Props) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [regenerating, setRegenerating] = useState<number | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const page = pages[currentPage];
  const pageType = page?.type || "story";
  const isSpecialPage = pageType !== "story";

  const startEdit = (idx: number) => {
    setEditingPage(idx);
    setEditText(pages[idx].text);
  };

  const saveEdit = () => {
    if (editingPage === null) return;
    const updated = pages.map((p, i) => (i === editingPage ? { ...p, text: editText } : p));
    onPagesChange(updated);
    setEditingPage(null);
  };

  const openPromptEditor = (idx: number) => {
    const styleMap: Record<string, string> = {
      cartoon: "colorful cartoon illustration, soft watercolor textures",
      "3d-pixar": "3D Pixar-style CGI render, warm lighting",
      "graphic-novel": "graphic novel, bold ink lines, flat colors",
    };
    const p = pages[idx];
    const desc = p.type === "cover"
      ? `Book cover for "${p.coverTitle}". ${p.coverSubtitle}`
      : p.type === "back-cover"
      ? `Back cover of a children's book. ${p.synopsis}`
      : p.text;
    const defaultPrompt = `A beautiful children's book page illustration. ${desc}. Characters: children named ${childName}. Torah story: ${torahPortion}. Style: ${styleMap[artStyle] || styleMap.cartoon}. Safe for children, warm magical atmosphere, vibrant colors.`;
    setCustomPrompt(defaultPrompt);
    setShowPromptEditor(true);
  };

  const regenImage = async (idx: number, prompt?: string) => {
    setRegenerating(idx);
    setShowPromptEditor(false);
    try {
      const finalPrompt = prompt || customPrompt;
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: finalPrompt, childName, artStyle, torahPortion },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const updated = pages.map((p, i) => (i === idx ? { ...p, image: data.imageUrl } : p));
      onPagesChange(updated);
      toast.success("Image regenerated!");
    } catch (err: any) {
      console.error("Image regen failed:", err);
      toast.error(err?.message || "Failed to regenerate image.");
    } finally {
      setRegenerating(null);
    }
  };

  const getPageLabel = () => {
    if (pageType === "cover") return "Front Cover";
    if (pageType === "back-cover") return "Back Cover";
    if (pageType === "questions") return "Discussion Questions";
    // Find story page number (skip cover)
    const storyPages = pages.filter(p => p.type === "story");
    const storyIdx = storyPages.indexOf(page);
    return `Page ${storyIdx + 1} of ${storyPages.length}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="font-mono text-xs tracking-widest text-accent uppercase">Step 5 of 8</span>
        <h2 className="font-display text-2xl font-bold text-primary mt-1">The Grand Reveal</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Flip through {childName}'s personalized story. Edit text or customize image prompts.
        </p>
      </div>

      {/* Book viewer */}
      <div className="relative bg-secondary rounded-book overflow-hidden">
        {pageType === "cover" ? (
          /* Cover page with image + title overlay */
          <>
            {page?.image ? (
              <div className="relative w-full aspect-[4/3]">
                <motion.img
                  key={`${currentPage}-${page.image?.slice(-20)}`}
                  src={page.image}
                  alt="Front Cover"
                  className={`w-full h-full object-cover rounded-book ${regenerating === currentPage ? "animate-pulse opacity-50" : ""}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: regenerating === currentPage ? 0.5 : 1 }}
                  transition={{ duration: 0.3 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 rounded-book" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-white drop-shadow-lg leading-tight">
                    {page.coverTitle}
                  </h3>
                  {page.coverSubtitle && (
                    <p className="font-body text-sm sm:text-base text-white/90 mt-2 drop-shadow-md italic">
                      {page.coverSubtitle}
                    </p>
                  )}
                </div>
              </div>
            ) : page?.imageLoading ? (
              <BookLoadingSkeleton type="cover" />
            ) : (
              <div className="w-full aspect-[4/3] rounded-book bg-muted flex flex-col items-center justify-center gap-2">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">Generating cover...</p>
              </div>
            )}
          </>
        ) : pageType === "back-cover" ? (
          /* Back cover */
          <>
            {page?.image ? (
              <div className="relative w-full aspect-[4/3]">
                <motion.img
                  key={`${currentPage}-${page.image?.slice(-20)}`}
                  src={page.image}
                  alt="Back Cover"
                  className={`w-full h-full object-cover rounded-book ${regenerating === currentPage ? "animate-pulse opacity-50" : ""}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: regenerating === currentPage ? 0.5 : 1 }}
                  transition={{ duration: 0.3 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent rounded-book" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                  {page.synopsis && (
                    <p className="font-body text-sm text-white/90 italic mb-3 leading-relaxed">
                      "{page.synopsis}"
                    </p>
                  )}
                  {page.dedication && (
                    <p className="font-display text-xs text-white/70">
                      {page.dedication}
                    </p>
                  )}
                </div>
              </div>
            ) : page?.imageLoading ? (
              <BookLoadingSkeleton type="back-cover" />
            ) : (
              <div className="w-full aspect-[4/3] rounded-book bg-muted flex flex-col items-center justify-center gap-2">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">Generating back cover...</p>
              </div>
            )}
          </>
        ) : (
          /* Regular story page */
          <>
            {page?.image ? (
              <motion.img
                key={`${currentPage}-${page.image?.slice(-20)}`}
                src={page.image}
                alt={`Page ${currentPage + 1}`}
                className={`w-full aspect-[4/3] object-cover rounded-book ${regenerating === currentPage ? "animate-pulse opacity-50" : ""}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: regenerating === currentPage ? 0.5 : 1 }}
                transition={{ duration: 0.3 }}
              />
            ) : page?.imageLoading ? (
              <BookLoadingSkeleton type="story" />
            ) : (
              <div className="w-full aspect-[4/3] rounded-book bg-muted flex flex-col items-center justify-center gap-2">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">Generating illustration...</p>
              </div>
            )}
          </>
        )}

        {regenerating === currentPage && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-book">
            <div className="bg-card/90 backdrop-blur-sm rounded-book p-4 flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-accent animate-spin" />
              <span className="text-sm font-medium text-primary">Regenerating...</span>
            </div>
          </div>
        )}

        {/* Page nav */}
        <div className="absolute top-1/2 -translate-y-1/2 left-2">
          <Button variant="secondary" size="icon" onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0} className="rounded-full shadow-soft-sm h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-2">
          <Button variant="secondary" size="icon" onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))} disabled={currentPage === pages.length - 1} className="rounded-full shadow-soft-sm h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Page label badge */}
        <div className="absolute top-3 left-3 bg-card/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-primary">
          {getPageLabel()}
        </div>
      </div>

      {/* Page dots */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {pages.map((p, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentPage ? "bg-accent w-5" : 
              p.type === "cover" || p.type === "back-cover" ? "bg-accent/30 w-2.5 hover:bg-accent/50" :
              p.type === "questions" ? "bg-primary/30 w-2.5 hover:bg-primary/50" :
              "bg-border w-2 hover:bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>

      {/* Action buttons - hide for questions page */}
      {pageType !== "questions" && (
        <div className="flex gap-2">
          {!isSpecialPage && (
            <Button variant="outline" size="sm" onClick={() => startEdit(currentPage)} className="flex-1 text-xs">
              <Pencil className="w-3.5 h-3.5" /> Edit Text
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => regenImage(currentPage)} disabled={regenerating !== null} className="flex-1 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Quick Regen
          </Button>
          <Button variant="outline" size="sm" onClick={() => openPromptEditor(currentPage)} disabled={regenerating !== null} className="flex-1 text-xs">
            <Wand2 className="w-3.5 h-3.5" /> Custom Prompt
          </Button>
        </div>
      )}

      {/* Custom prompt editor */}
      {showPromptEditor && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 rounded-book border border-accent/30 bg-accent/5 p-4">
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
            placeholder="Describe exactly how you want this illustration to look..."
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowPromptEditor(false)}>
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={() => regenImage(currentPage, customPrompt)} disabled={regenerating !== null}>
              <Sparkles className="w-3.5 h-3.5" /> Generate with Prompt
            </Button>
          </div>
        </motion.div>
      )}

      {/* Text display - only for story pages */}
      {pageType === "story" && (
        editingPage === currentPage ? (
          <div className="space-y-2">
            <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} className="text-sm font-body" />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditingPage(null)}>
                <X className="w-3.5 h-3.5" /> Cancel
              </Button>
              <Button variant="gold" size="sm" onClick={saveEdit}>
                <Check className="w-3.5 h-3.5" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm font-body text-foreground bg-card rounded-book border border-border p-4 leading-relaxed italic">
            "{page?.text || "Loading..."}"
          </p>
        )
      )}
    </div>
  );
};
