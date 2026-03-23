import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const ease = [0.16, 1, 0.3, 1];

const testimonials = [
  {
    name: "Talia Ben-Ami",
    location: "Brooklyn, NY",
    initials: "TB",
    text: "My daughter's face when she saw herself as the heroine of the Purim story — I will never forget it. This is more than a sefer, it's a treasure.",
    rating: 5,
  },
  {
    name: "Avi Rosenberg",
    location: "Lakewood, NJ",
    initials: "AR",
    text: "We've subscribed to the Parashah Club. Every Leil Shabbos, our son reads his new personalized story at the Shabbos table. The whole mishpacha loves it.",
    rating: 5,
  },
  {
    name: "Racheli Katz",
    location: "Monsey, NY",
    initials: "RK",
    text: "The illustrations are stunning and completely tznius. The AI captured the essence of the parasha perfectly for our 5-year-old. A real kiddush Hashem.",
    rating: 5,
  },
];

export const TestimonialsSection = () => (
  <section id="testimonials" className="py-24 lg:py-32 bg-background">
    <div className="container max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease }}
        className="text-center mb-16"
      >
        <span className="text-sm font-semibold text-accent mb-3 block tracking-wider uppercase">What Parents Say</span>
        <h2 className="text-3xl lg:text-5xl font-bold text-foreground leading-tight">
          Loved at Bedtime,
          <br />
          Treasured L'Doros
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: i * 0.1, ease }}
            className="bg-card rounded-3xl border border-border hover:border-accent/20 p-7 flex flex-col relative transition-colors duration-300"
          >
            <Quote className="w-8 h-8 text-accent/20 mb-4" />
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-accent text-accent" />
              ))}
            </div>
            <p className="text-foreground/80 font-body leading-relaxed text-[0.95rem] flex-1">"{t.text}"</p>
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
              <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center text-sm font-semibold text-accent border border-primary/40">
                {t.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.location}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
