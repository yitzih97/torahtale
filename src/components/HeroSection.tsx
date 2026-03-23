import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SparkleEffect } from "./SparkleEffect";
import heroBook from "@/assets/hero-book.png";

const ease = [0.22, 1, 0.36, 1];

interface HeroSectionProps {
  onStart: () => void;
}

export const HeroSection = ({ onStart }: HeroSectionProps) => (
  <section className="relative min-h-screen flex items-center overflow-hidden">
    <SparkleEffect count={20} />
    <div className="container relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center py-32">
      <motion.div
        initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease }}
        className="space-y-8"
      >
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-primary">
          Your Child.{" "}
          <span className="text-gold">This Week's Torah Story.</span>{" "}
          A Book They'll Treasure.
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
          A story thousands of years in the making — now starring your child.
          Custom-written, beautifully illustrated, and printed as a keepsake.
        </p>
        <Button variant="gold" size="xl" onClick={onStart} className="group">
          <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
          Begin the Tale
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, delay: 0.2, ease }}
        className="relative flex justify-center"
      >
        <div className="relative">
          <SparkleEffect count={8} />
          <img
            src={heroBook}
            alt="A personalized Torah storybook for children"
            className="w-full max-w-md rounded-book shadow-soft-lg"
          />
        </div>
      </motion.div>
    </div>
  </section>
);
