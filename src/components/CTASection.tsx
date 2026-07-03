import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SparkleEffect } from "@/components/SparkleEffect";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import heroBoy from "@/assets/hero-boy.png";
import heroGirl from "@/assets/hero-girl.png";

const ease = [0.16, 1, 0.3, 1] as const;

interface Props {
  onStart: () => void;
}

export const CTASection = ({ onStart }: Props) => {
  const { getSetting } = useSiteSettings("website");
  const { t, dir } = useLanguage();

  const headline = getSetting("website", "cta-headline", t.cta.headline);
  const subtext = getSetting("website", "cta-subtext", t.cta.subtext);
  const buttonText = getSetting("website", "cta-button", t.cta.button);

  const words = headline.split(" ");

  return (
    <section className="py-24 lg:py-32 bg-card">
      <div className="container max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease }}
          className="relative rounded-[2rem] bg-primary/20 border border-primary/30 p-10 lg:p-16 text-center overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-accent/10 blur-[60px] rounded-full" />
          <SparkleEffect count={16} />
          <motion.img
            src={heroBoy}
            alt=""
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-4 bottom-0 w-28 opacity-30 lg:opacity-50 pointer-events-none hidden sm:block"
          />
          <motion.img
            src={heroGirl}
            alt=""
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="absolute -right-4 bottom-0 w-24 opacity-30 lg:opacity-50 pointer-events-none hidden sm:block"
          />

          {/* Headline reveals word by word */}
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-4 relative z-10">
            {words.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.06, ease }}
                className={`inline-block ${i === words.length - 1 ? "text-accent" : ""}`}
              >
                {word}
                {i < words.length - 1 ? " " : ""}
              </motion.span>
            ))}
          </h2>

          {subtext && <p className="text-muted-foreground font-body leading-relaxed mb-8 max-w-md mx-auto relative z-10">{subtext}</p>}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, delay: 0.4, ease }}
            className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 mt-2"
          >
            <Button variant="gold" size="xl" onClick={onStart} className="group gold-glow gold-glow-hover rounded-full">
              {buttonText}
              <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${dir === "rtl" ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
            </Button>
            <a
              href="/pricing"
              className="text-sm font-semibold text-foreground/70 hover:text-accent transition-colors underline-offset-4 hover:underline"
            >
              {t.cta.secondary}
            </a>
          </motion.div>

          {t.cta.microcopy && (
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="relative z-10 mt-5 text-xs text-muted-foreground"
            >
              {t.cta.microcopy}
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  );
};
