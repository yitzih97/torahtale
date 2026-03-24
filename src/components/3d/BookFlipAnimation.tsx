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
    <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ perspective: "2000px" }}>
      {/* Previous page visible underneath during flip */}
      <img
        src={PAGES[(currentPage - 1 + PAGES.length) % PAGES.length]}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentPage}
          className="absolute inset-0 w-full h-full"
          style={{ transformOrigin: "left center", transformStyle: "preserve-3d" }}
          initial={{ rotateY: -180 }}
          animate={{ rotateY: 0 }}
          exit={{ opacity: 0 }}
          transition={{
            rotateY: { duration: 2.2, ease: [0.4, 0.0, 0.2, 1] },
            opacity: { duration: 0.3, delay: 0.1 },
          }}
        >
          {/* Front face - the new page */}
          <img
            src={PAGES[currentPage]}
            alt="Torah story"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ backfaceVisibility: "hidden" }}
          />
          {/* Back face - slight shadow to simulate page thickness */}
          <div
            className="absolute inset-0 w-full h-full bg-foreground/10"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
