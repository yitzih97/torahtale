import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { TESTIMONIALS } from "@/data/testimonials";

import adult1 from "@/assets/avatars/adult-1.jpg"; // man, 30s, beard + yarmulke
import adult2 from "@/assets/avatars/adult-2.jpg"; // woman, 30s, sheitel
import adult3 from "@/assets/avatars/adult-3.jpg"; // older man, beard + hat
import adult4 from "@/assets/avatars/adult-4.jpg"; // woman, 20s, tichel
import adult5 from "@/assets/avatars/adult-5.jpg"; // man, 40s, kippah + glasses
import adult6 from "@/assets/avatars/adult-6.jpg"; // woman, 40s, snood

const ease = [0.16, 1, 0.3, 1];

// Only some reviews get a photo — the rest fall back to initials, which reads
// as a real, organic review wall. Each photo is gender-matched to the reviewer
// name and spread out so faces don't cluster or repeat next to each other.
const PHOTO_AVATAR: Record<number, string> = {
  0: adult2, 1: adult1, 2: adult4, 5: adult6, 8: adult3, 12: adult5,
  15: adult2, 18: adult1, 22: adult4, 25: adult3, 29: adult6, 32: adult2,
  36: adult4, 40: adult5, 43: adult6, 47: adult1,
};

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
    avatar: PHOTO_AVATAR[i] ?? null,
  }));

  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-background">
      <div className="container max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease }} className="text-center mb-16">
          <span className="text-sm font-semibold text-accent mb-3 block tracking-wider uppercase">What Parents Say</span>
          <h2 className="font-heading text-3xl lg:text-5xl font-bold text-foreground leading-tight">
            Loved at Bedtime,<br />Treasured Generations
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
                {t.avatar ? (
                  <img
                    src={t.avatar}
                    alt={t.name}
                    loading="lazy"
                    className="w-10 h-10 rounded-full object-cover border border-primary/40"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center text-sm font-semibold text-accent border border-primary/40">
                    {initialsOf(t.name)}
                  </div>
                )}
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
