import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Shield, Baby, Palette, ArrowRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

import mockupSoftcover from "@/assets/books/mockup-softcover.jpg";
import mockupHardcover from "@/assets/books/mockup-hardcover.jpg";
import mockupBoard from "@/assets/books/mockup-board.jpg";
import mockupColoring from "@/assets/books/mockup-coloring.jpg";

const ease = [0.16, 1, 0.3, 1] as const;
const AUTO_MS = 5000;

interface Props {
  onStart: () => void;
}

interface ProductDef {
  key: string;
  icon: LucideIcon;
  name: string;
  tagline: string;
  desc: string;
  image: string;
  size: string;
  priceUsd: number;
  priceIls: number;
  /** When set, shows as an "add-on" price prefix instead of a flat price. */
  addOn?: boolean;
}

export const ProductsSection = ({ onStart }: Props) => {
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { symbol, rate, code } = t.currency;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const fmt = (usd: number, ils: number) =>
    code === "ILS" ? `${symbol}${ils.toFixed(0)}` : `${symbol}${Math.round(usd * rate)}`;

  const products: ProductDef[] = [
    { key: "softcover", icon: BookOpen, name: t.bookOptions.softcover, tagline: t.bookOptions.softcoverTagline, desc: t.productsShowcase.desc.softcover, image: mockupSoftcover, size: "8″×8″", priceUsd: 9, priceIls: 25 },
    { key: "hardcover", icon: Shield, name: t.bookOptions.hardcover, tagline: t.bookOptions.hardcoverTagline, desc: t.productsShowcase.desc.hardcover, image: mockupHardcover, size: "8″×8″", priceUsd: 17, priceIls: 50 },
    { key: "board", icon: Baby, name: t.bookOptions.boardBook, tagline: t.bookOptions.boardTagline, desc: t.productsShowcase.desc.board, image: mockupBoard, size: "6″×6″", priceUsd: 24, priceIls: 70 },
    { key: "coloring", icon: Palette, name: t.productsShowcase.coloring, tagline: t.productsShowcase.coloringTagline, desc: t.productsShowcase.desc.coloring, image: mockupColoring, size: "8.5″×11″", priceUsd: 3, priceIls: 12, addOn: true },
  ];

  // Auto-rotate through the products (pauses on hover/focus).
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((i) => (i + 1) % products.length), AUTO_MS);
    return () => clearInterval(id);
  }, [paused, products.length]);

  const p = products[active];

  return (
    <section
      id="products"
      dir={dir}
      className="relative bg-gradient-to-b from-[hsl(42_55%_96%)] to-[hsl(38_48%_93%)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container py-16 lg:py-24">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease }}
          className="text-center max-w-2xl mx-auto"
        >
          <span className="inline-block rounded-full bg-gold/15 text-gold text-xs font-semibold tracking-[0.18em] uppercase px-3 py-1">
            {t.productsShowcase.badge}
          </span>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            {t.productsShowcase.heading}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-foreground/65 leading-relaxed">
            {t.productsShowcase.subtitle}
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex flex-wrap justify-center gap-1 rounded-2xl border border-foreground/8 bg-background/70 backdrop-blur p-1.5">
            {products.map((prod, i) => {
              const activeTab = i === active;
              return (
                <button
                  key={prod.key}
                  onClick={() => setActive(i)}
                  className={`relative flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-sm font-medium transition-colors duration-300 ${
                    activeTab ? "text-foreground" : "text-foreground/55 hover:text-foreground/80"
                  }`}
                >
                  {activeTab && (
                    <motion.span
                      layoutId="productTabPill"
                      className="absolute inset-0 rounded-xl bg-background shadow-[0_4px_16px_-6px_hsl(43_64%_42%/0.35)] ring-1 ring-gold/15"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <prod.icon className={`relative z-10 w-4 h-4 ${activeTab ? "text-gold" : ""}`} strokeWidth={1.75} />
                  <span className="relative z-10 whitespace-nowrap">{prod.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active product card */}
        <div className="mt-8 rounded-3xl border border-foreground/8 bg-background/60 backdrop-blur-sm shadow-[0_24px_60px_-30px_rgba(0,0,0,0.3)] overflow-hidden">
          <div className="grid lg:grid-cols-2 items-stretch">
            {/* Image */}
            <div className="relative min-h-[300px] sm:min-h-[400px] bg-gradient-to-br from-[hsl(42_60%_92%)] to-[hsl(36_45%_86%)] flex items-center justify-center p-8 sm:p-12">
              <AnimatePresence mode="wait">
                <motion.img
                  key={p.key}
                  src={p.image}
                  alt={p.name}
                  initial={{ opacity: 0, scale: 0.92, rotate: isRtl ? 3 : -3 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.5, ease }}
                  className="max-h-[260px] sm:max-h-[360px] w-auto rounded-2xl shadow-[0_30px_60px_-25px_rgba(0,0,0,0.5)] object-contain"
                />
              </AnimatePresence>
            </div>

            {/* Copy */}
            <div className={`relative p-8 sm:p-12 flex flex-col justify-center ${isRtl ? "text-right" : "text-left"}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={p.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/12 text-gold text-[11px] font-semibold tracking-[0.16em] uppercase px-2.5 py-1">
                      <p.icon className="w-3.5 h-3.5" strokeWidth={2} />
                      {p.tagline}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{p.name}</h3>
                  <p className="mt-3 text-sm sm:text-base text-foreground/70 leading-relaxed max-w-md">{p.desc}</p>

                  <div className={`mt-6 flex items-center gap-4 ${isRtl ? "flex-row-reverse justify-end" : ""}`}>
                    <div className="flex items-baseline gap-1">
                      {p.addOn && <span className="text-sm text-foreground/55">+</span>}
                      <span className="font-display text-3xl font-bold text-foreground">{fmt(p.priceUsd, p.priceIls)}</span>
                    </div>
                    <span className="h-5 w-px bg-foreground/15" />
                    <span className="text-sm font-medium text-foreground/55">{p.size}</span>
                  </div>

                  <Button
                    variant="gold"
                    size="lg"
                    onClick={onStart}
                    className="group mt-7 rounded-xl gold-glow w-full sm:w-auto px-7"
                  >
                    {t.productsShowcase.cta}
                    <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isRtl ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
                  </Button>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
