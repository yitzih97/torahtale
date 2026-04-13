import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import heroBoy from "@/assets/hero-boy.png";
import heroGirl from "@/assets/hero-girl.png";

const ease = [0.16, 1, 0.3, 1];

interface Props {
  onStart: () => void;
}

export const CTASection = ({ onStart }: Props) => {
  const { getSetting } = useSiteSettings("website");
  const { t, dir } = useLanguage();

  const headline = getSetting("website", "cta-headline", t.cta.headline);
  const subtext = getSetting("website", "cta-subtext", t.cta.subtext);
  const buttonText = getSetting("website", "cta-button", t.cta.button);

  return (
    <section className="py-24 lg:py-32 bg-card">
      <div className="container max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease }}
          className="relative rounded-[2rem] bg-primary/20 border border-primary/30 p-10 lg:p-16 text-center overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-accent/10 blur-[60px] rounded-full" />
          <img src={heroBoy} alt="" className="absolute -left-4 bottom-0 w-28 opacity-30 lg:opacity-50 pointer-events-none hidden sm:block" />
          <img src={heroGirl} alt="" className="absolute -right-4 bottom-0 w-24 opacity-30 lg:opacity-50 pointer-events-none hidden sm:block" />
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-4 relative z-10">
            {headline.split(" ").map((word, i, arr) => {
              if (i === arr.length - 1) return <span key={i} className="text-accent">{word}</span>;
              return word + " ";
            })}
          </h2>
          {subtext && <p className="text-muted-foreground font-body leading-relaxed mb-8 max-w-md mx-auto relative z-10">{subtext}</p>}
          <Button variant="gold" size="xl" onClick={onStart} className="group gold-glow rounded-full relative z-10">
            {buttonText}
            <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${dir === "rtl" ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
