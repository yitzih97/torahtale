import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { TESTIMONIALS } from "@/data/testimonials";

import reviewer1 from "@/assets/avatars/reviewer1.jpg";
import reviewer2 from "@/assets/avatars/reviewer2.jpg";
import reviewer3 from "@/assets/avatars/reviewer3.jpg";
import kidRivka from "@/assets/gallery/kid-rivka.jpg";
import kidYehuda from "@/assets/gallery/kid-yehuda.jpg";
import kidChaya from "@/assets/gallery/kid-chaya.jpg";
import kidShmuel from "@/assets/gallery/kid-shmuel.jpg";
import kidEsther from "@/assets/gallery/kid-esther.jpg";
import kidAri from "@/assets/gallery/kid-ari.jpg";
import kidDevorah from "@/assets/gallery/kid-devorah.jpg";
import kidMoshe from "@/assets/gallery/kid-moshe.jpg";
import kidDovid from "@/assets/gallery/kid-dovid.jpg";
import kidNoa from "@/assets/gallery/kid-noa.jpg";

const ease = [0.16, 1, 0.3, 1];

// Pool of real avatar photos cycled across the reviews (same look as the
// homepage gallery reviews).
const AVATARS = [
  reviewer1, reviewer2, reviewer3,
  kidRivka, kidYehuda, kidChaya, kidShmuel, kidEsther,
  kidAri, kidDevorah, kidMoshe, kidDovid, kidNoa,
];

export const TestimonialsSection = () => {
  const { getSetting } = useSiteSettings("website");

  // The first three remain admin-editable via site_settings (back-compat);
  // the rest of the wall is static.
  const testimonials = TESTIMONIALS.map((def, i) => ({
    ...def,
    name: i < 3 ? getSetting("website", `testimonial-${i}-name`, def.name) : def.name,
    location: i < 3 ? getSetting("website", `testimonial-${i}-location`, def.location) : def.location,
    text: i < 3 ? getSetting("website", `testimonial-${i}-text`, def.text) : def.text,
    avatar: AVATARS[i % AVATARS.length],
  }));

  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-background">
      <div className="container max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease }} className="text-center mb-16">
          <span className="text-sm font-semibold text-accent mb-3 block tracking-wider uppercase">What Parents Say</span>
          <h2 className="font-heading text-3xl lg:text-5xl font-bold text-foreground leading-tight">
            Loved at Bedtime,<br />Treasured L'Doros
          </h2>
          <div className="flex items-center justify-center gap-2 mt-5">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-4 h-4 fill-accent text-accent" />)}
            </div>
            <span className="text-sm text-muted-foreground">4.9/5 from 500+ reviews</span>
          </div>
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
                <img
                  src={t.avatar}
                  alt={t.name}
                  loading="lazy"
                  className="w-10 h-10 rounded-full object-cover border border-primary/40"
                />
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
