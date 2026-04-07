import { Suspense, lazy, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import heroBoy from "@/assets/hero-boy.png";
import heroGirl from "@/assets/hero-girl.png";

const BookFlipAnimation = lazy(() =>
  import("@/components/3d/BookFlipAnimation").then((m) => ({ default: m.BookFlipAnimation }))
);

const ease = [0.16, 1, 0.3, 1];

const boyVariants = {
  initial: { opacity: 0, x: 200, rotate: 3 },
  animate: {
    opacity: 1, x: 0, rotate: [3, -2, 3, -2, 0], y: [0, -10, 0, -10, 0, -10, 0],
    transition: { x: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.4 }, rotate: { duration: 1.2, ease: "easeInOut" }, y: { duration: 1.4, ease: "easeInOut" } },
  },
  exit: { opacity: 0, x: -180, rotate: -3, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const girlVariants = {
  initial: { opacity: 0, x: 220, rotate: -2 },
  animate: {
    opacity: 1, x: 10, rotate: [-2, 2, -2, 2, 0], y: [0, -8, 0, -8, 0, -8, 0],
    transition: { x: { duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.15 }, opacity: { duration: 0.4, delay: 0.15 }, rotate: { duration: 1.3, ease: "easeInOut", delay: 0.15 }, y: { duration: 1.5, ease: "easeInOut", delay: 0.15 } },
  },
  exit: { opacity: 0, x: -150, rotate: 2, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

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
      <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
        <BookFlipAnimation onPageChange={handlePageChange} />
      </Suspense>

      <div className="absolute inset-0 bg-gradient-to-b sm:bg-gradient-to-r from-[hsl(220,30%,8%)]/95 via-[hsl(220,30%,8%)]/70 to-[hsl(220,30%,8%)]/40 sm:from-[hsl(220,30%,8%)]/85 sm:via-[hsl(220,30%,8%)]/30 sm:to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(220,30%,8%)]/60 sm:from-[hsl(220,30%,8%)]/40 via-transparent to-transparent" />

      <div className={`relative z-10 w-full py-24 lg:py-0 px-4 ${dir === "rtl" ? "sm:pr-6 lg:pr-12 sm:pl-4" : "sm:pl-6 lg:pl-12 sm:pr-4"}`}>
        <div className={`flex items-center justify-center ${dir === "rtl" ? "sm:justify-end" : "sm:justify-start"}`}>
          <div className={`max-w-xl text-center ${dir === "rtl" ? "sm:text-right" : "sm:text-left"}`}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mb-5">
              <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-accent/15 text-accent text-[10px] sm:text-xs font-semibold tracking-wider uppercase border border-accent/20">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {badgeText}
              </span>
            </motion.div>

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
              <span className="text-white/40 text-xs sm:text-sm font-body">{priceText}</span>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }} className={`mt-6 sm:mt-10 flex items-center gap-2 sm:gap-3 justify-center ${dir === "rtl" ? "sm:justify-end" : "sm:justify-start"}`}>
              <div className={`flex ${dir === "rtl" ? "-space-x-reverse -space-x-2" : "-space-x-2"}`}>
                {["S", "D", "M", "R"].map((initial, i) => (
                  <div key={i} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center text-[8px] sm:text-[10px] font-semibold text-gold-light backdrop-blur-sm">
                    {initial}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-accent text-accent" />)}
              </div>
              <span className="text-xs sm:text-sm text-white/60" dangerouslySetInnerHTML={{ __html: socialProof.replace(/(\d[\d,]+\+?)/, '<strong class="text-white/80">$1</strong>') }} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
