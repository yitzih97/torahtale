import { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { UserRound, Wand2, Truck, ArrowRight } from "lucide-react";

const StepsScene = lazy(() =>
  import("@/components/3d/StepsScene").then((m) => ({ default: m.StepsScene }))
);

const steps = [
  {
    icon: UserRound,
    number: "01",
    title: "Tell Us About Your Hero",
    description: "Share their name, age, and a photo. They become the star of an ancient story.",
    accent: "bg-accent/10 text-accent",
  },
  {
    icon: Wand2,
    number: "02",
    title: "AI Writes & Illustrates",
    description: "Gemini Pro crafts the narrative. Nano Banana 2 paints every page in your chosen style.",
    accent: "bg-primary/10 text-primary",
  },
  {
    icon: Truck,
    number: "03",
    title: "Printed & Shipped",
    description: "A gorgeous hardcover arrives at your door — 32 pages of personalized wonder.",
    accent: "bg-accent/10 text-accent",
  },
];

const ease = [0.16, 1, 0.3, 1];

export const HowItWorks = () => (
  <section className="relative py-28 lg:py-40 bg-background overflow-hidden">
    {/* 3D scene background */}
    <div className="absolute inset-0 z-0 opacity-30">
      <Suspense fallback={null}>
        <StepsScene />
      </Suspense>
    </div>

    <div className="container relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease }}
        className="text-center mb-20"
      >
        <span className="font-mono text-xs tracking-widest text-accent uppercase block mb-4">
          The Process
        </span>
        <h2 className="text-3xl lg:text-5xl font-bold text-primary leading-tight" style={{ lineHeight: "1.1" }}>
          Three Steps to a
          <br className="hidden sm:block" /> Timeless Keepsake
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: i * 0.1, ease }}
            className="group relative bg-card rounded-2xl border border-border p-8 hover:border-accent/30 hover:shadow-soft-md transition-all duration-500"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`w-12 h-12 rounded-xl ${step.accent} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                <step.icon className="w-5 h-5" />
              </div>
              <span className="font-mono text-3xl font-bold text-border group-hover:text-accent/20 transition-colors duration-500">
                {step.number}
              </span>
            </div>
            <h3 className="font-display text-xl font-semibold text-primary mb-3">{step.title}</h3>
            <p className="text-muted-foreground leading-relaxed text-[0.925rem]">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
