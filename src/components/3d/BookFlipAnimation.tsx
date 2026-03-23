import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import noahPage1 from "@/assets/noah-page1.jpg";
import noahPage2 from "@/assets/noah-page2.jpg";
import noahPage3 from "@/assets/noah-page3.jpg";
import noahPage4 from "@/assets/noah-page4.jpg";
import noahPage5 from "@/assets/noah-page5.jpg";

const PAGES = [noahPage1, noahPage2, noahPage3, noahPage4, noahPage5];

const PAGE_INTERVAL = 3500; // ms per page

interface BookFlipAnimationProps {
  onPageChange?: (page: number) => void;
}

export const BookFlipAnimation = ({ onPageChange }: BookFlipAnimationProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage((prev) => (prev + 1) % PAGES.length);
        setIsFlipping(false);
      }, 600);
    }, PAGE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center"
      style={{ perspective: "1800px" }}
    >
      {/* Golden sparkle particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3 + Math.random() * 5,
            height: 3 + Math.random() * 5,
            background: "radial-gradient(circle, hsl(var(--accent)), transparent)",
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Book container */}
      <div
        className="relative"
        style={{
          width: "min(70vw, 600px)",
          aspectRatio: "4/3",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Book shadow */}
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2"
          style={{
            width: "85%",
            height: 30,
            background: "radial-gradient(ellipse, rgba(0,0,0,0.5), transparent)",
            filter: "blur(10px)",
          }}
        />

        {/* Book spine glow */}
        <div
          className="absolute left-0 top-0 bottom-0 w-3 z-10"
          style={{
            background: "linear-gradient(to right, hsl(var(--accent)), hsl(var(--accent) / 0.3))",
            borderRadius: "4px 0 0 4px",
            boxShadow: "0 0 20px hsl(var(--accent) / 0.4)",
          }}
        />

        {/* Current page */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentPage}
            className="absolute inset-0 rounded-lg overflow-hidden"
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            style={{
              transformOrigin: "left center",
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }}
          >
            <img
              src={PAGES[currentPage]}
              alt={`Story page ${currentPage + 1}`}
              className="w-full h-full object-cover rounded-lg"
              style={{
                border: "3px solid hsl(var(--accent) / 0.3)",
                boxShadow: "8px 8px 30px rgba(0,0,0,0.4), inset 0 0 20px hsl(var(--accent) / 0.1)",
              }}
            />
            {/* Page curl effect */}
            <div
              className="absolute top-0 right-0 bottom-0 w-16 pointer-events-none"
              style={{
                background: "linear-gradient(to left, rgba(0,0,0,0.15), transparent)",
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Page indicators */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
          {PAGES.map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                background:
                  i === currentPage
                    ? "hsl(var(--accent))"
                    : "hsl(var(--accent) / 0.25)",
                boxShadow:
                  i === currentPage
                    ? "0 0 8px hsl(var(--accent) / 0.6)"
                    : "none",
                transform: i === currentPage ? "scale(1.3)" : "scale(1)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
