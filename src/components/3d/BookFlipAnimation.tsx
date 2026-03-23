import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gardenEden from "@/assets/torah-garden-eden.jpg";
import noahPage1 from "@/assets/noah-page1.jpg";
import towerBabel from "@/assets/torah-tower-babel.jpg";
import abrahamStars from "@/assets/torah-abraham-stars.jpg";
import josephCoat from "@/assets/torah-joseph-coat.jpg";
import mosesBasket from "@/assets/torah-moses-basket.jpg";
import redSea from "@/assets/torah-red-sea.jpg";
import tenCommandments from "@/assets/torah-ten-commandments.jpg";
import davidGoliath from "@/assets/torah-david-goliath.jpg";
import jonahWhale from "@/assets/torah-jonah-whale.jpg";

export const PAGES = [
  gardenEden,
  noahPage1,
  towerBabel,
  abrahamStars,
  josephCoat,
  mosesBasket,
  redSea,
  tenCommandments,
  davidGoliath,
  jonahWhale,
];

const PAGE_INTERVAL = 4000;

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
      <AnimatePresence mode="popLayout">
        <motion.img
          key={currentPage}
          src={PAGES[currentPage]}
          alt="Torah story"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        />
      </AnimatePresence>
    </div>
  );
};
