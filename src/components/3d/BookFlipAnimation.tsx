import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import heroScene1 from "@/assets/hero-scene-1.jpg";
import heroScene2 from "@/assets/hero-scene-2.jpg";
import heroScene3 from "@/assets/hero-scene-3.jpg";
import heroScene4 from "@/assets/hero-scene-4.jpg";
import heroScene5 from "@/assets/hero-scene-5.jpg";
import heroScene6 from "@/assets/hero-scene-6.jpg";
import heroScene7 from "@/assets/hero-scene-7.jpg";
import heroScene8 from "@/assets/hero-scene-8.jpg";
import heroScene9 from "@/assets/hero-scene-9.jpg";
import heroScene10 from "@/assets/hero-scene-10.jpg";

export const PAGES = [
  heroScene1,
  heroScene2,
  heroScene3,
  heroScene4,
  heroScene5,
  heroScene6,
  heroScene7,
  heroScene8,
  heroScene9,
  heroScene10,
];

const PAGE_INTERVAL = 5000;

interface BookFlipAnimationProps {
  onPageChange?: (page: number) => void;
}

export const BookFlipAnimation = ({ onPageChange }: BookFlipAnimationProps) => {
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPage((prev) => {
        const next = (prev + 1) % PAGES.length;
        onPageChange?.(next);
        return next;
      });
    }, PAGE_INTERVAL);
    return () => clearInterval(timer);
  }, [onPageChange]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ perspective: "2500px" }}>
      {/* Next page revealed underneath */}
      <img
        src={PAGES[(currentPage + 1) % PAGES.length]}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentPage}
          className="absolute inset-0 w-full h-full"
          style={{ transformOrigin: "right center", transformStyle: "preserve-3d" }}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 0 }}
          exit={{ rotateY: -180 }}
          transition={{
            rotateY: { duration: 2.4, ease: [0.4, 0.0, 0.15, 1] },
          }}
        >
          {/* Front face */}
          <img
            src={PAGES[currentPage]}
            alt="Torah story"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ backfaceVisibility: "hidden" }}
          />
          {/* Front face - sweeping shadow as page lifts */}
          <motion.div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              backfaceVisibility: "hidden",
              background: "linear-gradient(to left, transparent 60%, hsl(var(--foreground) / 0.25) 100%)",
            }}
            initial={{ opacity: 0 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          />
          {/* Back face */}
          <div
            className="absolute inset-0 w-full h-full bg-foreground/15"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Shadow cast onto revealed page from the lifting page */}
      <AnimatePresence>
        <motion.div
          key={`shadow-${currentPage}`}
          className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
          style={{
            background: "linear-gradient(to right, hsl(var(--foreground) / 0.3) 0%, transparent 35%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 2.4, ease: [0.4, 0, 0.15, 1], times: [0, 0.4, 1] }}
        />
      </AnimatePresence>
    </div>
  );
};
