import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  User, Mail, BookOpen, Palette, Globe2, Hash, Calendar, MapPin, Package,
  Truck, CheckCircle2, Play, Eye, Download, Loader2, ExternalLink, DollarSign,
  CreditCard, ReceiptText,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getPortionDisplay } from "@/components/wizard/TorahPortions";
import { PAGES_BY_TYPE } from "@/components/wizard/BookOptionsStep";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProductType, getCogs, getProfit } from "@/lib/bookCosts";
import { fetchOrderDetails, formatMoney, type OrderDetails } from "@/lib/shopifyAdmin";

const PRODUCT_LABEL: Record<string, string> = {
  softcover: "Softcover (8×8)",
  hardcover: "Hardcover (8×8)",
  board: "Board book (6×6)",
  coloring: "Coloring book (8.5×11)",
};

interface Props {
  book: any | null;
  open: boolean;
  onClose: () => void;
  profile: any | null;
  kids: any[];
  canGenerate: boolean;
  downloading: boolean;
  onGenerate: () => void;
  onViewEdit: () => void;
  onDownload: () => void;
  onApprove: () => void;
  onViewCustomer: () => void;
}

const Row = ({ Icon, label, value }: { Icon: any; label: string; value: React.ReactNode }) => (
  <div className="flex items-center gap-2 text-sm">
    <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
    <span className="text-muted-foreground">{label}:</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

export function AdminOrderDetailDialog({
  book, open, onClose, profile, kids, canGenerate, downloading,
  onGenerate, onViewEdit, onDownload, onApprove, onViewCustomer,
}: Props) {
  const { lang } = useLanguage();
  const [fin, setFin] = useState<OrderDetails | null>(null);
  const [finLoading, setFinLoading] = useState(false);
  const [finError, setFinError] = useState<string | null>(null);
  const [hasOrder, setHasOrder] = useState(true);

  useEffect(() => {
    if (!open || !book) return;
    let cancelled = false;
    setFin(null); setFinError(null); setFinLoading(true); setHasOrder(true);
    fetchOrderDetails(book.id)
      .then((o) => { if (cancelled) return; if (!o) setHasOrder(false); else setFin(o); })
      .catch((e) => { if (!cancelled) setFinError(e?.message || "Failed to load Shopify data"); })
      .finally(() => { if (!cancelled) setFinLoading(false); });
    return () => { cancelled = true; };
  }, [open, book?.id]);

  if (!book) return null;

  const ship = book.shipping_data as any;
  const productType = getProductType(book);
  const placed = book.paid_at || book.created_at;
  const cogs = getCogs(book);
  const revenue = fin?.subtotal?.amount ?? null; // ex-shipping/tax: closest to product revenue
  const profit = revenue != null ? getProfit(revenue, book) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <Package className="w-5 h-5 text-accent" />
            Order {book.shopify_order_name || book.order_number || book.id.slice(0, 8)}
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
              {book.status}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Placed + customer */}
          <section className="space-y-2">
            <Row Icon={Calendar} label="Placed" value={placed ? format(new Date(placed), "MMM d, yyyy · h:mm a") : "—"} />
            <Row Icon={User} label="Customer" value={profile?.full_name || profile?.email || (book.user_id || "").slice(0, 8)} />
            {profile?.email && <Row Icon={Mail} label="Email" value={profile.email} />}
            <Button variant="outline" size="sm" className="mt-1 h-8 text-xs" onClick={onViewCustomer}>
              <User className="w-3.5 h-3.5" /> View customer card
            </Button>
          </section>

          {/* Book */}
          <section className="space-y-2 border-t border-border pt-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Book</h3>
            <Row Icon={BookOpen} label="Type" value={PRODUCT_LABEL[productType] || productType} />
            <Row Icon={BookOpen} label="Portion" value={book.torah_portion ? getPortionDisplay(book.torah_portion, lang) : "—"} />
            <Row Icon={Palette} label="Art style" value={(book.art_style || "3d-pixar").replace("3d-pixar", "3D Pixar")} />
            <Row Icon={Globe2} label="Language" value={book.language || "English"} />
            <Row Icon={Hash} label="Pages" value={String(PAGES_BY_TYPE[productType] ?? "—")} />
          </section>

          {/* Children */}
          {kids.length > 0 && (
            <section className="space-y-2 border-t border-border pt-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Child{kids.length > 1 ? "ren" : ""}</h3>
              <div className="grid grid-cols-2 gap-2">
                {kids.map((k: any) => (
                  <div key={k.id} className="flex items-center gap-2 rounded-xl border border-border p-2">
                    {k.photo_url
                      ? <img src={k.photo_url} alt={k.name} className="w-9 h-9 rounded-full object-cover" />
                      : <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs">{(k.name || "?")[0]}</div>}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{k.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {[k.age && `${k.age}y`, k.gender].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Shipping address */}
          {ship && (ship.street || ship.address1 || ship.city) && (
            <section className="space-y-1 border-t border-border pt-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Ship to
              </h3>
              <p className="text-sm text-foreground">
                {[ship.fullName, ship.street || ship.address1, ship.apt || ship.address2, [ship.city, ship.state || ship.province, ship.zip].filter(Boolean).join(", "), ship.country]
                  .filter(Boolean).join(" · ")}
              </p>
              {ship.phone && <p className="text-xs text-muted-foreground">{ship.phone}</p>}
            </section>
          )}

          {/* Financials (live from Shopify) */}
          <section className="space-y-2 border-t border-border pt-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> Payment (live from Shopify)
            </h3>
            {finLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading order…</div>
            ) : finError ? (
              <p className="text-sm text-destructive">{finError}</p>
            ) : !hasOrder ? (
              <p className="text-sm text-muted-foreground">No Shopify order linked yet (draft or admin-created). Financials appear once the customer has paid.</p>
            ) : fin ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <Row Icon={ReceiptText} label="Total paid" value={formatMoney(fin.total)} />
                  <Row Icon={ReceiptText} label="Subtotal" value={formatMoney(fin.subtotal)} />
                  <Row Icon={ReceiptText} label="Tax" value={formatMoney(fin.tax)} />
                  <Row Icon={Truck} label="Shipping" value={formatMoney(fin.shipping)} />
                  {fin.refunded && fin.refunded.amount > 0 && <Row Icon={ReceiptText} label="Refunded" value={formatMoney(fin.refunded)} />}
                  <Row Icon={CreditCard} label="Method" value={
                    fin.payment?.wallet
                      ? fin.payment.wallet
                      : fin.payment?.cardCompany
                        ? `${fin.payment.cardCompany}${fin.payment.cardLast4 ? ` ••${fin.payment.cardLast4}` : ""}`
                        : (fin.paymentGateways[0] || "—")
                  } />
                  <Row Icon={CheckCircle2} label="Status" value={<span className="capitalize">{(fin.financialStatus || "—").toLowerCase().replace(/_/g, " ")}</span>} />
                  <Row Icon={Truck} label="Fulfillment" value={<span className="capitalize">{(fin.fulfillmentStatus || "—").toLowerCase().replace(/_/g, " ")}</span>} />
                </div>

                {/* Margin (admin estimate) */}
                <div className="rounded-xl bg-secondary/50 p-3 grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Revenue</p><p className="text-sm font-semibold">{revenue != null ? formatMoney({ amount: revenue, currency: fin.subtotal?.currency || "USD" }) : "—"}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Est. COGS</p><p className="text-sm font-semibold">${cogs.toFixed(2)}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Est. profit</p><p className={`text-sm font-semibold ${profit != null && profit < 0 ? "text-destructive" : "text-emerald-600"}`}>{profit != null ? `$${profit.toFixed(2)}` : "—"}</p></div>
                </div>

                {fin.lineItems.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {fin.lineItems.map((li, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{li.quantity}× {li.title}</span>
                        <span>{formatMoney(li.unitPrice)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {fin.fulfillments.some((f) => f.tracking.length) && (
                  <div className="text-xs">
                    {fin.fulfillments.flatMap((f) => f.tracking).map((t, i) => (
                      <a key={i} href={t.url || "#"} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> {t.company || "Tracking"} {t.number || ""}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </section>

          {/* Actions */}
          <section className="flex flex-wrap gap-2 border-t border-border pt-4">
            {canGenerate && (
              <Button size="sm" className="h-8 text-xs" onClick={onGenerate}><Play className="w-3.5 h-3.5" /> Generate</Button>
            )}
            {book.pages_data && (
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onViewEdit}><Eye className="w-3.5 h-3.5" /> View & edit</Button>
            )}
            {book.pages_data && (
              <Button size="sm" variant="outline" className="h-8 text-xs" disabled={downloading} onClick={onDownload}>
                {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} ZIP
              </Button>
            )}
            {book.pages_data && (book.status === "pending_review" || book.status === "ordered") && (
              <Button size="sm" variant="outline" className="h-8 text-xs text-green-600" onClick={onApprove}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve → Printify
              </Button>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
