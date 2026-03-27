import { useState } from "react";
import { Crown, ShieldCheck, Check, Sparkles, TrendingDown, Zap, CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ShippingData } from "./ShippingForm";
import { getPortionLabel } from "./TorahPortions";
import { type BookOptions, calculateBookPrice } from "./BookOptionsStep";

type PlanType = "weekly" | "monthly" | "yearly" | "once";

interface Plan {
  id: PlanType;
  label: string;
  price: number;
  perWeek: number;
  savings: string;
  icon: typeof Crown;
  badge?: string;
  description: string;
}

const PLANS: Plan[] = [
  {
    id: "weekly",
    label: "Weekly",
    price: 23.99,
    perWeek: 23.99,
    savings: "20% off",
    icon: Zap,
    description: "A new Torah adventure every Shabbos",
  },
  {
    id: "monthly",
    label: "Monthly",
    price: 79.99,
    perWeek: 19.99,
    savings: "33% off",
    icon: Crown,
    badge: "MOST POPULAR",
    description: "4 seforim/month — best value for mishpachos",
  },
  {
    id: "yearly",
    label: "Yearly",
    price: 799.99,
    perWeek: 15.38,
    savings: "49% off",
    icon: CalendarDays,
    description: "Full year of seforim — biggest savings",
  },
];

interface Props {
  childName: string;
  torahPortion: string;
  artStyle: string;
  shipping: ShippingData;
  bookOptions: BookOptions;
  onPlaceOrder: (subscribeWeekly: boolean) => void;
}

export const CheckoutStep = ({ childName, torahPortion, artStyle, shipping, bookOptions, onPlaceOrder }: Props) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("monthly");
  const [placingOrder, setPlacingOrder] = useState(false);
  const bookPrice = calculateBookPrice(bookOptions);
  const shippingCost = shipping.shippingMethod === "express" ? 9.99 : 0;

  const isSubscription = selectedPlan !== "once";
  const activePlan = PLANS.find((p) => p.id === selectedPlan);

  const total = isSubscription
    ? (activePlan?.price ?? 0) + shippingCost
    : bookPrice + shippingCost;

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    try {
      await onPlaceOrder(isSubscription);
    } catch (err) {
      console.error("Order failed:", err);
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-primary">Choose Your Plan</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Subscribe and {childName} gets a new personalized Torah sefer every Shabbos!
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
                  {plan.badge}
                </div>
              )}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                isActive ? "bg-accent text-accent-foreground" : "bg-accent/10 text-accent"
              }`}>
                {isActive ? <Check className="w-5 h-5" /> : <plan.icon className="w-5 h-5" />}
              </div>
              <p className="font-display font-bold text-base text-primary">{plan.label}</p>
              <div className="mt-1.5">
                <span className="text-xl font-bold text-accent">${plan.price}</span>
                <span className="text-xs text-muted-foreground">/{plan.id === "yearly" ? "yr" : plan.id === "monthly" ? "mo" : "wk"}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{plan.description}</p>
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                  <TrendingDown className="w-3 h-3" /> {plan.savings}
                </span>
                <span className="text-[10px] text-muted-foreground">${plan.perWeek.toFixed(2)}/wk</span>
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
          {selectedPlan === "once" ? "✓ One-time purchase selected" : "Skip subscription — purchase this book only"}
        </button>
      </div>

      {/* Order summary */}
      <div className="bg-muted/30 rounded-2xl p-5 space-y-3 border border-border">
        <h3 className="font-display text-lg font-semibold text-primary">Order Summary</h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Book for {childName}</span>
            <span className="font-medium text-primary">
              {isSubscription ? "Included" : `$${bookPrice.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Story</span>
            <span className="font-medium text-primary">{getPortionLabel(torahPortion)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Art Style</span>
            <span className="font-medium text-primary capitalize">{artStyle === "3d-pixar" ? "3D Pixar" : artStyle === "graphic-novel" ? "Graphic Novel" : "Cartoon"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Format</span>
            <span className="font-medium text-primary">
              {bookOptions.productType === "hardcover"
                ? `Hardcover ${bookOptions.hardcoverSize === "11x8.5" ? '11″×8.5″' : '8″×8″'}`
                : bookOptions.productType === "board"
                ? 'Board Book 6″×6″'
                : 'Softcover 8″×8″'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium text-primary">{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
          </div>
          {isSubscription && activePlan && (
            <div className="flex justify-between text-accent">
              <span>{activePlan.label} Plan</span>
              <span className="font-medium">${activePlan.price}/{activePlan.id === "yearly" ? "yr" : activePlan.id === "monthly" ? "mo" : "wk"}</span>
            </div>
          )}
          <div className="border-t border-border pt-3 mt-3 flex justify-between font-bold text-base">
            <span>Total Today</span>
            <span className="text-accent">${total.toFixed(2)}</span>
          </div>
          {isSubscription && (
            <p className="text-[10px] text-muted-foreground">
              🚚 Free shipping on all subscription deliveries · Cancel anytime
            </p>
          )}
        </div>
      </div>

      {/* Secure checkout info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
        <ShieldCheck className="w-4 h-4 text-accent" />
        <span>Secure checkout · 256-bit encryption · Your payment details are safe</span>
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
              ? `Subscribe & Place Order — $${total.toFixed(2)}`
              : `Place Order — $${total.toFixed(2)}`}
          </>
        )}
      </Button>
    </div>
  );
};
