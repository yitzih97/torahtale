import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ShippingData {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  shippingMethod: "standard" | "express";
}

const DEFAULT_SHIPPING: ShippingData = {
  fullName: "Rachel Goldberg",
  street: "9801 Donna Klein Blvd",
  city: "Boca Raton",
  state: "FL",
  zip: "33428",
  shippingMethod: "standard",
};

interface Props {
  data: ShippingData;
  onChange: (data: ShippingData) => void;
}

export const ShippingForm = ({ data, onChange }: Props) => {
  const update = (partial: Partial<ShippingData>) => onChange({ ...data, ...partial });

  return (
    <div className="space-y-5">
      <div>
        <span className="font-mono text-xs tracking-widest text-accent uppercase">Step 6 of 8</span>
        <h2 className="font-display text-2xl font-bold text-primary mt-1">Shipping Details</h2>
        <p className="text-muted-foreground text-sm mt-1">Where should we deliver this treasure?</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" value={data.fullName} onChange={(e) => update({ fullName: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="street">Street Address</Label>
          <Input id="street" value={data.street} onChange={(e) => update({ street: e.target.value })} className="mt-1" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" value={data.city} onChange={(e) => update({ city: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" value={data.state} onChange={(e) => update({ state: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="zip">Zip Code</Label>
            <Input id="zip" value={data.zip} onChange={(e) => update({ zip: e.target.value })} className="mt-1" />
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Shipping Method</Label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: "standard" as const, label: "Standard", sub: "5–7 business days", price: "Free" },
              { key: "express" as const, label: "Express", sub: "2–3 business days", price: "+$9.99" },
            ]).map((m) => (
              <button
                key={m.key}
                onClick={() => update({ shippingMethod: m.key })}
                className={`p-4 rounded-book border-2 text-left transition-all duration-300 active:scale-[0.98] ${
                  data.shippingMethod === m.key
                    ? "border-accent bg-accent/5 shadow-soft-sm"
                    : "border-border hover:border-accent/40"
                }`}
              >
                <span className="font-medium text-primary text-sm">{m.label}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">{m.sub}</span>
                <span className="block text-xs font-semibold text-accent mt-1">{m.price}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export { DEFAULT_SHIPPING };
