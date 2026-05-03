import { useState } from "react";
import { BookOpen, Check, Sparkles, Shield, Baby } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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
    price: 7.05,
    priceIls: 25,
    dims: '8″ × 8″',
    icon: BookOpen,
    color: "from-blue-500/20 to-blue-600/10",
    image: softcoverImg,
  },
  hardcover: {
    price: 9.95,
    priceIls: 50,
    dims: '8″ × 8″ or 11″ × 8.5″',
    icon: Shield,
    color: "from-accent/20 to-accent/10",
    image: hardcoverImg,
  },
  board: {
    price: 18.28,
    priceIls: 70,
    dims: '6″ × 6″',
    icon: Baby,
    color: "from-pink-500/20 to-pink-600/10",
    image: boardImg,
  },
} as const;


export const BASE_BOOK_PRICE = 7.05;

export function calculateBookPrice(options: BookOptions): number {
  return PRODUCT_INFO[options.productType].price;
}

/** Currency-aware price (returns ILS amount for "ILS", USD for everything else) */
export function calculateBookPriceForCurrency(options: BookOptions, currencyCode: string): number {
  const info = PRODUCT_INFO[options.productType];
  return currencyCode === "ILS" ? info.priceIls : info.price;
}

/* ── component ── */

interface Props {
  options: BookOptions;
  onChange: (options: BookOptions) => void;
  childAge?: number;
}

/* age-based recommendation: board ≤3, softcover 4–6, hardcover 7+ */
const getRecommendedType = (age: number): BookOptions["productType"] | null => {
  if (!age || age < 1) return null;
  if (age <= 3) return "board";
  if (age <= 6) return "softcover";
  return "hardcover";
};

export const BookOptionsStep = ({ options, onChange, childAge = 0 }: Props) => {
  const { t } = useLanguage();
  const { symbol, rate, code } = t.currency;
  const recommendedType = getRecommendedType(childAge);

  const formatPrice = (usd: number, ils?: number) => {
    if (code === "ILS" && typeof ils === "number") return `${symbol}${ils.toFixed(2)}`;
    return `${symbol}${(usd * rate).toFixed(2)}`;
  };

  const selectType = (type: BookOptions["productType"]) => {
    if (type === "hardcover") {
      onChange({ productType: "hardcover", hardcoverSize: "8x8" });
    } else {
      onChange({ productType: type, hardcoverSize: undefined });
    }
  };

  const price = calculateBookPrice(options);
  const priceIls = PRODUCT_INFO[options.productType].priceIls;

  const productLabels: Record<string, string> = {
    softcover: t.bookOptions.softcover,
    hardcover: t.bookOptions.hardcover,
    board: t.bookOptions.boardBook,
  };

  const productTaglines: Record<string, string> = {
    softcover: t.bookOptions.softcoverTagline,
    hardcover: t.bookOptions.hardcoverTagline,
    board: t.bookOptions.boardTagline,
  };

  const productFeatures: Record<string, string[]> = {
    softcover: t.bookOptions.features.softcover,
    hardcover: t.bookOptions.features.hardcover,
    board: t.bookOptions.features.board,
  };


  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-accent" /> {t.bookOptions.chooseSefer}
        </h2>
      </div>


      {subStep === "type" && (
        <div className="grid gap-4">
          {(Object.keys(PRODUCT_INFO) as Array<keyof typeof PRODUCT_INFO>).map((key) => {
            const info = PRODUCT_INFO[key];
            const isActive = options.productType === key;
            const Icon = info.icon;
            const isRecommended = recommendedType === key;
            const badge = isRecommended
              ? t.bookOptions.recommendedForAge(String(childAge))
              : key === "hardcover" ? t.bookOptions.mostPopular : undefined;

            return (
              <button
                key={key}
                onClick={() => selectType(key)}
                className={`relative rounded-2xl border-2 p-5 text-start transition-all duration-300 active:scale-[0.98] ${
                  isActive
                    ? "border-accent bg-accent/5 shadow-lg shadow-accent/10 ring-1 ring-accent/20"
                    : "border-border hover:border-accent/30 hover:shadow-sm"
                }`}
              >
                {badge && (
                  <div className="absolute -top-3 right-4 bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-full">
                    {badge}
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted/30 shrink-0 border border-border/50">
                    <img src={info.image} alt={productLabels[key]} className="w-full h-full object-cover" loading="lazy" width={80} height={80} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display font-bold text-base text-primary">{productLabels[key]}</span>
                      <span className="text-lg font-bold text-accent">{formatPrice(info.price, info.priceIls)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{productTaglines[key]} · {info.dims}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {productFeatures[key].map((f, i) => (
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


      {/* Live price summary */}
      <div className="rounded-2xl bg-muted/30 border border-border p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">{t.bookOptions.yourSelection}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {productLabels[options.productType]} · {PRODUCT_INFO[options.productType].dims}
            </p>
          </div>
          <span className="text-2xl font-bold text-accent">{formatPrice(price, priceIls)}</span>
        </div>
      </div>
    </div>
  );
};
