import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pencil, RefreshCw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import heroBook from "@/assets/hero-book.png";
import samplePage from "@/assets/sample-page.png";

interface Props {
  childName: string;
  torahPortion: string;
}

const MOCK_PAGES = [
  {
    id: 1,
    text: "Once upon a time, in a land far away, a brave child set out on an extraordinary journey through the pages of the Torah...",
    image: heroBook,
  },
  {
    id: 2,
    text: "The animals gathered two by two, and our hero helped guide them aboard the great ark as the first drops of rain began to fall.",
    image: samplePage,
  },
  {
    id: 3,
    text: "With courage in their heart, they stood at the edge of the sea. The waters began to part, revealing a shimmering path of dry land.",
    image: heroBook,
  },
  {
    id: 4,
    text: "And so the adventure came to a glorious end. The child smiled, knowing the Torah's wisdom would guide them always. The End.",
    image: samplePage,
  },
];

export const BookViewer = ({ childName, torahPortion }: Props) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState(
    MOCK_PAGES.map((p) => ({ ...p, text: p.text.replace("a brave child", childName || "a brave child") }))
  );
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [regenerating, setRegenerating] = useState<number | null>(null);

  const page = pages[currentPage];

  const startEdit = (idx: number) => {
    setEditingPage(idx);
    setEditText(pages[idx].text);
  };

  const saveEdit = () => {
    if (editingPage === null) return;
    setPages((prev) => prev.map((p, i) => (i === editingPage ? { ...p, text: editText } : p)));
    setEditingPage(null);
  };

  const regenImage = (idx: number) => {
    setRegenerating(idx);
    setTimeout(() => {
      setPages((prev) =>
        prev.map((p, i) =>
          i === idx ? { ...p, image: p.image === heroBook ? samplePage : heroBook } : p
        )
      );
      setRegenerating(null);
    }, 1500);
  };

  return (
    <div className="space-y-5">
      <div>
        <span className="font-mono text-xs tracking-widest text-accent uppercase">Step 5 of 8</span>
        <h2 className="font-display text-2xl font-bold text-primary mt-1">The Grand Reveal</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Flip through {childName || "your child"}'s personalized story. Edit text or regenerate images.
        </p>
      </div>

      {/* Book viewer */}
      <div className="relative bg-secondary rounded-book p-4 overflow-hidden">
        <motion.img
          key={`${currentPage}-${pages[currentPage].image}`}
          src={page.image}
          alt={`Page ${currentPage + 1}`}
          className={`w-full aspect-[4/3] object-cover rounded-book shadow-soft-md ${regenerating === currentPage ? "animate-pulse opacity-50" : ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: regenerating === currentPage ? 0.5 : 1 }}
          transition={{ duration: 0.3 }}
        />
        {regenerating === currentPage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-accent animate-spin" />
          </div>
        )}

        {/* Page controls */}
        <div className="absolute top-1/2 -translate-y-1/2 left-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="rounded-full shadow-soft-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
            disabled={currentPage === pages.length - 1}
            className="rounded-full shadow-soft-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="absolute bottom-6 right-6 flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => startEdit(currentPage)} className="shadow-soft-sm">
            <Pencil className="w-3.5 h-3.5" /> Edit Text
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => regenImage(currentPage)}
            disabled={regenerating !== null}
            className="shadow-soft-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Regen Image
          </Button>
        </div>
      </div>

      {/* Page indicator */}
      <div className="flex justify-center gap-2">
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === currentPage ? "bg-accent w-6" : "bg-border hover:bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>

      {/* Text display or editor */}
      {editingPage === currentPage ? (
        <div className="space-y-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="text-sm"
          />
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
          "{page.text}"
        </p>
      )}
    </div>
  );
};
