import { format } from "date-fns";
import { BookOpen, Eye, Download, RotateCw, Truck, Package, CheckCircle2, Sparkles, Hash, Globe2, Palette, Calendar, User, MapPin, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BookRecord } from "@/hooks/useBooks";

const statusMeta = (s: string) => {
  if (s === "delivered") return { cls: "bg-emerald-50 text-emerald-700 border-emerald-200/60", Icon: Truck, label: "Delivered" };
  if (s === "shipped") return { cls: "bg-sky-50 text-sky-700 border-sky-200/60", Icon: Truck, label: "Shipped" };
  if (s === "printing" || s === "ordered") return { cls: "bg-blue-50 text-blue-700 border-blue-200/60", Icon: Package, label: s === "printing" ? "Printing" : "Ordered" };
  if (s === "approved") return { cls: "bg-violet-50 text-violet-700 border-violet-200/60", Icon: CheckCircle2, label: "Approved" };
  if (s === "generating") return { cls: "bg-amber-50 text-amber-700 border-amber-200/60", Icon: Sparkles, label: "Creating" };
  return { cls: "bg-muted/60 text-muted-foreground border-border/60", Icon: Sparkles, label: "Draft" };
};

interface Props {
  book: BookRecord | null;
  open: boolean;
  onClose: () => void;
  onView: () => void;
  onDownload: () => void;
  onReorder: () => void;
  downloading?: boolean;
}

export function BookDetailDialog({ book, open, onClose, onView, onDownload, onReorder, downloading }: Props) {
  if (!book) return null;
  const meta = statusMeta(book.status);
  const pages = (book.pages_data as any[]) || [];
  const hasPages = pages.length > 0;
  const ship = book.shipping_data as any;

  const infoRows = [
    { Icon: User, label: "Child", value: book.child_name || "—" },
    { Icon: BookOpen, label: "Portion", value: book.torah_portion || "—" },
    { Icon: Palette, label: "Art style", value: (book.art_style || "cartoon").replace("3d-pixar", "3D Pixar") },
    { Icon: Globe2, label: "Language", value: book.language || "English" },
    { Icon: Hash, label: "Order #", value: book.order_number || "—" },
    { Icon: Calendar, label: "Created", value: format(new Date(book.created_at), "MMM d, yyyy") },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
        <div className="wizard-glass relative rounded-3xl overflow-hidden
          bg-white/85 backdrop-blur-2xl backdrop-saturate-150
          border border-white/70 ring-1 ring-black/5
          shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_30px_60px_-20px_rgba(15,23,42,0.25)]">
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 w-72 h-72 rounded-full blur-3xl opacity-70 bg-gradient-to-br from-sky-200/60 to-indigo-200/40" />

          {/* Hero */}
          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row gap-5">
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden ring-1 ring-black/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)] flex-shrink-0 mx-auto sm:mx-0">
              {book.cover_image_url ? (
                <img src={book.cover_image_url} alt={book.torah_portion || ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                  <BookOpen className="w-10 h-10 text-slate-600" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <DialogHeader className="text-left">
                <DialogTitle className="font-display text-2xl text-foreground">{book.torah_portion || "Torah Tale"}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mt-1">For {book.child_name || "—"}</p>
              <span className={`mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${meta.cls}`}>
                <meta.Icon className="w-3 h-3" /> {meta.label}
              </span>
              {hasPages && <p className="text-xs text-muted-foreground mt-3">{pages.length} pages ready</p>}
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/70 hover:bg-white border border-white/70 ring-1 ring-black/5 flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Info grid */}
          <div className="relative px-6 sm:px-8 pb-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {infoRows.map((r) => (
              <div key={r.label} className="rounded-xl bg-white/55 border border-white/70 ring-1 ring-black/5 p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  <r.Icon className="w-3 h-3" /> {r.label}
                </div>
                <p className="text-sm font-medium text-foreground mt-0.5 truncate capitalize">{r.value}</p>
              </div>
            ))}
          </div>

          {/* Shipping */}
          {ship && (ship.fullName || ship.street) && (
            <div className="relative px-6 sm:px-8 pt-3">
              <div className="rounded-2xl bg-white/55 border border-white/70 ring-1 ring-black/5 p-4 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">Shipping to</p>
                  <p className="font-medium text-foreground">{ship.fullName}</p>
                  <p className="text-muted-foreground">{ship.street}{ship.apt ? `, ${ship.apt}` : ""}, {ship.city}, {ship.state} {ship.zip}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="relative p-6 sm:p-8 flex flex-wrap gap-2">
            {hasPages && (
              <Button onClick={onView} className="rounded-2xl">
                <Eye className="w-4 h-4 mr-1" /> View pages
              </Button>
            )}
            <Button variant="outline" onClick={onDownload} disabled={!hasPages || downloading} className="rounded-2xl">
              <Download className="w-4 h-4 mr-1" /> {downloading ? "Saving…" : "Download ZIP"}
            </Button>
            <Button variant="outline" onClick={onReorder} className="rounded-2xl">
              <RotateCw className="w-4 h-4 mr-1" /> Reorder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
