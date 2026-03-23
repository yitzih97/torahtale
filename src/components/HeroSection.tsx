import { Suspense, lazy, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      {/* Full-background book animation */}
      <Suspense fallback={<div className="absolute inset-0 bg-primary" />}>
        <BookFlipAnimation onPageChange={handlePageChange} />
      </Suspense>

      <div className="container relative z-10 py-24 lg:py-0">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -40, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/15 border border-accent/25 text-accent text-xs font-mono tracking-widest uppercase backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              AI-Powered Torah Storytelling
            </span>
          </motion.div>

          {/* Dynamic headline */}
          <div className="min-h-[160px] sm:min-h-[180px] lg:min-h-[200px]">
            <AnimatePresence mode="wait">
              <motion.h1
                key={`headline-${activeSlide}`}
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                transition={{ duration: 0.5, ease }}
                className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold leading-[1.08] tracking-tight text-primary-foreground drop-shadow-lg"
              >
                {slide.headline[0]}
                <br />
                <span className="text-accent">{slide.headline[1]}</span>
              </motion.h1>
            </AnimatePresence>
          </div>

          {/* Dynamic description */}
          <div className="min-h-[80px] mt-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={`desc-${activeSlide}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, delay: 0.1, ease }}
                className="text-lg text-primary-foreground/80 max-w-lg leading-relaxed drop-shadow-md"
              >
                {slide.description}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Page indicators */}
          <div className="flex gap-1.5 mt-8">
            {HERO_SLIDES.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: i === activeSlide ? 32 : 8,
                  background: i === activeSlide ? "hsl(var(--accent))" : "hsl(var(--primary-foreground) / 0.3)",
                  boxShadow: i === activeSlide ? "0 0 8px hsl(var(--accent) / 0.6)" : "none",
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Button variant="gold" size="xl" onClick={onStart} className="group gold-glow">
              <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
              Create Your Sefer
            </Button>
            <span className="text-primary-foreground/50 text-sm font-mono backdrop-blur-sm">
              From $34.99 · Ships in 5 days
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-16 flex items-center gap-4"
          >
            <div className="flex -space-x-3">
              {["S", "D", "M", "R"].map((initial, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full border-2 border-primary bg-accent/20 flex items-center justify-center text-xs font-semibold text-accent backdrop-blur-sm"
                >
                  {initial}
                </div>
              ))}
            </div>
            <div className="text-sm">
              <span className="text-primary-foreground/90 font-medium">2,847+ frum families</span>
              <span className="text-primary-foreground/60"> have created their tale</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="w-5 h-5 text-primary-foreground/30" />
        </motion.div>
      </motion.div>
    </section>
  );
};
