import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import heroBoy from "@/assets/hero-boy.png";
import heroGirl from "@/assets/hero-girl.png";

const ease = [0.16, 1, 0.3, 1];

export const WalkingCharacters = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <div ref={ref} className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none h-28 overflow-hidden">
      <motion.img
        src={heroBoy}
        alt="Walking boy"
        className="absolute bottom-2 w-20 drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]"
        animate={isInView ? {
          x: ["-80px", "calc(100vw + 80px)"],
          rotate: [3, -2, 3, -2, 3, -2, 3, -2, 0],
          y: [0, -6, 0, -6, 0, -6, 0, -6, 0, -6, 0],
        } : { x: "-80px" }}
        transition={{
          x: { duration: 8, ease: "linear", repeat: Infinity, repeatDelay: 4 },
          rotate: { duration: 8, ease: "easeInOut", repeat: Infinity, repeatDelay: 4 },
          y: { duration: 0.5, ease: "easeInOut", repeat: Infinity },
        }}
      />
      <motion.img
        src={heroGirl}
        alt="Walking girl"
        className="absolute bottom-2 w-[4.5rem] drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]"
        animate={isInView ? {
          x: ["-120px", "calc(100vw + 80px)"],
          rotate: [-2, 2, -2, 2, -2, 2, -2, 2, 0],
          y: [0, -5, 0, -5, 0, -5, 0, -5, 0, -5, 0],
        } : { x: "-120px" }}
        transition={{
          x: { duration: 8, ease: "linear", repeat: Infinity, repeatDelay: 4, delay: 0.6 },
          rotate: { duration: 8, ease: "easeInOut", repeat: Infinity, repeatDelay: 4, delay: 0.6 },
          y: { duration: 0.45, ease: "easeInOut", repeat: Infinity, delay: 0.6 },
        }}
      />
    </div>
  );
};
