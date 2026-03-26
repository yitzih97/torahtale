import { useState } from "react";
import { BookOpen, Ruler, FileText, Check } from "lucide-react";

export interface BookOptions {
  coverType: "softcover" | "hardcover";
  size: "small" | "medium" | "large";
  pageType: "standard" | "board";
}

export const DEFAULT_BOOK_OPTIONS: BookOptions = {
  coverType: "softcover",
  size: "medium",
  pageType: "standard",
};

/* ── pricing logic ── */

const COVER_PRICES: Record<BookOptions["coverType"], number> = {
  softcover: 0,
  hardcover: 12,
};

const SIZE_PRICES: Record<BookOptions["size"], number> = {
  small: 0,
  medium: 5,
  large: 10,
};

const PAGE_PRICES: Record<BookOptions["pageType"], number> = {
  standard: 0,
  board: 8,
};

export const BASE_BOOK_PRICE = 24.99;

export function calculateBookPrice(options: BookOptions): number {
  return (
    BASE_BOOK_PRICE +
    COVER_PRICES[options.coverType] +
    SIZE_PRICES[options.size] +
    PAGE_PRICES[options.pageType]
  );
}

/* ── component ── */

interface Props {
  options: BookOptions;
  onChange: (options: BookOptions) => void;
}

export const BookOptionsStep = ({ options, onChange }: Props) => {
  const set = (partial: Partial<BookOptions>) =>
    onChange({ ...options, ...partial });

  const price = calculateBookPrice(options);

  const coverOptions: { key: BookOptions["coverType"]; label: string; desc: string; extra: number }[] = [
    { key: "softcover", label: "Softcover", desc: "Lightweight & flexible — perfect for everyday reading", extra: COVER_PRICES.softcover },
    { key: "hardcover", label: "Hardcover", desc: "Premium feel, durable & gift-worthy", extra: COVER_PRICES.hardcover },
  ];

  const sizeOptions: { key: BookOptions["size"]; label: string; dims: string; extra: number }[] = [
    { key: "small", label: "Small", dims: '6″ × 8″', extra: SIZE_PRICES.small },
    { key: "medium", label: "Medium", dims: '8.5″ × 11″', extra: SIZE_PRICES.medium },
    { key: "large", label: "Large", dims: '11″ × 14″', extra: SIZE_PRICES.large },
  ];

  const pageOptions: { key: BookOptions["pageType"]; label: string; desc: string; extra: number }[] = [
    { key: "standard", label: "Standard Pages", desc: "Classic paper pages — light & easy to flip", extra: PAGE_PRICES.standard },
    { key: "board", label: "Board Pages", desc: "Thick & sturdy — great for toddlers", extra: PAGE_PRICES.board },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-accent" /> Customize Your Book
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Choose the cover, size, and page type that's right for your family.
        </p>
      </div>

      {/* Cover type */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cover Type</p>
        <div className="grid grid-cols-2 gap-3">
          {coverOptions.map((c) => (
            <button
              key={c.key}
              onClick={() => set({ coverType: c.key })}
              className={`rounded-2xl border-2 p-4 text-left transition-all duration-300 active:scale-[0.97] ${
                options.coverType === c.key
                  ? "border-accent bg-accent/5 shadow-sm"
                  : "border-border hover:border-accent/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-display font-semibold text-sm text-primary">{c.label}</span>
                {options.coverType === c.key && <Check className="w-4 h-4 text-accent" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">{c.desc}</p>
              <p className="text-xs font-semibold text-accent mt-2">
                {c.extra === 0 ? "Included" : `+$${c.extra.toFixed(2)}`}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Ruler className="w-3.5 h-3.5" /> Book Size
        </p>
        <div className="grid grid-cols-3 gap-3">
          {sizeOptions.map((s) => (
            <button
              key={s.key}
              onClick={() => set({ size: s.key })}
              className={`rounded-2xl border-2 p-4 text-center transition-all duration-300 active:scale-[0.97] ${
                options.size === s.key
                  ? "border-accent bg-accent/5 shadow-sm"
                  : "border-border hover:border-accent/30"
              }`}
            >
              <span className="font-display font-semibold text-sm text-primary block">{s.label}</span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">{s.dims}</span>
              <p className="text-xs font-semibold text-accent mt-2">
                {s.extra === 0 ? "Included" : `+$${s.extra.toFixed(2)}`}
              </p>
              {options.size === s.key && <Check className="w-4 h-4 text-accent mx-auto mt-1" />}
            </button>
          ))}
        </div>
      </div>

      {/* Page type */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Page Type
        </p>
        <div className="grid grid-cols-2 gap-3">
          {pageOptions.map((p) => (
            <button
              key={p.key}
              onClick={() => set({ pageType: p.key })}
              className={`rounded-2xl border-2 p-4 text-left transition-all duration-300 active:scale-[0.97] ${
                options.pageType === p.key
                  ? "border-accent bg-accent/5 shadow-sm"
                  : "border-border hover:border-accent/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-display font-semibold text-sm text-primary">{p.label}</span>
                {options.pageType === p.key && <Check className="w-4 h-4 text-accent" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">{p.desc}</p>
              <p className="text-xs font-semibold text-accent mt-2">
                {p.extra === 0 ? "Included" : `+$${p.extra.toFixed(2)}`}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Live price summary */}
      <div className="rounded-2xl bg-muted/30 border border-border p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Your Book Price</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {options.coverType === "hardcover" ? "Hardcover" : "Softcover"} · {options.size.charAt(0).toUpperCase() + options.size.slice(1)} · {options.pageType === "board" ? "Board pages" : "Standard pages"}
            </p>
          </div>
          <span className="text-2xl font-bold text-accent">${price.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
