import { motion } from "framer-motion";
import { BookOpen, Sparkles } from "lucide-react";

const shimmer = {
  initial: { x: "-100%" },
  animate: { x: "100%" },
  transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
};

const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
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
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent"
        initial={shimmer.initial}
        animate={shimmer.animate}
        transition={shimmer.transition}
      />

      {/* Floating sparkles */}
      <motion.div
        className="absolute top-6 right-8"
        animate={{ y: [-4, 4, -4], rotate: [0, 15, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <Sparkles className="w-5 h-5 text-accent/40" />
      </motion.div>
      <motion.div
        className="absolute bottom-10 left-10"
        animate={{ y: [3, -3, 3], rotate: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.5 }}
      >
        <Sparkles className="w-4 h-4 text-accent/30" />
      </motion.div>

      {/* Center icon */}
      <motion.div variants={pulseVariants} animate="animate">
        <BookOpen className="w-10 h-10 text-accent/50" />
      </motion.div>

      {/* Label */}
      <motion.p
        className="text-sm font-medium text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {message || label}
      </motion.p>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-accent/40"
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
};
