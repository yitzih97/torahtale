import { useState } from "react";
import { Crown, ShieldCheck, Check, Sparkles, TrendingDown, Zap, CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ShippingData } from "./ShippingForm";
import { getPortionLabel } from "./TorahPortions";
import { type BookOptions, calculateBookPrice, calculateBookPriceForCurrency } from "./BookOptionsStep";

export type PlanType = "weekly" | "monthly" | "yearly" | "once";

interface Plan {
  id: PlanType;
  priceUsd: number;
  perWeekUsd: number;
  savings: string;
  icon: typeof Crown;
  badge?: boolean;
}

/* Round to a friendly .99 price */
const friendly = (n: number) => Math.max(0.99, Math.round(n) - 0.01);

function buildPlansForBook(bookPriceUsd: number): Plan[] {
  const weekly = friendly(bookPriceUsd * 1 * (1 - 0.20));
  const monthly = friendly(bookPriceUsd * 4 * (1 - 0.33));
  const yearly = friendly(bookPriceUsd * 52 * (1 - 0.49));
  return [
    { id: "weekly", priceUsd: weekly, perWeekUsd: weekly, savings: "20% off", icon: Zap },
    { id: "monthly", priceUsd: monthly, perWeekUsd: monthly / 4, savings: "33% off", icon: Crown, badge: true },
    { id: "yearly", priceUsd: yearly, perWeekUsd: yearly / 52, savings: "49% off", icon: CalendarDays },
  ];
}

interface Props {
  childName: string;
  torahPortion: string;
  artStyle: string;
  shipping: ShippingData;
  bookOptions: BookOptions;
  onPlaceOrder: (planType: PlanType) => void;
}

export const CheckoutStep = ({ childName, torahPortion, artStyle, shipping, bookOptions, onPlaceOrder }: Props) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("monthly");
  const [placingOrder, setPlacingOrder] = useState(false);
  const { t } = useLanguage();
  const { symbol, rate } = t.currency;

  const fmt = (usd: number) => `${symbol}${(usd * rate).toFixed(2)}`;

  const bookPrice = calculateBookPrice(bookOptions);
  const shippingCostUsd = shipping.shippingMethod === "express" ? 9.99 : 0;

  const PLANS = buildPlansForBook(bookPrice);

  const isSubscription = selectedPlan !== "once";
  const activePlan = PLANS.find((p) => p.id === selectedPlan);

  const totalUsd = isSubscription
    ? (activePlan?.priceUsd ?? 0) + shippingCostUsd
    : bookPrice + shippingCostUsd;

  const periodLabel = (id: string) =>
    id === "yearly" ? (t.currency.code === "ILS" ? "שנה" : "yr")
    : id === "monthly" ? (t.currency.code === "ILS" ? "חודש" : "mo")
    : (t.currency.code === "ILS" ? "שבוע" : "wk");

  const planLabels: Record<string, string> = {
    weekly: t.checkout.weekly,
    monthly: t.checkout.monthly,
    yearly: t.checkout.yearly,
  };

  const planDescs: Record<string, string> = {
    weekly: t.checkout.weeklyDesc,
    monthly: t.checkout.monthlyDesc,
    yearly: t.checkout.yearlyDesc,
  };

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    try {
      await onPlaceOrder(selectedPlan);
    } catch (err) {
      console.error("Order failed:", err);
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-primary">{t.checkout.choosePlan}</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t.checkout.subscribeMsg(childName)}
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        {PLANS.map((plan) => {
          const isActive = selectedPlan === plan.id;
          return (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-2xl border-2 p-4 text-left transition-all duration-200 active:scale-[0.98] ${
                isActive
                  ? "border-accent bg-accent/5 shadow-lg shadow-accent/10 ring-1 ring-accent/20"
                  : "border-border hover:border-accent/30 hover:shadow-sm"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  {t.bookOptions.mostPopular}
                </div>
              )}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                isActive ? "bg-accent text-accent-foreground" : "bg-accent/10 text-accent"
              }`}>
                {isActive ? <Check className="w-5 h-5" /> : <plan.icon className="w-5 h-5" />}
              </div>
              <p className="font-display font-bold text-base text-primary">{planLabels[plan.id]}</p>
              <div className="mt-1.5">
                <span className="text-xl font-bold text-accent">{fmt(plan.priceUsd)}</span>
                <span className="text-xs text-muted-foreground">/{periodLabel(plan.id)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{planDescs[plan.id]}</p>
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                  <TrendingDown className="w-3 h-3" /> {plan.savings}
                </span>
                <span className="text-[10px] text-muted-foreground">{fmt(plan.perWeekUsd)}/{t.currency.code === "ILS" ? "שבוע" : "wk"}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Skip subscription link */}
      <div className="text-center">
        <button
          onClick={() => setSelectedPlan(selectedPlan === "once" ? "monthly" : "once")}
          className={`text-xs transition-colors ${
            selectedPlan === "once"
              ? "text-accent font-medium"
              : "text-muted-foreground/60 hover:text-muted-foreground underline underline-offset-2"
          }`}
        >
          {selectedPlan === "once" ? t.checkout.oneTimePurchase : t.checkout.skipSubscription}
        </button>
      </div>

      {/* Order summary */}
      <div className="bg-muted/30 rounded-2xl p-5 space-y-3 border border-border">
        <h3 className="font-display text-lg font-semibold text-primary">{t.checkout.orderSummary}</h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.checkout.bookFor(childName)}</span>
            <span className="font-medium text-primary">
              {isSubscription ? t.checkout.included : fmt(bookPrice)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.wizard.story}</span>
            <span className="font-medium text-primary">{getPortionLabel(torahPortion)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.wizard.artStyle}</span>
            <span className="font-medium text-primary capitalize">{artStyle === "3d-pixar" ? "3D Pixar" : artStyle === "graphic-novel" ? "Graphic Novel" : "Cartoon"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.checkout.format}</span>
            <span className="font-medium text-primary">
              {bookOptions.productType === "hardcover"
                ? `${t.bookOptions.hardcover} ${bookOptions.hardcoverSize === "11x8.5" ? '11″×8.5″' : '8″×8″'}`
                : bookOptions.productType === "board"
                ? `${t.bookOptions.boardBook} 6″×6″`
                : `${t.bookOptions.softcover} 8″×8″`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.checkout.shippingLabel}</span>
            <span className="font-medium text-primary">{shippingCostUsd === 0 ? t.checkout.freeShipping : fmt(shippingCostUsd)}</span>
          </div>
          {isSubscription && activePlan && (
            <div className="flex justify-between text-accent">
              <span>{planLabels[activePlan.id]} {t.checkout.plan}</span>
              <span className="font-medium">{fmt(activePlan.priceUsd)}/{periodLabel(activePlan.id)}</span>
            </div>
          )}
          <div className="border-t border-border pt-3 mt-3 flex justify-between font-bold text-base">
            <span>{t.checkout.totalToday}</span>
            <span className="text-accent">{fmt(totalUsd)}</span>
          </div>
          {isSubscription && (
            <p className="text-[10px] text-muted-foreground">
              {t.checkout.freeShipNote}
            </p>
          )}
        </div>
      </div>

      {/* Secure checkout info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
        <ShieldCheck className="w-4 h-4 text-accent" />
        <span>{t.checkout.secureCheckout}</span>
      </div>

      <Button
        variant="gold"
        size="lg"
        className="w-full rounded-xl h-12 text-base"
        onClick={handlePlaceOrder}
        disabled={placingOrder}
      >
        {placingOrder ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {isSubscription
              ? t.checkout.subscribeOrder((totalUsd * rate).toFixed(2))
              : t.checkout.placeOrder((totalUsd * rate).toFixed(2))}
          </>
        )}
      </Button>
    </div>
  );
};
