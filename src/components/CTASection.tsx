import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBoy from "@/assets/hero-boy.png";
import heroGirl from "@/assets/hero-girl.png";

const ease = [0.16, 1, 0.3, 1];

interface Props {
  onStart: () => void;
}

export const CTASection = ({ onStart }: Props) => (
  <section className="py-24 lg:py-32 bg-card">
    <div className="container max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease }}
        className="relative rounded-[2rem] bg-primary/20 border border-primary/30 p-10 lg:p-16 text-center overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-accent/10 blur-[60px] rounded-full" />

        {/* Decorative characters */}
        <img src={heroBoy} alt="" className="absolute -left-4 bottom-0 w-28 opacity-30 lg:opacity-50 pointer-events-none hidden sm:block" />
        <img src={heroGirl} alt="" className="absolute -right-4 bottom-0 w-24 opacity-30 lg:opacity-50 pointer-events-none hidden sm:block" />

        <h2 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-4 relative z-10">
          Every Child Deserves
          <br /> to Be Part of the <span className="text-accent">Story</span>
        </h2>
        <p className="text-muted-foreground font-body leading-relaxed mb-8 max-w-md mx-auto relative z-10">
          Create a one-of-a-kind personalized Torah sefer in under 2 minutes.
          Powered by AI. Printed with ahavas Yisrael.
        </p>
        <Button variant="gold" size="xl" onClick={onStart} className="group gold-glow rounded-full relative z-10">
          Begin the Tale
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </motion.div>
    </div>
  </section>
);
