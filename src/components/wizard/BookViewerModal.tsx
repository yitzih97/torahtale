import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BookViewer, type BookPage } from "./BookViewer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Pencil } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  childName: string;
  torahPortion: string;
  artStyle: string;
  pages: BookPage[];
  onEdit?: () => void;
  onReorder?: () => void;
}

export const BookViewerModal = ({ open, onClose, childName, torahPortion, artStyle, pages, onEdit, onReorder }: Props) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-3xl border-border/50 shadow-soft-lg">
        <div className="p-6 sm:p-8">
          <BookViewer childName={childName} torahPortion={torahPortion} artStyle={artStyle} pages={pages} />
          <div className="flex gap-3 mt-6 pt-6 border-t border-border">
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
