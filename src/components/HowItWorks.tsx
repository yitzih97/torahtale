import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { UserRound, Wand2, Truck } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";

import step1Img from "@/assets/steps/step1-tell-us.png";
import step2Img from "@/assets/steps/step2-ai-creates.png";
import step3Img from "@/assets/steps/step3-delivered.png";

const icons = [UserRound, Wand2, Truck];
const images = [step1Img, step2Img, step3Img];
const numbers = ["01", "02", "03"];

const ease = [0.16, 1, 0.3, 1] as const;

export const HowItWorks = () => {
  const { getSetting } = useSiteSettings("website");
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const blobY1 = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const blobY2 = useTransform(scrollYProgress, [0, 1], [-60, 60]);

  const steps = t.howItWorks.steps.map((def, i) => ({
    icon: icons[i],
    number: numbers[i],
    image: images[i],
    title: getSetting("website", `how-step-${i}-title`, def.title),
    description: getSetting("website", `how-step-${i}-desc`, def.description),
  }));

  return (
    <section ref={sectionRef} id="how-it-works" className="py-16 sm:py-24 lg:py-32 bg-background relative overflow-hidden scroll-mt-20">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div style={{ y: blobY1 }} className="absolute top-20 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
        <motion.div style={{ y: blobY2 }} className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease }}
          className="text-center mb-12 sm:mb-20"
        >
          <span className="text-xs sm:text-sm font-semibold text-accent mb-3 block tracking-wider uppercase">{t.howItWorks.label}</span>
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-foreground leading-tight">
            {t.howItWorks.title}<br /><span className="text-accent">{t.howItWorks.titleAccent}</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Scroll-drawn connector arc across the three steps (desktop only) */}
          <svg
            className="hidden lg:block absolute top-[128px] inset-x-0 w-full h-24 pointer-events-none z-0"
            viewBox="0 0 1000 100"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden
          >
            <motion.path
              d="M 170 50 C 300 -10, 380 110, 500 50 C 620 -10, 700 110, 830 50"
              stroke="hsl(var(--accent) / 0.3)"
              strokeWidth="2.5"
              strokeDasharray="8 8"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1.6, ease: "easeInOut", delay: 0.3 }}
            />
          </svg>

          <div className="space-y-16 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: i * 0.15, ease }}
                className="relative group z-10"
              >
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02, rotate: i % 2 === 0 ? -1 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative w-full max-w-[280px] aspect-square rounded-3xl overflow-hidden mb-6 shadow-lg border border-border/50 group-hover:shadow-xl group-hover:border-accent/30 transition-all duration-500"
                  >
                    <img src={step.image} alt={step.title} loading="lazy" width={800} height={800} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <motion.div
                      initial={{ scale: 0, rotate: -12 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.25 + i * 0.15 }}
                      className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shadow-md"
                    >
                      {step.number}
                    </motion.div>
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/40 to-transparent" />
                    {/* Gold sheen sweep on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-sheen" />
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 text-accent mb-4 border border-accent/20"
                  >
                    <step.icon className="w-6 h-6" />
                  </motion.div>

                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  {step.description && (
                    <p className="text-muted-foreground text-sm font-body leading-relaxed max-w-xs mx-auto">{step.description}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
