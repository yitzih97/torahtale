import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { ShieldCheck, Sparkles, BookOpenText, Package, Languages, Gift, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ease = [0.16, 1, 0.3, 1] as const;

const icons: LucideIcon[] = [ShieldCheck, Sparkles, BookOpenText, Package, Languages, Gift];

/** Counts from 0 to `value` once the number scrolls into view. */
const CountUp = ({ value, suffix }: { value: number; suffix: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      // ease-out cubic
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} className="font-display text-4xl sm:text-5xl font-bold gold-text-gradient tabular-nums">
      {display}
      {suffix}
    </span>
  );
};

export const WhyTorahTale = () => {
  const { t, dir } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);

  // Gentle parallax on the decorative blobs as the section scrolls through.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const blobY1 = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const blobY2 = useTransform(scrollYProgress, [0, 1], [-40, 80]);

  return (
    <section
      ref={sectionRef}
      id="why-torah-tale"
      dir={dir}
      className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-b from-background via-[hsl(42_55%_96%)] to-background"
    >
      <div className="absolute inset-0 pointer-events-none">
        <motion.div style={{ y: blobY1 }} className="absolute -top-20 left-[8%] w-80 h-80 bg-gold/10 rounded-full blur-3xl" />
        <motion.div style={{ y: blobY2 }} className="absolute bottom-0 right-[5%] w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        {/* Stats strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 mb-16 lg:mb-24">
          {t.whyUs.stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease }}
              className="text-center"
            >
              <CountUp value={stat.value} suffix={stat.suffix} />
              <p className="mt-2 text-xs sm:text-sm text-foreground/60 font-medium leading-snug max-w-[180px] mx-auto">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease }}
          className="text-center max-w-2xl mx-auto mb-12 lg:mb-16"
        >
          <span className="inline-block rounded-full bg-gold/15 text-gold text-xs font-semibold tracking-[0.18em] uppercase px-3 py-1">
            {t.whyUs.label}
          </span>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            {t.whyUs.title}
            <br />
            <span className="text-accent">{t.whyUs.titleAccent}</span>
          </h2>
          {t.whyUs.subtitle && (
            <p className="mt-4 text-sm sm:text-base text-foreground/65 leading-relaxed">{t.whyUs.subtitle}</p>
          )}
        </motion.div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {t.whyUs.features.map((feature, i) => {
            const Icon = icons[i % icons.length];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.12, ease }}
                whileHover={{ y: -6 }}
                className="group relative rounded-3xl border border-foreground/10 bg-background/70 backdrop-blur-sm p-6 lg:p-8 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] hover:shadow-[0_24px_50px_-24px_hsl(43_64%_42%/0.45)] hover:border-gold/30 transition-[box-shadow,border-color] duration-500"
              >
                {/* soft gold sheen on hover */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <motion.div
                  whileHover={{ rotate: [0, -8, 8, 0], scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  className="relative inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gold/12 text-gold border border-gold/20 mb-4"
                >
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </motion.div>
                <h3 className="relative font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="relative text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
