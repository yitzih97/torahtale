import { motion } from "framer-motion";
import { UserRound, Wand2, Truck } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

import step1Img from "@/assets/steps/step1-tell-us.jpg";
import step2Img from "@/assets/steps/step2-ai-creates.jpg";
import step3Img from "@/assets/steps/step3-delivered.jpg";

const defaultSteps = [
  { icon: UserRound, number: "01", title: "Tell Us About Your Child", description: "Share their name, age, and a photo. They become the hero of a timeless Torah story.", image: step1Img },
  { icon: Wand2, number: "02", title: "AI Creates the Sefer", description: "Our AI writes the narrative and illustrates every page — all tznius, age-appropriate, and aligned with Chareidi hashkafah.", image: step2Img },
  { icon: Truck, number: "03", title: "Delivered to Your Door", description: "A gorgeous hardcover arrives — a personalized sefer your mishpacha will treasure l'doros.", image: step3Img },
];

const ease = [0.16, 1, 0.3, 1];

export const HowItWorks = () => {
  const { getSetting } = useSiteSettings("website");

  const steps = defaultSteps.map((def, i) => ({
    ...def,
    title: getSetting("website", `how-step-${i}-title`, def.title),
    description: getSetting("website", `how-step-${i}-desc`, def.description),
  }));

  return (
    <section id="how-it-works" className="py-16 sm:py-24 lg:py-32 bg-background relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease }}
          className="text-center mb-12 sm:mb-20"
        >
          <span className="text-xs sm:text-sm font-semibold text-accent mb-3 block tracking-wider uppercase">How It Works</span>
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-foreground leading-tight">
            Three simple steps to a<br /><span className="text-accent">personalized Torah sefer</span>
          </h2>
        </motion.div>

        <div className="space-y-16 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.15, ease }}
              className="relative group"
            >
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-32 -right-4 w-8 border-t-2 border-dashed border-accent/20 z-0" />
              )}

              <div className="flex flex-col items-center text-center">
                {/* Illustration card */}
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative w-full max-w-[280px] aspect-square rounded-3xl overflow-hidden mb-6 shadow-lg border border-border/50 group-hover:shadow-xl group-hover:border-accent/30 transition-all duration-500"
                >
                  <img
                    src={step.image}
                    alt={step.title}
                    loading="lazy"
                    width={800}
                    height={800}
                    className="w-full h-full object-cover"
                  />
                  {/* Floating number badge */}
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shadow-md">
                    {step.number}
                  </div>
                  {/* Subtle gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/40 to-transparent" />
                </motion.div>

                {/* Icon */}
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 text-accent mb-4 border border-accent/20"
                >
                  <step.icon className="w-6 h-6" />
                </motion.div>

                {/* Text */}
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm font-body leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
