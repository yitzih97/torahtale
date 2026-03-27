import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Quote } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface BookData {
  title: string;
  portion: string;
  child: string;
  childPhoto?: string;
  coverImage: string;
  pages: string[];
  backCoverImage: string;
  questions: string[];
  review: string;
  reviewer: string;
  location: string;
  rating?: number;
}

interface BookPreviewModalProps {
  book: BookData | null;
  open: boolean;
  onClose: () => void;
}

export const BookPreviewModal = ({ book, open, onClose }: BookPreviewModalProps) => {
  if (!book) return null;

  const handleOpenChange = (o: boolean) => {
    if (!o) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] p-0 bg-transparent border-none shadow-none overflow-visible [&>button]:hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col items-center"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-50 w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Main content card */}
          <div className="w-full bg-card rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-border/50">
            <div className="flex flex-col md:flex-row">
              {/* Book cover — left side */}
              <div className="md:w-[45%] relative">
                <div className="aspect-[3/4] md:aspect-auto md:h-full relative overflow-hidden">
                  <img
                    src={book.coverImage}
                    alt={`${book.title} — Cover`}
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  {/* Title overlay on cover */}
                  <div className="absolute bottom-0 inset-x-0 p-5">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 mb-1 font-body">{book.portion}</p>
                    <h2 className="font-display text-xl lg:text-2xl font-bold text-white leading-tight drop-shadow-lg">{book.title}</h2>
                  </div>
                </div>
              </div>

              {/* Review content — right side */}
              <div className="md:w-[55%] p-6 lg:p-8 flex flex-col justify-center">
                {/* Child profile with photo */}
                <div className="flex items-center gap-4 mb-6">
                  {book.childPhoto ? (
                    <img
                      src={book.childPhoto}
                      alt={book.child}
                      className="w-14 h-14 rounded-full object-cover border-2 border-accent/30 shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-accent">{book.child[0]}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-display text-base font-semibold text-foreground">
                      Featuring <span className="text-accent">{book.child}</span>
                    </p>
                    <p className="text-xs text-muted-foreground font-body">{book.portion}</p>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: book.rating || 5 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>

                {/* Review quote */}
                <div className="relative mb-6">
                  <Quote className="w-8 h-8 text-accent/15 absolute -top-2 -left-1" />
                  <p className="text-foreground text-base lg:text-lg leading-relaxed font-body italic pl-6">
                    {book.review}
                  </p>
                </div>

                {/* Reviewer */}
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-semibold text-foreground">
                    {book.reviewer}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    {book.location}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
