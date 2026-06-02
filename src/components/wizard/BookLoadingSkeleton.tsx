import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import generatingBook from "@/assets/wizard/generating-book.png";

const shimmer = {
  initial: { x: "-100%" },
  animate: { x: "100%" },
  transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
};

const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.85, 1, 0.85],
    transition: { repeat: Infinity, duration: 2, ease: "easeInOut" },
  },
};

interface Props {
  type?: "cover" | "story" | "back-cover";
  message?: string;
}

export const BookLoadingSkeleton = ({ type = "story", message }: Props) => {
  const label =
    type === "cover"
      ? "Painting the cover..."
      : type === "back-cover"
      ? "Designing the back cover..."
      : "Illustrating the page...";

  return (
    <div className="w-full aspect-square rounded-book bg-gradient-to-br from-muted via-muted/80 to-muted relative overflow-hidden flex flex-col items-center justify-center gap-3">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
        initial={shimmer.initial}
        animate={shimmer.animate}
        transition={shimmer.transition}
      />
      <motion.div
        className="absolute top-6 right-8"
        animate={{ y: [-4, 4, -4], rotate: [0, 15, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <Sparkles className="w-5 h-5 text-foreground/30" />
      </motion.div>
      <motion.div
        className="absolute bottom-10 left-10"
        animate={{ y: [3, -3, 3], rotate: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.5 }}
      >
        <Sparkles className="w-4 h-4 text-foreground/20" />
      </motion.div>

      <motion.div variants={pulseVariants} animate="animate" className="w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
        <img src={generatingBook} alt="" width={160} height={160} loading="lazy" className="w-full h-full object-contain" />
      </motion.div>

      <motion.p
        className="text-sm font-medium text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {message || label}
      </motion.p>

      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-foreground/40"
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
};
