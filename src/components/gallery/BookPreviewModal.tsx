import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface BookData {
  title: string;
  portion: string;
  child: string;
  coverImage: string;
  pages: string[]; // interior page images (pairs)
  backCoverImage: string;
  questions: string[];
  review: string;
  reviewer: string;
  location: string;
}

interface BookPreviewModalProps {
  book: BookData | null;
  open: boolean;
  onClose: () => void;
}

export const BookPreviewModal = ({ book, open, onClose }: BookPreviewModalProps) => {
  const [currentSpread, setCurrentSpread] = useState(0);

  if (!book) return null;

  // Build spreads:
  // Spread 0: Cover (single page, right side)
  // Spread 1..N: Two interior pages side by side
  // Last spread: Back cover with questions (single page, left side)
  const interiorPages = book.pages;
  const interiorSpreads: [string, string | null][] = [];
  for (let i = 0; i < interiorPages.length; i += 2) {
    interiorSpreads.push([
      interiorPages[i],
      i + 1 < interiorPages.length ? interiorPages[i + 1] : null,
    ]);
  }

  const totalSpreads = 1 + interiorSpreads.length + 1; // cover + interior + back
  const isCover = currentSpread === 0;
  const isBack = currentSpread === totalSpreads - 1;
  const interiorIndex = currentSpread - 1;

  const goNext = () => setCurrentSpread((s) => Math.min(s + 1, totalSpreads - 1));
  const goPrev = () => setCurrentSpread((s) => Math.max(s - 1, 0));

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      onClose();
      setCurrentSpread(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 bg-transparent border-none shadow-none overflow-visible [&>button]:hidden">
        <div className="relative flex flex-col items-center">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-50 w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Book container — fixed aspect ratio */}
          <div className="w-full aspect-[16/10] bg-[#1a1410] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex relative">
            <AnimatePresence mode="wait">
              {isCover && (
                <motion.div
                  key="cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex w-full h-full"
                >
                  {/* Left side — dark/empty spine feel */}
                  <div className="w-1/2 h-full bg-[#0f0c08] flex items-center justify-center p-8">
                    <div className="text-center">
                      <p className="text-accent/60 text-xs uppercase tracking-[0.3em] mb-3 font-body">A Personalized Torah Story</p>
                      <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground/90 leading-tight">{book.title}</h2>
                      <p className="text-muted-foreground text-sm mt-3 font-body">{book.portion}</p>
                      <p className="text-accent text-sm mt-1 font-body">Featuring <strong>{book.child}</strong></p>
                    </div>
                  </div>
                  {/* Right side — cover image */}
                  <div className="w-1/2 h-full">
                    <img
                      src={book.coverImage}
                      alt={`${book.title} — Cover`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              )}

              {!isCover && !isBack && interiorSpreads[interiorIndex] && (
                <motion.div
                  key={`spread-${interiorIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex w-full h-full"
                >
                  {/* Left page */}
                  <div className="w-1/2 h-full border-r border-[#2a2218]">
                    <img
                      src={interiorSpreads[interiorIndex][0]}
                      alt={`Page ${interiorIndex * 2 + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Right page */}
                  <div className="w-1/2 h-full">
                    {interiorSpreads[interiorIndex][1] ? (
                      <img
                        src={interiorSpreads[interiorIndex][1]!}
                        alt={`Page ${interiorIndex * 2 + 2}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#f5edd6] flex items-center justify-center">
                        <p className="text-[#3d2e1c] font-body text-sm italic">The End</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {isBack && (
                <motion.div
                  key="back"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex w-full h-full"
                >
                  {/* Left side — questions */}
                  <div className="w-1/2 h-full bg-[#f5edd6] p-6 lg:p-8 overflow-y-auto flex flex-col">
                    <h3 className="font-display text-lg font-bold text-[#3d2e1c] mb-1">Discussion Questions</h3>
                    <p className="text-xs text-[#7a6a52] mb-4 font-body">Talk about the story together</p>
                    <ol className="space-y-2 flex-1">
                      {book.questions.map((q, i) => (
                        <li key={i} className="flex gap-2 text-xs leading-relaxed text-[#3d2e1c] font-body">
                          <span className="font-bold text-accent shrink-0">{i + 1}.</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  {/* Right side — back cover image */}
                  <div className="w-1/2 h-full">
                    <img
                      src={book.backCoverImage}
                      alt={`${book.title} — Back Cover`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation arrows */}
            {currentSpread > 0 && (
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/90 transition-all z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {currentSpread < totalSpreads - 1 && (
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/90 transition-all z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Page indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {Array.from({ length: totalSpreads }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSpread(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentSpread ? "bg-accent w-6" : "bg-foreground/30 w-1.5"
                  }`}
                />
              ))}
            </div>

            {/* Spread label */}
            <div className="absolute top-3 right-3 bg-background/60 backdrop-blur-sm text-foreground text-[10px] font-medium px-2 py-1 rounded-full z-10">
              {isCover ? "Cover" : isBack ? "Back Cover" : `Pages ${interiorIndex * 2 + 1}–${Math.min(interiorIndex * 2 + 2, interiorPages.length)}`}
            </div>
          </div>

          {/* Review below book */}
          <div className="mt-4 max-w-2xl mx-auto text-center px-4">
            <p className="text-sm text-muted-foreground font-body italic">"{book.review}"</p>
            <p className="text-xs text-accent mt-1 font-medium">— {book.reviewer}, {book.location}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
