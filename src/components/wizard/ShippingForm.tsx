import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Zap } from "lucide-react";

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
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-primary">Where Should We Ship?</h2>
        <p className="text-muted-foreground text-sm mt-1">We'll deliver this treasure right to your door.</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground">Full Name</Label>
          <Input id="fullName" value={data.fullName} onChange={(e) => update({ fullName: e.target.value })} className="mt-1.5 rounded-xl h-11" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Street Address</Label>
          <Input id="street" value={data.street} onChange={(e) => update({ street: e.target.value })} className="mt-1.5 rounded-xl h-11" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">City</Label>
            <Input id="city" value={data.city} onChange={(e) => update({ city: e.target.value })} className="mt-1.5 rounded-xl h-11" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">State</Label>
            <Input id="state" value={data.state} onChange={(e) => update({ state: e.target.value })} className="mt-1.5 rounded-xl h-11" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Zip Code</Label>
            <Input id="zip" value={data.zip} onChange={(e) => update({ zip: e.target.value })} className="mt-1.5 rounded-xl h-11" />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Shipping Speed</Label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: "standard" as const, label: "Standard", sub: "5–7 business days", price: "Free", icon: Package },
              { key: "express" as const, label: "Express", sub: "2–3 business days", price: "+$9.99", icon: Zap },
            ]).map((m) => (
              <button
                key={m.key}
                onClick={() => update({ shippingMethod: m.key })}
                className={`p-5 rounded-2xl border-2 text-left transition-all duration-300 active:scale-[0.98] ${
                  data.shippingMethod === m.key
                    ? "border-accent bg-accent/5 shadow-sm"
                    : "border-border hover:border-accent/30"
                }`}
              >
                <m.icon className={`w-5 h-5 mb-2 ${data.shippingMethod === m.key ? "text-accent" : "text-muted-foreground"}`} />
                <span className="font-semibold text-primary text-sm block">{m.label}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">{m.sub}</span>
                <span className="block text-xs font-bold text-accent mt-2">{m.price}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export { DEFAULT_SHIPPING };
