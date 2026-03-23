import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ShippingData } from "./ShippingForm";
import { getPortionLabel } from "./TorahPortions";

interface Props {
  childName: string;
  torahPortion: string;
  artStyle: string;
  shipping: ShippingData;
  onPlaceOrder: () => void;
}

export const CheckoutStep = ({ childName, torahPortion, artStyle, shipping, onPlaceOrder }: Props) => {
  const bookPrice = 34.99;
  const shippingCost = shipping.shippingMethod === "express" ? 9.99 : 0;
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
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium text-primary">{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="border-t border-border pt-3 mt-3 flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-accent">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <Button variant="gold" size="lg" className="w-full rounded-xl h-12 text-base" onClick={onPlaceOrder}>
        <Lock className="w-4 h-4" />
        Place Order — ${total.toFixed(2)}
      </Button>
    </div>
  );
};
