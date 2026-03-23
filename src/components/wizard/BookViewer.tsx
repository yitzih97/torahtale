import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pencil, RefreshCw, Check, X, ImageIcon, Wand2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BookPage {
  id: number;
  text: string;
  image: string | null;
  imageLoading?: boolean;
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
    const pageText = pages[idx].text;
    const defaultPrompt = `A beautiful children's book page illustration with the story text elegantly embedded as part of the layout. Story text: "${pageText}". Characters: children named ${childName}. Torah story: ${torahPortion}. Style: ${styleMap[artStyle] || styleMap.cartoon}. Safe for children, warm magical atmosphere, vibrant colors.`;
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
          <Skeleton className="w-full aspect-[4/3] rounded-book" />
        ) : (
          <div className="w-full aspect-[4/3] rounded-book bg-muted flex flex-col items-center justify-center gap-2">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Generating illustration...</p>
          </div>
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

        {/* Page number badge */}
        <div className="absolute top-3 left-3 bg-card/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-primary">
          Page {currentPage + 1} of {pages.length}
        </div>
      </div>

      {/* Page dots */}
      <div className="flex justify-center gap-1.5">
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentPage ? "bg-accent w-5" : "bg-border w-2 hover:bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => startEdit(currentPage)} className="flex-1 text-xs">
          <Pencil className="w-3.5 h-3.5" /> Edit Text
        </Button>
        <Button variant="outline" size="sm" onClick={() => regenImage(currentPage)} disabled={regenerating !== null} className="flex-1 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Quick Regen
        </Button>
        <Button variant="outline" size="sm" onClick={() => openPromptEditor(currentPage)} disabled={regenerating !== null} className="flex-1 text-xs">
          <Wand2 className="w-3.5 h-3.5" /> Custom Prompt
        </Button>
      </div>

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

      {/* Text editor */}
      {editingPage === currentPage ? (
        <div className="space-y-2">
          <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} className="text-sm" />
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
        <p className="text-sm text-foreground bg-card rounded-book border border-border p-4 leading-relaxed italic">
          "{page?.text || "Loading..."}"
        </p>
      )}
    </div>
  );
};

// Re-export for the custom prompt button icon
const Sparkles2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
);
