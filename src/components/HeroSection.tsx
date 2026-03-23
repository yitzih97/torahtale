import { Suspense, lazy, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBoy from "@/assets/hero-boy.png";
import heroGirl from "@/assets/hero-girl.png";

const BookFlipAnimation = lazy(() =>
  import("@/components/3d/BookFlipAnimation").then((m) => ({ default: m.BookFlipAnimation }))
);

const ease = [0.16, 1, 0.3, 1];

const HERO_SLIDES = [
  { headline: ["Bereishis —", "Hashem Created the World."], description: "Your child walks through Gan Eden, discovering Hashem's beautiful creations alongside Adam and Chava." },
  { headline: ["Noach Built the Teivah,", "Your Child Sailed Along."], description: "Gathering animals two by two and riding the mabul to a keshet shining with Hashem's promise." },
  { headline: ["A Tower Rose High,", "But Lashon Was Confused."], description: "The Dor Haflagah tried to reach shamayim — your child learns why achdus and anava matter." },
  { headline: ["Avraham Looked Up,", "And Counted the Stars."], description: "A havtacha as vast as the night sky — your child inherits the bris of emunah." },
  { headline: ["Yosef's Coat Shone,", "With Colors of Dreams."], description: "From a bor to a palace, your child journeys with Yosef HaTzaddik through mechilah and triumph." },
  { headline: ["A Baby in a Basket,", "Floated Down the Nile."], description: "Moshe Rabbeinu's journey begins — your child witnesses the moment that changed all of history." },
  { headline: ["The Yam Split Open,", "And Geulah Walked Through."], description: "Walls of water tower high as your child crosses to cheirus with Bnei Yisrael." },
  { headline: ["Thunder on Har Sinai,", "The Luchos Were Given."], description: "Your child stands at Matan Torah as the Aseres HaDibros light up the sky." },
  { headline: ["A Sling, a Stone,", "Golyas Falls."], description: "Dovid's bitachon proves that even the smallest person can change the world — just like your child." },
  { headline: ["Swallowed by a Dag,", "But Never Lost Hope."], description: "Inside the great fish, Yonah HaNavi finds his purpose — and your child finds theirs." },
];

// Walking animation - characters walk in from right and exit to left like walking between story pages
const boyVariants = {
  initial: { opacity: 0, x: 200, rotate: 3 },
  animate: {
    opacity: 1,
    x: 0,
    rotate: [3, -2, 3, -2, 0],
    y: [0, -10, 0, -10, 0, -10, 0],
    transition: {
      x: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
      opacity: { duration: 0.4 },
      rotate: { duration: 1.2, ease: "easeInOut" },
      y: { duration: 1.4, ease: "easeInOut" },
    },
  },
  exit: {
    opacity: 0,
    x: -180,
    rotate: -3,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const girlVariants = {
  initial: { opacity: 0, x: 220, rotate: -2 },
  animate: {
    opacity: 1,
    x: 10,
    rotate: [-2, 2, -2, 2, 0],
    y: [0, -8, 0, -8, 0, -8, 0],
    transition: {
      x: { duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.15 },
      opacity: { duration: 0.4, delay: 0.15 },
      rotate: { duration: 1.3, ease: "easeInOut", delay: 0.15 },
      y: { duration: 1.5, ease: "easeInOut", delay: 0.15 },
    },
  },
  exit: {
    opacity: 0,
    x: -150,
    rotate: 2,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

interface HeroSectionProps {
  onStart: () => void;
}

export const HeroSection = ({ onStart }: HeroSectionProps) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const handlePageChange = useCallback((page: number) => {
    setActiveSlide(page);
  }, []);

  const slide = HERO_SLIDES[activeSlide];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background slideshow */}
      <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
        <BookFlipAnimation onPageChange={handlePageChange} />
      </Suspense>

      {/* Overlay - lighter on mobile so images show through, stronger on left for desktop text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent md:from-background/95 md:via-background/70 md:to-primary/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40 md:from-background/90 md:to-background/60" />

      <div className="relative z-10 w-full py-24 lg:py-0 pl-4 sm:pl-6 lg:pl-12 pr-4">
        <div className="flex items-center justify-start">
          <div className="max-w-xl text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="mb-5"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 text-accent text-xs font-semibold tracking-wider uppercase border border-accent/20">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Torah Storytelling
              </span>
            </motion.div>

            {/* Dynamic headline */}
            <div className="min-h-[140px] sm:min-h-[160px] lg:min-h-[180px]">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={`headline-${activeSlide}`}
                  initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -15, filter: "blur(6px)" }}
                  transition={{ duration: 0.5, ease }}
                  className="text-4xl sm:text-5xl lg:text-[3.2rem] font-bold leading-[1.1] tracking-tight text-foreground"
                >
                  {slide.headline[0]}
                  <br />
                  <span className="text-accent">{slide.headline[1]}</span>
                </motion.h1>
              </AnimatePresence>
            </div>

            {/* Dynamic description */}
            <div className="min-h-[70px] mt-4">
              <AnimatePresence mode="wait">
                <motion.p
                  key={`desc-${activeSlide}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, delay: 0.1, ease }}
                  className="text-base lg:text-lg text-foreground/65 font-body max-w-md leading-relaxed"
                >
                  {slide.description}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Page indicators */}
            <div className="flex gap-1.5 mt-6">
              {HERO_SLIDES.map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: i === activeSlide ? 28 : 6,
                    background: i === activeSlide ? "hsl(var(--accent))" : "hsl(var(--foreground) / 0.2)",
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Button variant="gold" size="xl" onClick={onStart} className="group gold-glow rounded-full">
                Create Your Sefer
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <span className="text-foreground/40 text-sm font-body">
                From $34.99 · Ships in 5 days
              </span>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-10 flex items-center gap-3"
            >
              <div className="flex -space-x-2">
                {["S", "D", "M", "R"].map((initial, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-background bg-primary/30 flex items-center justify-center text-[10px] font-semibold text-accent backdrop-blur-sm"
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-accent text-accent" />)}
              </div>
              <span className="text-sm text-foreground/60">
                <strong className="text-foreground/80">2,847+</strong> frum families
              </span>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};
