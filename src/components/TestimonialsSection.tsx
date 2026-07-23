import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { TESTIMONIALS } from "@/data/testimonials";

const ease = [0.16, 1, 0.3, 1];

// Every review shows initials in a coloured circle — no photo thumbnails.
const initialsOf = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export const TestimonialsSection = () => {
  const { getSetting } = useSiteSettings("website");

  // The first three remain admin-editable via site_settings (back-compat).
  const testimonials = TESTIMONIALS.map((def, i) => ({
    ...def,
    name: i < 3 ? getSetting("website", `testimonial-${i}-name`, def.name) : def.name,
    location: i < 3 ? getSetting("website", `testimonial-${i}-location`, def.location) : def.location,
    text: i < 3 ? getSetting("website", `testimonial-${i}-text`, def.text) : def.text,
  }));

  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-background">
      <div className="container max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease }} className="text-center mb-16">
          <span className="text-sm font-semibold text-accent mb-3 block tracking-wider uppercase">What Parents Say</span>
          <h2 className="font-heading text-3xl lg:text-5xl font-bold text-foreground leading-tight">
            Loved at Bedtime,<br />Treasured for Generations
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08, ease }}
              className="bg-card rounded-3xl border border-border hover:border-accent/20 p-7 flex flex-col relative transition-colors duration-300"
            >
              <Quote className="w-8 h-8 text-accent/20 mb-4" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-accent text-accent" />)}
              </div>
              <p className="text-foreground/80 font-body leading-relaxed text-[0.95rem] flex-1">"{t.text}"</p>
              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center text-sm font-semibold text-accent border border-primary/40">
                  {initialsOf(t.name)}
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
};
