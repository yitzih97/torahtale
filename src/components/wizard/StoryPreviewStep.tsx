import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, PenLine, Truck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface PageData {
  imageUrl?: string | null;
  url?: string | null;
  image?: string | null;
}

interface BookRow {
  cover_image_url: string | null;
  pages_data: any;
}

interface Props {
  bookId: string | null;
  childNames: string;
  onPrint: () => void;
  onEdit: () => void;
}

/**
 * Step 10 — Story Preview
 * Shows the freshly generated cover + 2-3 sample pages so the parent can
 * confidently click "Print My Book". Polls the books row in case images
 * are still being generated when this step mounts.
 */
export const StoryPreviewStep = ({ bookId, childNames, onPrint, onEdit }: Props) => {
  const { t, lang } = useLanguage();
  const [book, setBook] = useState<BookRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      const { data, error } = await supabase
        .from("books")
        .select("cover_image_url, pages_data")
        .eq("id", bookId)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data) {
        setBook(data as BookRow);
        const hasCover = !!(data as BookRow).cover_image_url;
        const hasPages = Array.isArray((data as BookRow).pages_data) && (data as BookRow).pages_data.length > 0;
        if (hasCover || hasPages || attempts > 15) {
          setLoading(false);
          return;
        }
      }
      // poll while images are still being produced (max ~30s)
      if (attempts < 15) setTimeout(tick, 2000);
      else setLoading(false);
    };
    tick();
    return () => { cancelled = true; };
  }, [bookId]);

  const pages: PageData[] = Array.isArray(book?.pages_data) ? (book!.pages_data as PageData[]) : [];
  const samplePages = pages
    .map((p) => p?.imageUrl || p?.url || p?.image || null)
    .filter((u): u is string => !!u)
    .slice(0, 3);

  const isHe = lang === "he" || lang === "yi";
  const title = isHe ? "הסיפור שלכם מוכן" : "Your Torah Tale Is Ready";
  const sub = isHe
    ? "הספר המלא יודפס באיכות מוקפדת ויישלח עד דלת הבית."
    : "Your full book will be professionally printed and delivered to your door.";
  const printCta = isHe ? "להדפיס את הספר" : "Print My Book";
  const editCta = isHe ? "לעריכת פרטי הסיפור" : "Edit Story Details";
  const forLabel = isHe ? "סיפור במיוחד עבור" : "A story for";

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary">{title}</h2>
        <p className="text-sm text-muted-foreground">
          <span className="text-accent font-semibold">{forLabel}</span> {childNames}
        </p>
      </div>

      {/* Cover */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-[280px] aspect-[4/5] rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-accent/10 bg-muted/30 relative"
      >
        {loading && !book?.cover_image_url ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : book?.cover_image_url ? (
          <img src={book.cover_image_url} alt={`${childNames} cover`} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent/10 to-primary/10">
            <BookOpen className="w-12 h-12 text-accent/60" />
          </div>
        )}
      </motion.div>

      {/* Sample pages */}
      {samplePages.length > 0 && (
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          {samplePages.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="aspect-square rounded-xl overflow-hidden border border-border/40 bg-muted/30"
            >
              <img src={src} alt={`Page ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3 max-w-md mx-auto">
        <Truck className="w-4 h-4 text-accent shrink-0" />
        <span>{sub}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <Button variant="gold" size="lg" onClick={onPrint} className="flex-1 rounded-xl h-12 text-base">
          <BookOpen className="w-4 h-4" /> {printCta}
        </Button>
        <Button variant="outline" size="lg" onClick={onEdit} className="flex-1 rounded-xl h-12 text-base">
          <PenLine className="w-4 h-4" /> {editCta}
        </Button>
      </div>
    </div>
  );
};
