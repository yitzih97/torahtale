import { useState } from "react";
import { CreditCard, Lock, ShieldCheck, CalendarHeart, Check, Sparkles, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ShippingData } from "./ShippingForm";
import { getPortionLabel } from "./TorahPortions";
import { type BookOptions, calculateBookPrice } from "./BookOptionsStep";

interface Props {
  childName: string;
  torahPortion: string;
  artStyle: string;
  shipping: ShippingData;
  bookOptions: BookOptions;
  onPlaceOrder: (subscribeWeekly: boolean) => void;
}

export const CheckoutStep = ({ childName, torahPortion, artStyle, shipping, bookOptions, onPlaceOrder }: Props) => {
  const [subscribeWeekly, setSubscribeWeekly] = useState(false);
  const bookPrice = calculateBookPrice(bookOptions);
  const shippingCost = shipping.shippingMethod === "express" ? 9.99 : 0;
  const fullWeeklyPrice = 29.99;
  const weeklyPrice = 23.99; // 20% off
  const savings = fullWeeklyPrice - weeklyPrice;
  const total = bookPrice + shippingCost;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-primary">Complete Your Order</h2>
        <p className="text-muted-foreground text-sm mt-1">One last step — secure checkout.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Payment */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span>256-bit encrypted payment</span>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Card Number</Label>
            <div className="relative mt-1.5">
              <Input placeholder="4242 4242 4242 4242" className="pl-10 rounded-xl h-11" />
              <CreditCard className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Expiry</Label>
              <Input placeholder="MM / YY" className="mt-1.5 rounded-xl h-11" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">CVC</Label>
              <Input placeholder="123" className="mt-1.5 rounded-xl h-11" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Name on Card</Label>
            <Input placeholder="Rachel Goldberg" className="mt-1.5 rounded-xl h-11" />
          </div>
        </div>

        {/* Order summary */}
        <div className="space-y-4">
          <div className="bg-muted/30 rounded-2xl p-5 space-y-3 h-fit border border-border">
            <h3 className="font-display text-lg font-semibold text-primary">Order Summary</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Book for {childName}</span>
                <span className="font-medium text-primary">${bookPrice.toFixed(2)}</span>
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
                <span className="text-muted-foreground">Cover</span>
                <span className="font-medium text-primary capitalize">{bookOptions.coverType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size</span>
                <span className="font-medium text-primary capitalize">{bookOptions.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pages</span>
                <span className="font-medium text-primary capitalize">{bookOptions.pageType === "board" ? "Board Pages" : "Standard"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-primary">{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
              </div>
              {subscribeWeekly && (
                <div className="flex justify-between text-accent">
                  <span>Weekly Parashah Club</span>
                  <div className="text-right">
                    <span className="font-medium">${weeklyPrice}/wk</span>
                    <span className="text-[10px] line-through text-muted-foreground ml-1.5">${fullWeeklyPrice}</span>
                  </div>
                </div>
              )}
              <div className="border-t border-border pt-3 mt-3 flex justify-between font-bold text-base">
                <span>Total Today</span>
                <span className="text-accent">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Weekly subscription upsell — more engaging */}
          <button
            onClick={() => setSubscribeWeekly(!subscribeWeekly)}
            className={`w-full rounded-2xl border-2 p-4 text-left transition-all duration-300 active:scale-[0.98] relative overflow-hidden ${
              subscribeWeekly
                ? "border-accent bg-accent/5 shadow-md shadow-accent/10"
                : "border-border hover:border-accent/40 hover:shadow-sm"
            }`}
          >
            {/* Savings badge */}
            <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl">
              SAVE 20%
            </div>

            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                subscribeWeekly ? "bg-accent text-accent-foreground" : "bg-accent/10 text-accent"
              }`}>
                {subscribeWeekly ? <Check className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              </div>
              <div className="flex-1 pr-8">
                <p className="font-display font-semibold text-sm text-primary">
                  ✨ Join Parashah Club — Never Miss a Story!
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Every week, {childName} gets a brand-new personalized Torah adventure based on the weekly Parsha — delivered right to your door!
                </p>
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full">
                    <TrendingDown className="w-3 h-3" /> ${weeklyPrice}/wk (was ${fullWeeklyPrice})
                  </span>
                  <span className="text-[10px] font-medium text-primary bg-primary/5 px-2 py-1 rounded-full">🚚 Free shipping</span>
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">Cancel anytime</span>
                </div>
                <p className="text-[11px] text-accent font-semibold mt-2">
                  💰 You save ${savings.toFixed(2)} every week — that's ${(savings * 52).toFixed(0)}+ per year!
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <Button variant="gold" size="lg" className="w-full rounded-xl h-12 text-base" onClick={() => onPlaceOrder(subscribeWeekly)}>
        <Lock className="w-4 h-4" />
        {subscribeWeekly ? `Subscribe & Place Order — $${total.toFixed(2)}` : `Place Order — $${total.toFixed(2)}`}
      </Button>
    </div>
  );
};
