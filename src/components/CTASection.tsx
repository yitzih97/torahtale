import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const ease = [0.16, 1, 0.3, 1];

interface Props {
  onStart: () => void;
}

export const CTASection = ({ onStart }: Props) => (
  <section className="relative py-32 lg:py-44 overflow-hidden bg-background">
    {/* Decorative gradient blobs */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />
    <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

    <div className="container relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease }}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="text-3xl lg:text-5xl font-bold text-primary leading-tight mb-6" style={{ lineHeight: "1.1" }}>
          Every Child Deserves
          <br /> to Be the Hero
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-md mx-auto">
          Create a one-of-a-kind Torah storybook in under 2 minutes.
          Powered by AI. Printed with love.
        </p>
        <Button variant="gold" size="xl" onClick={onStart} className="group gold-glow">
          <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
          Begin the Tale
        </Button>
      </motion.div>
    </div>
  </section>
);
