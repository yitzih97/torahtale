import { BookOpen, Shield, Baby, Palette } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

import softcoverImg from "@/assets/books/mockup-softcover.jpg";
import hardcoverImg from "@/assets/books/mockup-hardcover.jpg";
import boardImg from "@/assets/books/mockup-board.jpg";
import coloringImg from "@/assets/books/mockup-coloring.jpg";

export interface BookOptions {
  productType: "softcover" | "hardcover" | "board" | "coloring";
  // Hardcover is offered in 8×8 only (the 11×8.5 size was retired).
  hardcoverSize?: "8x8";
  coloringBook?: boolean;
}

export const DEFAULT_BOOK_OPTIONS: BookOptions = {
  productType: "softcover",
  coloringBook: false,
};

// Story units generated per format, matching each Printify blueprint's interior
// capacity (District Photo):
//   • board (6×6, bp 2727)     → Cover + 10 SPREADS  → 10 (one wide image per spread)
//   • softcover (8×8, bp 2733) → Cover + 20 PAGES    → 20 (one image per page)
//   • hardcover (8×8, bp 2737) → Cover + 24 PAGES    → 24 (one image per page)
export const PAGES_BY_TYPE: Record<BookOptions["productType"], number> = {
  softcover: 20,
  hardcover: 24,
  board: 10,
  coloring: 24, // standalone coloring book (bp 2721, 8.5×11, Cover + 24 pages)
};

const COLORING_BOOK_ADDON_PRICE_USD = 3;
const COLORING_BOOK_ADDON_PRICE_ILS = 12;

export function getStoryPageCount(options: BookOptions): number {
  return PAGES_BY_TYPE[options.productType] ?? 20;
}

// Prices must match the live Shopify product variants — checkout charges the
// variant price, so a mismatch here would show one price and bill another.
const PRODUCT_INFO = {
  softcover: {
    price: 14.99,
    priceIls: 55,
    dims: '8″ × 8″',
    icon: BookOpen,
    image: softcoverImg,
  },
  hardcover: {
    price: 24.99,
    priceIls: 90,
    dims: '8″ × 8″',
    icon: Shield,
    image: hardcoverImg,
  },
  board: {
    price: 29.99,
    priceIls: 110,
    dims: '6″ × 6″',
    icon: Baby,
    image: boardImg,
  },
  coloring: {
    price: 16.99,
    priceIls: 60,
    dims: '8.5″ × 11″',
    icon: Palette,
    image: coloringImg,
  },
} as const;

export const BASE_BOOK_PRICE = 14.99;

export function getColoringBookAddonPrice(currencyCode: string): number {
  return currencyCode === "ILS" ? COLORING_BOOK_ADDON_PRICE_ILS : COLORING_BOOK_ADDON_PRICE_USD;
}

export function calculateBookPrice(options: BookOptions): number {
  return PRODUCT_INFO[options.productType].price + (options.coloringBook ? COLORING_BOOK_ADDON_PRICE_USD : 0);
}

export function calculateBookPriceForCurrency(options: BookOptions, currencyCode: string): number {
  const info = PRODUCT_INFO[options.productType];
  const base = currencyCode === "ILS" ? info.priceIls : info.price;
  return base + (options.coloringBook ? getColoringBookAddonPrice(currencyCode) : 0);
}

interface Props {
  options: BookOptions;
  onChange: (options: BookOptions) => void;
  childAge?: number;
  hideHeader?: boolean;
}

const getRecommendedType = (age: number): BookOptions["productType"] | null => {
  if (!age || age < 1) return null;
  if (age <= 3) return "board";
  if (age <= 6) return "softcover";
  return "hardcover";
};

export const BookOptionsStep = ({ options, onChange, childAge = 0, hideHeader = false }: Props) => {
  const { t } = useLanguage();
  const { symbol, rate, code } = t.currency;
  const recommendedType = getRecommendedType(childAge);

  const formatPrice = (usd: number, ils?: number) => {
    if (code === "ILS" && typeof ils === "number") return `${symbol}${ils.toFixed(2)}`;
    return `${symbol}${(usd * rate).toFixed(2)}`;
  };

  const selectType = (type: BookOptions["productType"]) => {
    if (type === "hardcover") {
      onChange({ ...options, productType: "hardcover", hardcoverSize: "8x8" });
      return;
    }
    // A standalone coloring book can't also carry the coloring add-on.
    if (type === "coloring") {
      onChange({ ...options, productType: "coloring", hardcoverSize: undefined, coloringBook: false });
      return;
    }
    onChange({ ...options, productType: type, hardcoverSize: undefined });
  };

  const productLabels: Record<BookOptions["productType"], string> = {
    softcover: t.bookOptions.softcover,
    hardcover: t.bookOptions.hardcover,
    board: t.bookOptions.boardBook,
    coloring: t.productsShowcase.coloring,
  };

  const productTaglines: Record<BookOptions["productType"], string> = {
    softcover: t.bookOptions.softcoverTagline,
    hardcover: t.bookOptions.hardcoverTagline,
    board: t.bookOptions.boardTagline,
    coloring: t.productsShowcase.coloringTagline,
  };

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="text-center">
          <h2 className="font-display text-xl font-bold text-foreground">{t.bookOptions.chooseSefer}</h2>
        </div>
      )}

      <div className="grid gap-4">
        {(Object.keys(PRODUCT_INFO) as Array<keyof typeof PRODUCT_INFO>).map((key) => {
          const info = PRODUCT_INFO[key];
          const isActive = options.productType === key;
          const isRecommended = recommendedType === key;
          const badge = isRecommended
            ? t.bookOptions.recommendedForAge(String(childAge))
            : key === "hardcover"
              ? t.bookOptions.mostPopular
              : undefined;
          const Icon = info.icon;

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
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div>
                      <span className="font-display font-bold text-base text-primary flex items-center gap-2">
                        <Icon className="w-4 h-4 text-accent" />
                        {productLabels[key]}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{productTaglines[key]}</p>
                    </div>
                    <span className="text-lg font-bold text-accent">{formatPrice(info.price, info.priceIls)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{info.dims}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* The coloring book is sold only as a standalone product (above), not as a
          +$3 add-on. */}
    </div>
  );
};
