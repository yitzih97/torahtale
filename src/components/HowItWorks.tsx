import { motion } from "framer-motion";
import { UserRound, Wand2, Truck } from "lucide-react";

const steps = [
  {
    icon: UserRound,
    title: "Tell Us About Your Child",
    description: "Share their name, age, and a photo. They become the hero of the story.",
  },
  {
    icon: Wand2,
    title: "AI Writes & Illustrates",
    description: "Our engine weaves your child into this week's Torah portion with custom art.",
  },
  {
    icon: Truck,
    title: "We Print & Ship",
    description: "A gorgeous hardcover book arrives at your door — a keepsake forever.",
  },
];

const ease = [0.22, 1, 0.36, 1];

export const HowItWorks = () => (
  <section className="py-24 lg:py-32 bg-card">
    <div className="container">
      <motion.h2
        initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease }}
        className="text-3xl lg:text-4xl font-bold text-center text-primary mb-16"
      >
        How the Magic Happens
      </motion.h2>
      <div className="grid md:grid-cols-3 gap-8 lg:gap-16">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: i * 0.1, ease }}
            className="text-center space-y-4"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
              <step.icon className="w-7 h-7 text-gold" />
            </div>
            <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              Step {i + 1}
            </span>
            <h3 className="font-display text-xl font-semibold text-primary">{step.title}</h3>
            <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
