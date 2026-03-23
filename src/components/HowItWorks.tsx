import { motion } from "framer-motion";
import { UserRound, Wand2, Truck, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: UserRound,
    number: "1",
    title: "Tell Us About Your Child",
    description:
      "Share their name, age, and a photo. They become the hero of a timeless Torah story.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Wand2,
    number: "2",
    title: "AI Creates the Sefer",
    description:
      "Our AI writes the narrative and illustrates every page — all tznius, age-appropriate, and beautiful.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Truck,
    number: "3",
    title: "Delivered to Your Door",
    description:
      "A gorgeous hardcover arrives — a personalized Torah sefer your family will treasure for years.",
    color: "bg-accent/10 text-accent",
  },
];

const ease = [0.16, 1, 0.3, 1];

export const HowItWorks = () => (
  <section className="relative py-24 lg:py-36 bg-background overflow-hidden">
    <div className="container relative z-10 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease }}
        className="text-center mb-16 lg:mb-20"
      >
        <span className="inline-block text-sm font-medium text-accent mb-4">
          How It Works
        </span>
        <h2 className="text-3xl lg:text-5xl font-bold text-primary leading-tight">
          Three simple steps to a<br />
          <span className="text-accent">personalized Torah sefer</span>
        </h2>
      </motion.div>

      {/* Steps */}
      <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: i * 0.12, ease }}
            className="relative group"
          >
            <div className="bg-card rounded-3xl border border-border p-8 lg:p-10 h-full transition-all duration-500 hover:shadow-soft-md hover:border-accent/20 hover:-translate-y-1">
              {/* Number + Icon row */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <span className="text-5xl font-bold text-border group-hover:text-accent/20 transition-colors duration-500">
                  {step.number}
                </span>
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-semibold text-primary mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-[0.9rem] leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Arrow connector (hidden on mobile, shown between cards) */}
            {i < steps.length - 1 && (
              <div className="hidden md:flex absolute -right-5 lg:-right-5 top-1/2 -translate-y-1/2 z-10">
                <ArrowRight className="w-5 h-5 text-border" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
