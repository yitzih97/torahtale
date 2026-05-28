import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { BookOpen, Eye, Download, RotateCw, Package, Truck, Loader2, Sparkles, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/dashboard/CountdownTimer";
import type { BookRecord } from "@/hooks/useBooks";



const ease = [0.22, 1, 0.36, 1] as const;

const colorRing = [
  "from-sky-200/60 to-indigo-200/40",
  "from-rose-200/60 to-pink-200/40",
  "from-emerald-200/60 to-teal-200/40",
  "from-violet-200/60 to-fuchsia-200/40",
  "from-amber-200/60 to-orange-200/40",
];

const statusMeta = (s: string) => {
  if (s === "delivered") return { cls: "bg-emerald-50 text-emerald-700 border-emerald-200/60", dot: "bg-emerald-500", Icon: Truck, label: "Delivered" };
  if (s === "shipped") return { cls: "bg-sky-50 text-sky-700 border-sky-200/60", dot: "bg-sky-500", Icon: Truck, label: "Shipped" };
  if (s === "printing" || s === "ordered") return { cls: "bg-blue-50 text-blue-700 border-blue-200/60", dot: "bg-blue-500", Icon: Package, label: s === "printing" ? "Printing" : "Ordered" };
  if (s === "approved") return { cls: "bg-violet-50 text-violet-700 border-violet-200/60", dot: "bg-violet-500", Icon: CheckCircle2, label: "Approved" };
  if (s === "generating") return { cls: "bg-amber-50 text-amber-700 border-amber-200/60", dot: "bg-amber-500", Icon: Loader2, label: "Creating" };
  return { cls: "bg-muted/60 text-muted-foreground border-border/60", dot: "bg-muted-foreground/40", Icon: Sparkles, label: "Draft" };
};

interface Props {
  book: BookRecord;
  index: number;
  onOpen: () => void;
  onView: () => void;
  onDownload: () => void;
  onReorder: () => void;
  downloading?: boolean;
}

export function BookCard({ book, index, onOpen, onView, onDownload, onReorder, downloading }: Props) {
  const meta = statusMeta(book.status);
  const hasPages = !!book.pages_data && (book.pages_data as any[]).length > 0;
  const pageCount = hasPages ? (book.pages_data as any[]).length : 0;
  const Icon = meta.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease }}
      className="wizard-glass relative rounded-3xl overflow-hidden
        bg-white/70 backdrop-blur-xl backdrop-saturate-150
        border border-white/70 ring-1 ring-black/5
        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_20px_40px_-20px_rgba(15,23,42,0.18)]
        p-5 sm:p-6 flex flex-col gap-5"
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-70
          bg-gradient-to-br ${colorRing[index % colorRing.length]}`}
      />

      {/* Header */}
      <div className="relative flex items-start gap-4">
        <button
          type="button"
          onClick={onOpen}
          aria-label="Open book details"
          className="group relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0
            ring-1 ring-black/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]
            transition-transform duration-300 active:scale-95"
        >
          {book.cover_image_url ? (
            <img src={book.cover_image_url} alt={book.torah_portion || ""} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <BookOpen className="w-6 h-6 text-slate-600" />
            </div>
          )}
          <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold uppercase tracking-wider">
            Open
          </span>
        </button>

        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-semibold text-foreground truncate">{book.torah_portion || "Torah Tale"}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            For {book.child_name || "—"} · {format(new Date(book.created_at), "MMM d, yyyy")}
          </p>
          {pageCount > 0 && (
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">{pageCount} pages</p>
          )}
        </div>

        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider
            px-2.5 py-1 rounded-full border backdrop-blur-sm ${meta.cls}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      {/* Status row */}
      {book.status === "generating" && (
        <div className="relative flex items-center gap-3 rounded-2xl px-4 py-3
          bg-white/60 backdrop-blur-md border border-white/70 ring-1 ring-black/5">
          <Icon className="w-4 h-4 text-amber-600 animate-spin" />
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Generating</p>
            <CountdownTimer createdAt={book.created_at} />
          </div>
        </div>
      )}

      {book.status === "shipped" && (
        <div className="relative flex items-center gap-3 rounded-2xl px-4 py-3
          bg-white/60 backdrop-blur-md border border-white/70 ring-1 ring-black/5">
          <Truck className="w-4 h-4 text-sky-600" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">On the way</p>
            <p className="text-sm font-display font-semibold text-foreground">
              Shipped {formatDistanceToNow(new Date(book.updated_at || book.created_at))} ago
            </p>
          </div>
        </div>
      )}

      {/* Action grid */}
      <div className="relative grid grid-cols-2 gap-2">
        <ActionTile Icon={Eye} label={hasPages ? "View pages" : "Open"} onClick={hasPages ? onView : onOpen} primary={hasPages} />
        <ActionTile Icon={BookOpen} label="Details" onClick={onOpen} />
        <ActionTile Icon={Download} label={downloading ? "Saving…" : "Download"} onClick={onDownload} disabled={!hasPages || downloading} />
        <ActionTile Icon={RotateCw} label="Reorder" onClick={onReorder} />
      </div>
    </motion.div>
  );
}

function ActionTile({
  Icon, label, onClick, primary, disabled,
}: {
  Icon: typeof BookOpen;
  label: string;
  onClick: () => void | Promise<void>;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onClick()}
      disabled={disabled}
      className={`h-auto py-3 px-3 rounded-2xl justify-start gap-2.5 font-medium text-xs
        border border-white/70 ring-1 ring-black/5
        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),0_4px_12px_-6px_rgba(15,23,42,0.12)]
        backdrop-blur-md transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_8px_20px_-8px_rgba(15,23,42,0.18)]
        ${primary
          ? "bg-foreground text-background hover:bg-foreground hover:text-background border-transparent ring-0"
          : "bg-white/55 text-foreground hover:bg-white/75"}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
      <span className="truncate">{label}</span>
    </Button>
  );
}
