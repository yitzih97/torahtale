import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  BookOpen, Shield, Baby, Palette, MapPin, Truck, Loader2, Save, Lock,
  AlertTriangle, Package,
} from "lucide-react";
import { toast } from "sonner";
import { PAGES_BY_TYPE, type BookOptions } from "@/components/wizard/BookOptionsStep";
import { getProductType } from "@/lib/bookCosts";
import {
  readOrderAddress, writeOrderAddress, readShippingSpeed, SHIPPING_SPEEDS,
  type OrderAddress, type ShippingSpeed,
} from "@/lib/orderShipping";

type ProductType = BookOptions["productType"];

const PRODUCT_CHOICES: { value: ProductType; label: string; dims: string; icon: any }[] = [
  { value: "softcover", label: "Softcover", dims: '8″ × 8″', icon: BookOpen },
  { value: "hardcover", label: "Hardcover", dims: '8″ × 8″', icon: Shield },
  { value: "board", label: "Board book", dims: '6″ × 6″', icon: Baby },
  { value: "coloring", label: "Coloring book", dims: '8.5″ × 11″', icon: Palette },
];

interface Props {
  book: any | null;
  open: boolean;
  onClose: () => void;
  saving: boolean;
  /** Persists the fully-merged shipping_data blob. */
  onSave: (shippingData: Record<string, any>) => Promise<void> | void;
}

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
    {children}
    {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
  </div>
);

/**
 * Admin editor for the two things that still change after an order lands:
 * WHICH book gets printed (format + quantity, meaningful only before the pages
 * are generated, because the page count is per format) and WHERE it goes
 * (address + shipping speed, meaningful until it's handed to Printify).
 */
export function AdminOrderEditDialog({ book, open, onClose, saving, onSave }: Props) {
  const [productType, setProductType] = useState<ProductType>("softcover");
  const [coloringAddon, setColoringAddon] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [speed, setSpeed] = useState<ShippingSpeed>("standard");
  const [addr, setAddr] = useState<OrderAddress>(readOrderAddress(null));
  const [confirmedFormatChange, setConfirmedFormatChange] = useState(false);

  // The book is already at the printer — the address it shipped to is frozen.
  const sentToPrintify = !!book?.printify_order_id ||
    ["printing", "shipped", "delivered"].includes(book?.status);
  // Pages exist, so the format (and therefore the page count) is baked in.
  const generated = !!book?.has_pages;

  useEffect(() => {
    if (!open || !book) return;
    const ship = book.shipping_data || {};
    const opts = ship.bookOptions || book.story_options || {};
    setProductType(getProductType(book));
    setColoringAddon(!!opts.coloringBook);
    setQuantity(Math.max(1, parseInt(ship.quantity) || 1));
    setSpeed(readShippingSpeed(ship));
    setAddr(readOrderAddress(ship));
    setConfirmedFormatChange(false);
    // Reset only when the dialog opens for a different order — re-running on
    // every `book` identity change would discard the admin's in-progress edits
    // each time the 30s books refetch lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, book?.id]);

  const originalType = book ? getProductType(book) : "softcover";
  const formatChanged = productType !== originalType;
  const formatLocked = sentToPrintify || (generated && !confirmedFormatChange);

  const dirty = useMemo(() => {
    if (!book) return false;
    const ship = book.shipping_data || {};
    const opts = ship.bookOptions || book.story_options || {};
    const before = readOrderAddress(ship);
    return (
      formatChanged ||
      !!opts.coloringBook !== coloringAddon ||
      (Math.max(1, parseInt(ship.quantity) || 1)) !== quantity ||
      readShippingSpeed(ship) !== speed ||
      (Object.keys(before) as (keyof OrderAddress)[]).some((k) => before[k] !== addr[k])
    );
  }, [book, coloringAddon, quantity, speed, addr, formatChanged]);

  if (!book) return null;

  const handleSave = async () => {
    const existing = book.shipping_data || {};
    // A standalone coloring book can't also carry the coloring add-on.
    const nextColoringAddon = productType === "coloring" ? false : coloringAddon;
    const merged = writeOrderAddress(existing, addr);
    merged.quantity = quantity;
    merged.shippingMethod = speed;
    merged.bookOptions = {
      ...(existing.bookOptions || book.story_options || {}),
      productType,
      // Hardcover ships in 8×8 only (the 11×8.5 size was retired).
      hardcoverSize: productType === "hardcover" ? "8x8" : undefined,
      coloringBook: nextColoringAddon,
    };
    try {
      await onSave(merged);
      toast.success("Order updated");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Could not save the order");
    }
  };

  const set = (patch: Partial<OrderAddress>) => setAddr((a) => ({ ...a, ...patch }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" />
            Edit order {book.shopify_order_name || book.order_number || book.id.slice(0, 8)}
          </DialogTitle>
          <DialogDescription>
            Change what gets printed and where it ships. Saved to this book only — it does not
            re-charge or refund the customer in Shopify.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* ── Book format ── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Book format</h3>
              {formatLocked && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Lock className="w-3 h-3" /> {sentToPrintify ? "At the printer" : "Already generated"}
                </span>
              )}
            </div>

            {generated && !sentToPrintify && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-[11px] text-amber-800 dark:text-amber-300 space-y-2">
                  <p>
                    This book already has generated pages. Each format prints a different number of
                    pages ({PRODUCT_CHOICES.map((c) => `${c.label} ${PAGES_BY_TYPE[c.value]}`).join(", ")}),
                    so switching now means the story has to be regenerated before it can be printed.
                  </p>
                  {!confirmedFormatChange && (
                    <Button size="sm" variant="outline" className="h-7 text-[11px]"
                      onClick={() => setConfirmedFormatChange(true)}>
                      Unlock format anyway
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRODUCT_CHOICES.map((c) => {
                const active = productType === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    disabled={formatLocked}
                    onClick={() => setProductType(c.value)}
                    className={`rounded-xl border p-3 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      active ? "border-accent bg-accent/10 ring-1 ring-accent" : "border-border hover:bg-secondary/50"
                    }`}
                  >
                    <c.icon className={`w-4 h-4 mb-1.5 ${active ? "text-accent" : "text-muted-foreground"}`} />
                    <p className="text-xs font-medium text-foreground">{c.label}</p>
                    <p className="text-[10px] text-muted-foreground">{c.dims} · {PAGES_BY_TYPE[c.value]}p</p>
                  </button>
                );
              })}
            </div>

            {formatChanged && (
              <p className="text-[11px] text-amber-600">
                Changing {originalType} → {productType}. Regenerate the book after saving so the page
                count matches.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 pt-1">
              <div className="flex items-center gap-2">
                <Switch
                  checked={productType === "coloring" ? false : coloringAddon}
                  disabled={formatLocked || productType === "coloring"}
                  onCheckedChange={setColoringAddon}
                />
                <span className="text-xs text-foreground">
                  Coloring book add-on
                  {productType === "coloring" && <span className="text-muted-foreground"> (already a coloring book)</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-foreground">Quantity</Label>
                <Input
                  type="number" min={1} max={50} value={quantity}
                  disabled={sentToPrintify}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-8 w-20 text-xs"
                />
              </div>
            </div>
          </section>

          {/* ── Shipping speed ── */}
          <section className="space-y-3 border-t border-border pt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Shipping speed
              </h3>
              {sentToPrintify && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Lock className="w-3 h-3" /> Already sent to Printify
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SHIPPING_SPEEDS.map((s) => {
                const active = speed === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    disabled={sentToPrintify}
                    onClick={() => setSpeed(s.value)}
                    className={`rounded-xl border p-3 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      active ? "border-accent bg-accent/10 ring-1 ring-accent" : "border-border hover:bg-secondary/50"
                    }`}
                  >
                    <p className="text-xs font-medium text-foreground">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Shipping address ── */}
          <section className="space-y-3 border-t border-border pt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Ship to
              </h3>
              {sentToPrintify && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Lock className="w-3 h-3" /> Locked once at the printer
                </span>
              )}
            </div>

            {sentToPrintify ? (
              <p className="text-xs text-muted-foreground">
                This order is already with Printify, so its address can't be changed here — cancel the
                Printify order first if it has to move.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="First name">
                  <Input className="h-8 text-xs" value={addr.firstName} onChange={(e) => set({ firstName: e.target.value })} />
                </Field>
                <Field label="Last name">
                  <Input className="h-8 text-xs" value={addr.lastName} onChange={(e) => set({ lastName: e.target.value })} />
                </Field>
                <Field label="Address">
                  <Input className="h-8 text-xs" value={addr.address1} onChange={(e) => set({ address1: e.target.value })} />
                </Field>
                <Field label="Apt / suite">
                  <Input className="h-8 text-xs" value={addr.address2} onChange={(e) => set({ address2: e.target.value })} />
                </Field>
                <Field label="City">
                  <Input className="h-8 text-xs" value={addr.city} onChange={(e) => set({ city: e.target.value })} />
                </Field>
                <Field label="State / province" hint="2-letter code where the country uses one (FL, NY…)">
                  <Input className="h-8 text-xs" value={addr.province} onChange={(e) => set({ province: e.target.value })} />
                </Field>
                <Field label="ZIP / postal code">
                  <Input className="h-8 text-xs" value={addr.zip} onChange={(e) => set({ zip: e.target.value })} />
                </Field>
                <Field label="Country" hint="2-letter ISO code (US, IL, GB…)">
                  <Input className="h-8 text-xs" value={addr.country} onChange={(e) => set({ country: e.target.value.toUpperCase() })} />
                </Field>
                <Field label="Phone">
                  <Input className="h-8 text-xs" value={addr.phone} onChange={(e) => set({ phone: e.target.value })} />
                </Field>
                <Field label="Email" hint="Printify uses this for its own shipping notifications">
                  <Input className="h-8 text-xs" value={addr.email} onChange={(e) => set({ email: e.target.value })} />
                </Field>
              </div>
            )}
          </section>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-8 text-xs" disabled={!dirty || saving} onClick={handleSave}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
