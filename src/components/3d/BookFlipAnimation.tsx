import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteAssets } from "@/hooks/useSiteAssets";
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

const STATIC_PAGES = [
  heroScene1, heroScene2, heroScene3, heroScene4, heroScene5,
  heroScene6, heroScene7, heroScene8, heroScene9, heroScene10,
];

const ASSET_KEYS = [
  "hero-scene-1", "hero-scene-2", "hero-scene-3", "hero-scene-4", "hero-scene-5",
  "hero-scene-6", "hero-scene-7", "hero-scene-8", "hero-scene-9", "hero-scene-10",
];

// Each image gets a unique Ken Burns animation direction
const KEN_BURNS_VARIANTS = [
  { scale: [1, 1.12], x: ["0%", "-3%"], y: ["0%", "-2%"] },
  { scale: [1.08, 1], x: ["-2%", "1%"], y: ["-1%", "2%"] },
  { scale: [1, 1.1], x: ["1%", "-2%"], y: ["2%", "0%"] },
  { scale: [1.1, 1.02], x: ["-1%", "2%"], y: ["0%", "-2%"] },
  { scale: [1, 1.14], x: ["0%", "-4%"], y: ["-1%", "1%"] },
  { scale: [1.12, 1], x: ["-3%", "0%"], y: ["2%", "-1%"] },
  { scale: [1, 1.08], x: ["2%", "-1%"], y: ["0%", "2%"] },
  { scale: [1.06, 1.14], x: ["-2%", "1%"], y: ["-2%", "0%"] },
  { scale: [1, 1.1], x: ["1%", "-3%"], y: ["1%", "-1%"] },
  { scale: [1.1, 1], x: ["-1%", "2%"], y: ["-1%", "2%"] },
];

const PAGE_INTERVAL = 5000;

interface BookFlipAnimationProps {
  onPageChange?: (page: number) => void;
}

export const BookFlipAnimation = ({ onPageChange }: BookFlipAnimationProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const { getAssetUrl } = useSiteAssets();

  // Build pages with overrides
  const PAGES = STATIC_PAGES.map((staticUrl, i) => getAssetUrl(ASSET_KEYS[i], staticUrl));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPage((prev) => {
        const next = (prev + 1) % PAGES.length;
        onPageChange?.(next);
        return next;
      });
    }, PAGE_INTERVAL);
    return () => clearInterval(timer);
  }, [onPageChange, PAGES.length]);

  const kb = KEN_BURNS_VARIANTS[currentPage];

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.img
            src={PAGES[currentPage]}
            alt="Torah story"
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: kb.scale[0], x: kb.x[0], y: kb.y[0] }}
            animate={{ scale: kb.scale[1], x: kb.x[1], y: kb.y[1] }}
            transition={{ duration: PAGE_INTERVAL / 1000, ease: "linear" }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
