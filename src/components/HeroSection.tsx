import { Suspense, lazy, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const BookFlipAnimation = lazy(() =>
  import("@/components/3d/BookFlipAnimation").then((m) => ({ default: m.BookFlipAnimation }))
);

const ease = [0.16, 1, 0.3, 1];

const HERO_SLIDES = [
  {
    headline: ["Noah Built the Ark,", "Your Child Sailed Along."],
    description: "Watch your child join Noah on the greatest adventure — gathering animals two by two and riding the storm to a rainbow of promise.",
  },
  {
    headline: ["The Animals Came,", "Two by Two."],
    description: "Lions, elephants, and doves — your child helps Noah welcome every creature aboard the mighty wooden ark.",
  },
  {
    headline: ["The Rain Fell,", "But Hope Stayed Strong."],
    description: "Forty days of rain couldn't shake their faith. Your child learns courage and trust through the greatest flood story ever told.",
  },
  {
    headline: ["A Dove Returned,", "With an Olive Branch."],
    description: "The waters recede, land appears, and your child witnesses the moment peace returns to the world.",
  },
  {
    headline: ["A Rainbow Appeared,", "A Promise Was Made."],
    description: "God's colorful covenant stretches across the sky — and your child stands beneath it, part of the everlasting story.",
  },
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
    <section className="relative min-h-screen flex items-center overflow-hidden bg-primary">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse at 70% 50%, hsl(var(--accent) / 0.08), transparent 60%)"
      }} />

      <div className="container relative z-10 py-24 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -40, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/15 border border-accent/25 text-accent text-xs font-mono tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                AI-Powered Storytelling
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
                  className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold leading-[1.08] tracking-tight text-primary-foreground"
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
                  className="text-lg text-primary-foreground/70 max-w-lg leading-relaxed"
                >
                  {slide.description}
                </motion.p>
              </AnimatePresence>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Button variant="gold" size="xl" onClick={onStart} className="group gold-glow">
                <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
                Create Your Book
              </Button>
              <span className="text-primary-foreground/40 text-sm font-mono">
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
                    className="w-9 h-9 rounded-full border-2 border-primary bg-accent/20 flex items-center justify-center text-xs font-semibold text-accent"
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <span className="text-primary-foreground/90 font-medium">2,847+ families</span>
                <span className="text-primary-foreground/50"> have created their tale</span>
              </div>
            </motion.div>
          </div>

          {/* Right: Book flip animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease }}
            className="relative h-[400px] sm:h-[500px] lg:h-[550px]"
          >
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-64 h-48 rounded-lg bg-accent/10 animate-pulse" />
              </div>
            }>
              <BookFlipAnimation onPageChange={handlePageChange} />
            </Suspense>
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
