import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BookViewer, type BookPage } from "./BookViewer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Pencil, Download, Loader2 } from "lucide-react";
import { generateBookPdf } from "@/lib/generateBookPdf";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  open: boolean;
  onClose: () => void;
  childName: string;
  torahPortion: string;
  artStyle: string;
  pages: BookPage[];
  /** "board-6x6" | "softcover-8x8" | "hardcover-8x8" — drives spread vs page layout. */
  bookFormat?: string;
  onEdit?: () => void;
  onReorder?: () => void;
}

export const BookViewerModal = ({ open, onClose, childName, torahPortion, artStyle, pages, bookFormat, onEdit, onReorder }: Props) => {
  const [downloading, setDownloading] = useState(false);
  const { dir, lang } = useLanguage();

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const blob = await generateBookPdf(pages, childName, torahPortion, dir === "rtl", bookFormat, lang);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${childName}-${torahPortion || "torah-tale"}.pdf`.replace(/\s+/g, "-").toLowerCase();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-3xl border-border/50 shadow-soft-lg">
        <div className="p-6 sm:p-8">
          <BookViewer childName={childName} torahPortion={torahPortion} artStyle={artStyle} pages={pages} onPagesChange={() => {}} generationContext={{ bookFormat }} />
          <div className="flex gap-3 mt-6 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="rounded-xl gap-2 flex-1"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? "Generating PDF..." : "Download PDF"}
            </Button>
            {onEdit && (
              <Button variant="outline" onClick={onEdit} className="rounded-xl gap-2 flex-1">
                <Pencil className="w-4 h-4" /> Edit Book
              </Button>
            )}
            {onReorder && (
              <Button variant="gold" onClick={onReorder} className="rounded-xl gap-2 flex-1">
                Order Again <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
