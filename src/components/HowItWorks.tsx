import { motion } from "framer-motion";
import { UserRound, Wand2, Truck } from "lucide-react";

const steps = [
  {
    icon: UserRound,
    number: "01",
    title: "Tell Us About Your Child",
    description:
      "Share their name, age, and a photo. They become the star of a timeless Torah story.",
  },
  {
    icon: Wand2,
    number: "02",
    title: "AI Writes & Illustrates",
    description:
      "Our AI crafts the narrative and paints every page in beautiful 3D Pixar style — all tznius and age-appropriate.",
  },
  {
    icon: Truck,
    number: "03",
    title: "Printed & Shipped",
    description:
      "A gorgeous hardcover arrives at your door — a personalized Torah sefer your family will treasure.",
  },
];

const ease = [0.16, 1, 0.3, 1];

export const HowItWorks = () => (
  <section className="relative py-28 lg:py-40 bg-background overflow-hidden">
    {/* Subtle decorative elements */}
    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

    <div className="container relative z-10 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease }}
        className="text-center mb-20"
      >
        <span className="inline-block font-mono text-[0.65rem] tracking-[0.25em] text-accent uppercase mb-5 py-1.5 px-4 rounded-full border border-accent/20 bg-accent/5">
          How It Works
        </span>
        <h2 className="text-3xl lg:text-5xl font-bold text-primary leading-tight">
          Three Simple Steps
        </h2>
        <p className="text-muted-foreground mt-4 max-w-md mx-auto text-[0.95rem]">
          From your child's details to a beautifully printed sefer — in minutes.
        </p>
      </motion.div>

      {/* Steps — horizontal timeline */}
      <div className="relative">
        {/* Connecting line */}
        <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-px bg-border" />

        <div className="grid md:grid-cols-3 gap-12 md:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.15, ease }}
              className="flex flex-col items-center text-center group"
            >
              {/* Number circle */}
              <div className="relative mb-8">
                <div className="w-[4.5rem] h-[4.5rem] rounded-full bg-card border-2 border-border flex items-center justify-center transition-all duration-500 group-hover:border-accent group-hover:shadow-[0_0_24px_hsl(var(--accent)/0.15)]">
                  <step.icon className="w-6 h-6 text-muted-foreground transition-colors duration-500 group-hover:text-accent" />
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center shadow-sm">
                  {step.number}
                </span>
              </div>

              {/* Content */}
              <h3 className="font-display text-lg font-semibold text-primary mb-2">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-[16rem]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
