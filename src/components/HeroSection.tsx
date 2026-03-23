import { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroScene = lazy(() =>
  import("@/components/3d/HeroScene").then((m) => ({ default: m.HeroScene }))
);

const ease = [0.16, 1, 0.3, 1];

interface HeroSectionProps {
  onStart: () => void;
}

export const HeroSection = ({ onStart }: HeroSectionProps) => (
  <section className="relative min-h-screen flex items-center overflow-hidden bg-primary">
    {/* 3D Background */}
    <div className="absolute inset-0 z-0">
      <Suspense fallback={<div className="w-full h-full bg-primary" />}>
        <HeroScene />
      </Suspense>
    </div>

    {/* Gradient overlays for readability */}
    <div className="absolute inset-0 z-[1] bg-gradient-to-r from-primary/90 via-primary/60 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 z-[1] h-32 bg-gradient-to-t from-primary to-transparent" />

    <div className="container relative z-10 py-32 lg:py-0">
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

        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.1, ease }}
          className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold leading-[1.08] tracking-tight text-primary-foreground"
          style={{ lineHeight: "1.08" }}
        >
          Your Child's Name,
          <br />
          <span className="text-accent">Woven Into Torah.</span>
          <br />
          A Book They'll Treasure.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.3, ease }}
          className="text-lg text-primary-foreground/70 max-w-lg leading-relaxed mt-6"
        >
          A story thousands of years in the making — now starring your child.
          AI-written, beautifully illustrated, and printed as a hardcover keepsake.
        </motion.p>

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
