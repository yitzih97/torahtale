import { Minus, Plus, Gift, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

/** Returns 0 / 0.10 / 0.15 based on quantity */
export function getVolumeDiscount(qty: number): number {
  if (qty >= 3) return 0.15;
  if (qty === 2) return 0.10;
  return 0;
}

interface Props {
  quantity: number;
  onChange: (qty: number) => void;
  unitPrice: number;
  currencySymbol: string;
}

export const QuantityStep = ({ quantity, onChange, unitPrice, currencySymbol }: Props) => {
  const { t } = useLanguage();

  const title = t.quantity.title;
  const sub = t.quantity.subtitle;
  const copyLabel = (n: number) => (n === 1 ? t.quantity.copyOne : t.quantity.copyMany(n));
  const customLabel = t.quantity.custom;
  const subtotalLabel = t.quantity.subtotal;
  const savingsLabel = (pct: number) => t.quantity.save(pct);
  const giftHint = t.quantity.giftHint;

  const discount = getVolumeDiscount(quantity);
  const subtotal = unitPrice * quantity;
  const total = subtotal * (1 - discount);


  const presets = [1, 2, 3];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{sub}</p>
      </div>

      {/* Preset chips */}
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
        {presets.map((n) => {
          const isActive = quantity === n;
          const pct = getVolumeDiscount(n) * 100;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`relative rounded-2xl border-2 p-4 transition-all duration-200 active:scale-[0.97] ${
                isActive
                  ? "border-accent bg-accent/5 shadow-lg shadow-accent/10 ring-1 ring-accent/20"
                  : "border-border hover:border-accent/30"
              }`}
            >
              {pct > 0 && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-[10px] font-bold text-accent-foreground bg-accent px-2 py-0.5 rounded-full whitespace-nowrap">
                  <TrendingDown className="w-3 h-3" />{savingsLabel(pct)}
                </span>
              )}
              <div className="text-3xl font-display font-bold text-primary">{n}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{copyLabel(n)}</div>
            </button>
          );
        })}
      </div>

      {/* Custom stepper */}
      <div className="max-w-md mx-auto rounded-2xl border border-border bg-muted/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Gift className="w-4 h-4 text-accent" />
          {customLabel}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => onChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <input
            type="number"
            min={1}
            max={50}
            value={quantity}
            onChange={(e) => {
              const v = parseInt(e.target.value || "1", 10);
              onChange(Math.max(1, Math.min(50, isNaN(v) ? 1 : v)));
            }}
            className="w-14 h-9 text-center rounded-lg border border-border bg-background font-semibold text-primary"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => onChange(Math.min(50, quantity + 1))}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Live total */}
      <div className="max-w-md mx-auto rounded-2xl border border-border bg-card p-5 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{subtotalLabel}</span>
          <span className="font-medium text-primary">{currencySymbol}{subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-accent">
            <span>{savingsLabel(discount * 100)}</span>
            <span className="font-medium">−{currencySymbol}{(subtotal - total).toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-border pt-2 flex justify-between font-bold">
          <span className="text-primary">{isHe ? "סה״כ" : "Total"}</span>
          <span className="text-accent text-lg">{currencySymbol}{total.toFixed(2)}</span>
        </div>
      </div>

      {discount === 0 && (
        <p className="text-center text-xs text-muted-foreground">{giftHint}</p>
      )}
    </div>
  );
};
