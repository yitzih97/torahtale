import { motion } from "framer-motion";
import { UserRound, Wand2, Truck } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const defaultSteps = [
  { icon: UserRound, number: "01", title: "Tell Us About Your Child", description: "Share their name, age, and a photo. They become the hero of a timeless Torah story." },
  { icon: Wand2, number: "02", title: "AI Creates the Sefer", description: "Our AI writes the narrative and illustrates every page — all tznius, age-appropriate, and aligned with Chareidi hashkafah." },
  { icon: Truck, number: "03", title: "Delivered to Your Door", description: "A gorgeous hardcover arrives — a personalized sefer your mishpacha will treasure l'doros." },
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
    <section id="how-it-works" className="py-16 sm:py-24 lg:py-32 bg-background">
      <div className="container max-w-5xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease }} className="text-center mb-10 sm:mb-16">
          <span className="text-xs sm:text-sm font-semibold text-accent mb-3 block tracking-wider uppercase">How It Works</span>
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-foreground leading-tight">
            Three simple steps to a<br /><span className="text-accent">personalized Torah sefer</span>
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: i * 0.12, ease }} className="relative group text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/30 text-accent mb-5 transition-transform duration-500 group-hover:scale-110 border border-primary/40">
                <step.icon className="w-7 h-7" />
              </div>
              <div className="text-xs font-bold text-accent/40 mb-2 tracking-widest">{step.number}</div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm font-body leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
