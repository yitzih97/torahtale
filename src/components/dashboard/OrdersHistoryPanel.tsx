import { motion } from "framer-motion";
import { format } from "date-fns";
import { Receipt, Package, ExternalLink, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassIconTile } from "@/components/ui/glass-icon-tile";
import { useBooks } from "@/hooks/useBooks";

const ease = [0.22, 1, 0.36, 1] as const;

const statusPill = (s: string) => {
  if (s === "shipped" || s === "delivered") return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
  if (s === "printing" || s === "approved") return "bg-sky-50 text-sky-700 border-sky-200/60";
  if (s === "canceled" || s === "rejected") return "bg-rose-50 text-rose-700 border-rose-200/60";
  return "bg-amber-50 text-amber-700 border-amber-200/60";
};

export function OrdersHistoryPanel() {
  const { books, isLoading } = useBooks();
  const orders = books.filter((b) => !!b.order_number);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
      className="wizard-glass relative rounded-3xl overflow-hidden
        bg-white/70 backdrop-blur-xl backdrop-saturate-150
        border border-white/70 ring-1 ring-black/5
        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_20px_40px_-20px_rgba(15,23,42,0.18)]
        p-5 sm:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-70 bg-gradient-to-br from-amber-200/60 to-orange-200/40"
      />

      <div className="relative flex items-start gap-4 mb-5">
        <GlassIconTile Icon={Receipt} size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-semibold text-foreground">Orders & Invoices</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Your past book orders and receipts</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-2xl gap-1.5 text-xs"
          onClick={() => window.open("https://cnhtj8-x9.myshopify.com/account", "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="w-3.5 h-3.5" /> Shopify
        </Button>
      </div>

      <div className="relative">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl p-6 bg-white/55 backdrop-blur-md border border-white/70 ring-1 ring-black/5 text-center">
            <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" strokeWidth={1.5} />
            <p className="text-sm font-medium text-foreground">No orders yet</p>
            <p className="text-xs text-muted-foreground mt-1">Once you place an order, it'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/55 backdrop-blur-md border border-white/70 ring-1 ring-black/5"
              >
                {o.cover_image_url ? (
                  <img
                    src={o.cover_image_url}
                    alt={o.child_name || "Book"}
                    className="w-12 h-12 rounded-xl object-cover border border-white/70 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/70 border border-white/70 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">
                      #{o.order_number}
                    </p>
                    <span
                      className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusPill(o.status)}`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {o.child_name || "—"} · {o.torah_portion || "Book"} ·{" "}
                    {format(new Date(o.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-2xl gap-1.5 text-xs flex-shrink-0"
                  onClick={() =>
                    window.open("https://cnhtj8-x9.myshopify.com/account", "_blank", "noopener,noreferrer")
                  }
                >
                  <FileText className="w-3.5 h-3.5" /> Invoice
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
