import { useState } from "react";
import { BookOpen, Check, Sparkles, Shield, Baby, ChevronRight } from "lucide-react";

import softcoverImg from "@/assets/books/softcover-preview.jpg";
import hardcoverImg from "@/assets/books/hardcover-preview.jpg";
import boardImg from "@/assets/books/board-preview.jpg";

export interface BookOptions {
  productType: "softcover" | "hardcover" | "board";
  hardcoverSize?: "8x8" | "11x8.5";
}

export const DEFAULT_BOOK_OPTIONS: BookOptions = {
  productType: "softcover",
};

/* ── pricing (Printify cost + our margin) ── */

const PRODUCT_INFO = {
  softcover: {
    label: "Softcover Photo Book",
    price: 7.05,
    dims: '8″ × 8″',
    icon: BookOpen,
    color: "from-blue-500/20 to-blue-600/10",
    image: softcoverImg,
    features: [
      "100lb semi-gloss paper",
      "Lightweight & flexible",
      "Perfect for everyday reading",
      "Saddle-stitch binding",
    ],
    tagline: "Classic & affordable",
  },
  hardcover: {
    label: "Hardcover Photo Book",
    price: 9.95,
    dims: '8″ × 8″ or 11″ × 8.5″',
    icon: Shield,
    color: "from-accent/20 to-accent/10",
    badge: "MOST POPULAR",
    image: hardcoverImg,
    features: [
      "Glossy or matte finish",
      "Premium case-wrap binding",
      "Sturdy & gift-worthy",
      "Two size options",
    ],
    tagline: "Premium & durable",
  },
  board: {
    label: "Board Book",
    price: 18.28,
    dims: '6″ × 6″',
    icon: Baby,
    color: "from-pink-500/20 to-pink-600/10",
    image: boardImg,
    features: [
      '1/16″ thick chipboard pages',
      "Rounded safety corners",
      "Matte lamination",
      "Perfect for toddlers",
    ],
    tagline: "Built for little hands",
  },
} as const;

const HARDCOVER_SIZES = [
  { key: "8x8" as const, label: '8″ × 8″', desc: "Square — compact & cozy" },
  { key: "11x8.5" as const, label: '11″ × 8.5″', desc: "Landscape — bigger illustrations" },
];

export const BASE_BOOK_PRICE = 7.05;

export function calculateBookPrice(options: BookOptions): number {
  return PRODUCT_INFO[options.productType].price;
}

/* ── component ── */

interface Props {
  options: BookOptions;
  onChange: (options: BookOptions) => void;
}

export const BookOptionsStep = ({ options, onChange }: Props) => {
  const [subStep, setSubStep] = useState<"type" | "size">("type");

  const selectType = (type: BookOptions["productType"]) => {
    if (type === "hardcover") {
      onChange({ productType: "hardcover", hardcoverSize: options.hardcoverSize || "8x8" });
      setSubStep("size");
    } else {
      onChange({ productType: type, hardcoverSize: undefined });
      setSubStep("type");
    }
  };

  const price = calculateBookPrice(options);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-accent" /> Choose Your Sefer
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Select the perfect format for your family.
        </p>
      </div>

      {/* Step indicator */}
      {options.productType === "hardcover" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            onClick={() => setSubStep("type")}
            className={`transition-colors ${subStep === "type" ? "text-accent font-semibold" : "hover:text-foreground"}`}
          >
            Book Type
          </button>
          <ChevronRight className="w-3 h-3" />
          <button
            onClick={() => setSubStep("size")}
            className={`transition-colors ${subStep === "size" ? "text-accent font-semibold" : "hover:text-foreground"}`}
          >
            Size
          </button>
        </div>
      )}

      {subStep === "type" && (
        <div className="grid gap-4">
          {(Object.keys(PRODUCT_INFO) as Array<keyof typeof PRODUCT_INFO>).map((key) => {
            const info = PRODUCT_INFO[key];
            const isActive = options.productType === key;
            const Icon = info.icon;

            return (
              <button
                key={key}
                onClick={() => selectType(key)}
                className={`relative rounded-2xl border-2 p-5 text-left transition-all duration-300 active:scale-[0.98] ${
                  isActive
                    ? "border-accent bg-accent/5 shadow-lg shadow-accent/10 ring-1 ring-accent/20"
                    : "border-border hover:border-accent/30 hover:shadow-sm"
                }`}
              >
                {"badge" in info && info.badge && (
                  <div className="absolute -top-3 right-4 bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-full">
                    {info.badge}
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Preview image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted/30 shrink-0 border border-border/50">
                    {"image" in info && (
                      <img src={info.image} alt={info.label} className="w-full h-full object-cover" loading="lazy" width={80} height={80} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display font-bold text-base text-primary">{info.label}</span>
                      <span className="text-lg font-bold text-accent">${info.price.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{info.tagline} · {info.dims}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {info.features.map((f, i) => (
                        <p key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-accent/60 shrink-0" />
                          {f}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Hardcover size sub-step */}
      {subStep === "size" && options.productType === "hardcover" && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Choose Your Hardcover Size</p>
          <div className="grid grid-cols-2 gap-4">
            {HARDCOVER_SIZES.map((s) => {
              const isActive = options.hardcoverSize === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => onChange({ ...options, hardcoverSize: s.key })}
                  className={`rounded-2xl border-2 p-5 text-center transition-all duration-300 active:scale-[0.97] ${
                    isActive
                      ? "border-accent bg-accent/5 shadow-sm"
                      : "border-border hover:border-accent/30"
                  }`}
                >
                  <span className="font-display font-bold text-lg text-primary block">{s.label}</span>
                  <span className="text-xs text-muted-foreground block mt-1">{s.desc}</span>
                  {isActive && <Check className="w-5 h-5 text-accent mx-auto mt-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Live price summary */}
      <div className="rounded-2xl bg-muted/30 border border-border p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Your Selection</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {PRODUCT_INFO[options.productType].label}
              {options.productType === "hardcover" && options.hardcoverSize
                ? ` · ${options.hardcoverSize === "11x8.5" ? '11″×8.5″' : '8″×8″'}`
                : ` · ${PRODUCT_INFO[options.productType].dims}`}
            </p>
          </div>
          <span className="text-2xl font-bold text-accent">${price.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
