import { Suspense, lazy, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import kid1 from "@/assets/avatars/kid1.jpg";
import kid2 from "@/assets/avatars/kid2.jpg";
import kid3 from "@/assets/avatars/kid3.jpg";
import kid4 from "@/assets/avatars/kid4.jpg";

// Lazy import with one-shot retry + auto page reload on persistent failure.
// Vite's dev server can invalidate a previously-fetched dynamic-import URL
// after re-bundling deps, which throws "Failed to fetch dynamically imported
// module" and leaves a blank screen. Retrying once recovers in most cases;
// a hard reload recovers in the rest.
const BookFlipAnimation = lazy(async () => {
  const load = () => import("@/components/3d/BookFlipAnimation");
  try {
    const m = await load();
    return { default: m.BookFlipAnimation };
  } catch (err) {
    try {
      const m = await load();
      return { default: m.BookFlipAnimation };
    } catch {
      if (typeof window !== "undefined") {
        const reloadedKey = "__hero_chunk_reloaded__";
        if (!sessionStorage.getItem(reloadedKey)) {
          sessionStorage.setItem(reloadedKey, "1");
          window.location.reload();
        }
      }
      throw err;
    }
  }
});

const ease = [0.16, 1, 0.3, 1];

const AVATARS = [kid1, kid2, kid3, kid4];

/* ── Animated counter component ── */

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    if (start === end) return;
    
    const duration = 800;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    prevValue.current = end;
  }, [value]);

  return <>{displayValue.toLocaleString()}+</>;
}

function SocialProofCounter({ dir, socialProof }: { dir: "ltr" | "rtl"; socialProof: string }) {
  const [count, setCount] = useState(50);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => c + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className={`mt-6 sm:mt-10 flex items-center gap-2 sm:gap-3 justify-center ${
        dir === "rtl" ? "sm:justify-start" : "sm:justify-start"
      }`}
    >
      <div className={`flex ${dir === "rtl" ? "-space-x-reverse -space-x-2" : "-space-x-2"}`}>
        {AVATARS.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 border-white/30 object-cover"
            loading="lazy"
            width={36}
            height={36}
          />
        ))}
      </div>
      <div className="flex items-center gap-0.5 sm:gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-accent text-accent" />
        ))}
      </div>
      <span className="text-xs sm:text-sm text-white/60">
        <strong className="text-white/80 tabular-nums">
          <AnimatedNumber value={count} />
        </strong>{" "}
        {socialProof}
      </span>
    </motion.div>
  );
}

/* ── Hero Section ── */

interface HeroSectionProps {
  onStart: () => void;
}

export const HeroSection = ({ onStart }: HeroSectionProps) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const { getSetting } = useSiteSettings("website");
  const { t, dir } = useLanguage();

  const handlePageChange = useCallback((page: number) => {
    setActiveSlide(page);
  }, []);

  const slides = t.hero.slides.map((def, i) => ({
    headline: [
      getSetting("website", `hero-slide-${i}-headline-1`, def.headline[0]),
      getSetting("website", `hero-slide-${i}-headline-2`, def.headline[1]),
    ],
    description: getSetting("website", `hero-slide-${i}-description`, def.description),
  }));

  const slide = slides[activeSlide];
  const badgeText = getSetting("website", "hero-badge", t.hero.badge);
  const ctaText = getSetting("website", "hero-cta", t.hero.cta);
  const priceText = getSetting("website", "hero-price-text", t.hero.priceText);
  const socialProof = getSetting("website", "hero-social-proof", t.hero.socialProof);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className={dir === "rtl" ? "absolute inset-0 w-full h-full [transform:scaleX(-1)]" : "absolute inset-0 w-full h-full"}>
        <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
          <BookFlipAnimation onPageChange={handlePageChange} />
        </Suspense>
      </div>

      <div className={`absolute inset-0 bg-gradient-to-b ${dir === "rtl" ? "sm:bg-gradient-to-l" : "sm:bg-gradient-to-r"} from-[hsl(220,30%,8%)]/95 via-[hsl(220,30%,8%)]/70 to-[hsl(220,30%,8%)]/40 sm:from-[hsl(220,30%,8%)]/85 sm:via-[hsl(220,30%,8%)]/30 sm:to-transparent`} />
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(220,30%,8%)]/60 sm:from-[hsl(220,30%,8%)]/40 via-transparent to-transparent" />

      <div className={`relative z-10 w-full py-24 lg:py-0 px-4 ${dir === "rtl" ? "sm:pr-6 lg:pr-12 sm:pl-4" : "sm:pl-6 lg:pl-12 sm:pr-4"}`}>
        <div className={`flex items-center justify-center ${dir === "rtl" ? "sm:justify-start" : "sm:justify-start"}`}>
          <div className={`max-w-xl text-center ${dir === "rtl" ? "sm:text-right" : "sm:text-left"}`}>
            {badgeText && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mb-5">
              <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-accent/15 text-accent text-[10px] sm:text-xs font-semibold tracking-wider uppercase border border-accent/20">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {badgeText}
              </span>
            </motion.div>
            )}

            <div className="min-h-[100px] sm:min-h-[140px] lg:min-h-[180px]">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={`headline-${activeSlide}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                  className="text-2xl sm:text-4xl lg:text-[3.2rem] font-display font-bold leading-[1.1] tracking-tight text-white drop-shadow-lg"
                >
                  {slide.headline[0]}<br />
                  <span className="text-gold-light">{slide.headline[1]}</span>
                </motion.h1>
              </AnimatePresence>
            </div>

            <div className="min-h-[50px] sm:min-h-[70px] mt-3 sm:mt-4">
              <AnimatePresence mode="wait">
                <motion.p
                  key={`desc-${activeSlide}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
                  className={`text-sm sm:text-base lg:text-lg text-white/65 font-body max-w-md leading-relaxed ${dir === "rtl" ? "sm:mr-0 sm:ml-auto mx-auto" : "sm:mx-0 mx-auto"}`}
                >
                  {slide.description}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className={`flex gap-1.5 mt-4 sm:mt-6 justify-center ${dir === "rtl" ? "sm:justify-end" : "sm:justify-start"}`}>
              {slides.map((_, i) => (
                <div key={i} className="h-1 rounded-full transition-all duration-500"
                  style={{ width: i === activeSlide ? 28 : 6, background: i === activeSlide ? "hsl(var(--accent))" : "hsl(var(--foreground) / 0.2)" }} />
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4, ease }} className={`mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap items-center gap-3 sm:gap-4`}>
              <Button variant="gold" size="xl" onClick={onStart} className="group gold-glow rounded-full w-full sm:w-auto">
                {ctaText}
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${dir === "rtl" ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
              </Button>
              {priceText && <span className="text-white/40 text-xs sm:text-sm font-body">{priceText}</span>}
            </motion.div>

            {socialProof && <SocialProofCounter dir={dir} socialProof={socialProof} />}
          </div>
        </div>
      </div>
    </section>
  );
};
