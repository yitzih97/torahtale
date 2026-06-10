import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";

export interface ShippingData {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  shippingMethod: "standard" | "express";
  sameAsBilling?: boolean;
}

const DEFAULT_SHIPPING: ShippingData = {
  fullName: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  shippingMethod: "standard",
  sameAsBilling: true,
};

interface Props {
  data: ShippingData;
  onChange: (data: ShippingData) => void;
  isSubscription?: boolean;
}

interface BillingAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

const EMPTY_ADDR: BillingAddress = { fullName: "", street: "", city: "", state: "", zip: "" };

export const ShippingForm = ({ data, onChange, isSubscription = false }: Props) => {
  const { t } = useLanguage();
  const sameAsBilling = data.sameAsBilling ?? true;

  // Billing kept locally; when sameAsBilling is on, it mirrors the shipping data.
  const [billing, setBilling] = useState<BillingAddress>(() =>
    sameAsBilling
      ? { fullName: data.fullName, street: data.street, city: data.city, state: data.state, zip: data.zip }
      : EMPTY_ADDR,
  );

  const update = (partial: Partial<ShippingData>) => onChange({ ...data, ...partial });

  const updateBilling = (partial: Partial<BillingAddress>) => {
    const next = { ...billing, ...partial };
    setBilling(next);
    if (sameAsBilling) {
      onChange({ ...data, ...next });
    }
  };

  const toggleSame = (checked: boolean) => {
    if (checked) {
      // Re-mirror billing into shipping
      onChange({ ...data, ...billing, sameAsBilling: true });
    } else {
      // Detach: clear shipping fields for user input
      onChange({
        ...data,
        sameAsBilling: false,
        fullName: "",
        street: "",
        city: "",
        state: "",
        zip: "",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Payment Section ── */}
      <div className="space-y-4">
        <h3 className="font-display text-2xl font-bold text-primary">{t.shipping.paymentDetails}</h3>

        <div>
          <Label className="text-xs text-muted-foreground">{t.shipping.cardNumber}</Label>
          <Input placeholder="1234 5678 9012 3456" inputMode="numeric" autoComplete="cc-number" className="mt-1.5 rounded-xl h-11" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">{t.shipping.expiration}</Label>
            <Input placeholder="MM/YY" autoComplete="cc-exp" className="mt-1.5 rounded-xl h-11" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t.shipping.cvc}</Label>
            <Input placeholder="123" inputMode="numeric" autoComplete="cc-csc" className="mt-1.5 rounded-xl h-11" />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{t.shipping.nameOnCard}</Label>
          <Input placeholder={t.shipping.cardNamePlaceholder} autoComplete="cc-name" className="mt-1.5 rounded-xl h-11" />
        </div>

        {/* Billing address */}
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground">{t.shipping.fullName}</Label>
          <Input value={billing.fullName} onChange={(e) => updateBilling({ fullName: e.target.value })} className="mt-1.5 rounded-xl h-11" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{t.shipping.streetAddress}</Label>
          <Input value={billing.street} onChange={(e) => updateBilling({ street: e.target.value })} className="mt-1.5 rounded-xl h-11" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">{t.shipping.city}</Label>
            <Input value={billing.city} onChange={(e) => updateBilling({ city: e.target.value })} className="mt-1.5 rounded-xl h-11" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t.shipping.state}</Label>
            <Input value={billing.state} onChange={(e) => updateBilling({ state: e.target.value })} className="mt-1.5 rounded-xl h-11" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t.shipping.zipCode}</Label>
            <Input value={billing.zip} onChange={(e) => updateBilling({ zip: e.target.value })} className="mt-1.5 rounded-xl h-11" />
          </div>
        </div>
      </div>

      {/* ── Shipping Section ── */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-2xl font-bold text-primary">{t.shipping.whereShip}</h3>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 px-4 py-3">
          <Label htmlFor="same-as-billing" className="text-sm font-medium cursor-pointer">
            {t.shipping.sameAsBilling}
          </Label>
          <Switch id="same-as-billing" checked={sameAsBilling} onCheckedChange={toggleSame} />
        </div>

        {!sameAsBilling && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">{t.shipping.fullName}</Label>
              <Input value={data.fullName} onChange={(e) => update({ fullName: e.target.value })} className="mt-1.5 rounded-xl h-11" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t.shipping.streetAddress}</Label>
              <Input value={data.street} onChange={(e) => update({ street: e.target.value })} className="mt-1.5 rounded-xl h-11" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">{t.shipping.city}</Label>
                <Input value={data.city} onChange={(e) => update({ city: e.target.value })} className="mt-1.5 rounded-xl h-11" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t.shipping.state}</Label>
                <Input value={data.state} onChange={(e) => update({ state: e.target.value })} className="mt-1.5 rounded-xl h-11" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t.shipping.zipCode}</Label>
                <Input value={data.zip} onChange={(e) => update({ zip: e.target.value })} className="mt-1.5 rounded-xl h-11" />
              </div>
            </div>
          </div>
        )}

        {isSubscription ? (
          <div className="rounded-2xl border-2 border-accent/30 bg-accent/5 p-4 text-sm text-foreground text-center">
            {t.shipping.subscriptionShipNote}
          </div>
        ) : null}

        {!isSubscription && (
          <div className="space-y-3 pt-2">
            <Label className="text-sm font-medium">{t.shipping.shippingSpeed}</Label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: "standard" as const, label: t.shipping.standard, sub: t.shipping.standardTime, price: t.shipping.free, icon: Package },
                { key: "express" as const, label: t.shipping.express, sub: t.shipping.expressTime, price: t.shipping.expressCost, icon: Zap },
              ]).map((m) => (
                <button
                  key={m.key}
                  onClick={() => update({ shippingMethod: m.key })}
                  className={`p-5 rounded-2xl border-2 text-start transition-all duration-300 active:scale-[0.98] ${
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
        )}
      </div>
    </div>
  );
};

export { DEFAULT_SHIPPING };
