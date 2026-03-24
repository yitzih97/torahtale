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
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Previous page underneath */}
      <img
        src={PAGES[(currentPage - 1 + PAGES.length) % PAGES.length]}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentPage}
          className="absolute inset-0 w-full h-full flex"
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {/* Left half - folds outward from center spine */}
          <div className="w-1/2 h-full overflow-hidden" style={{ perspective: "1500px" }}>
            <motion.div
              className="w-full h-full"
              style={{ transformOrigin: "right center", transformStyle: "preserve-3d" }}
              variants={{
                initial: { rotateY: 90 },
                animate: { rotateY: 0, transition: { duration: 2, ease: [0.4, 0, 0.2, 1], delay: 0.15 } },
                exit: { rotateY: 90, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } },
              }}
            >
              <div className="w-[200%] h-full" style={{ backfaceVisibility: "hidden" }}>
                <img
                  src={PAGES[currentPage]}
                  alt="Torah story"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>

          {/* Right half - folds outward from center spine */}
          <div className="w-1/2 h-full overflow-hidden" style={{ perspective: "1500px" }}>
            <motion.div
              className="w-full h-full"
              style={{ transformOrigin: "left center", transformStyle: "preserve-3d" }}
              variants={{
                initial: { rotateY: -90 },
                animate: { rotateY: 0, transition: { duration: 2, ease: [0.4, 0, 0.2, 1] } },
                exit: { rotateY: -90, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } },
              }}
            >
              <div className="w-[200%] h-full -ml-[100%]" style={{ backfaceVisibility: "hidden" }}>
                <img
                  src={PAGES[currentPage]}
                  alt="Torah story"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>

          {/* Center spine line */}
          <motion.div
            className="absolute left-1/2 top-0 bottom-0 w-px bg-foreground/10 -translate-x-px z-10"
            variants={{
              initial: { opacity: 0 },
              animate: { opacity: 1, transition: { delay: 1.5, duration: 0.5 } },
              exit: { opacity: 0, transition: { duration: 0.2 } },
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
