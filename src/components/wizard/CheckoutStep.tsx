import { CreditCard, Lock } from "lucide-react";
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
    <div className="space-y-5">
      <div>
        <span className="font-mono text-xs tracking-widest text-accent uppercase">Step 7 of 8</span>
        <h2 className="font-display text-2xl font-bold text-primary mt-1">Secure Checkout</h2>
        <p className="text-muted-foreground text-sm mt-1">Almost there — let's complete your order.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Payment */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            <span>Secure, encrypted payment</span>
          </div>
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative mt-1">
              <Input id="cardNumber" placeholder="4242 4242 4242 4242" className="pl-10" />
              <CreditCard className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="expiry">Expiry</Label>
              <Input id="expiry" placeholder="MM / YY" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="cvc">CVC</Label>
              <Input id="cvc" placeholder="123" className="mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="cardName">Name on Card</Label>
            <Input id="cardName" placeholder="Rachel Goldberg" className="mt-1" />
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-secondary rounded-book p-5 space-y-3 h-fit">
          <h3 className="font-display text-lg font-semibold text-primary">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Book for {childName}</span>
              <span className="font-medium text-primary">${bookPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Torah Portion</span>
              <span className="font-medium text-primary">{getPortionLabel(torahPortion)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Art Style</span>
              <span className="font-medium text-primary capitalize">{artStyle === "3d-pixar" ? "3D Pixar" : artStyle === "graphic-novel" ? "Graphic Novel" : "Cartoon"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping ({shipping.shippingMethod})</span>
              <span className="font-medium text-primary">{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold text-base">
              <span>Total</span>
              <span className="text-accent">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <Button variant="gold" size="lg" className="w-full" onClick={onPlaceOrder}>
        <Lock className="w-4 h-4" />
        Place Order — ${total.toFixed(2)}
      </Button>
    </div>
  );
};
