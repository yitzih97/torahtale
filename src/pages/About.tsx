import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { BookOpen, Shield, Heart, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const ICONS = [BookOpen, Shield, Sparkles, Heart];

const floatingOrb = (delay: number, x: string, y: string, size: string, color: string) => (
  <motion.div
    className={`absolute ${x} ${y} ${size} rounded-full ${color} blur-[100px] pointer-events-none`}
    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);

const About = () => {
  const { t, dir, lang } = useLanguage();
  const isRtl = (lang === "he" || lang === "yi");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <Navbar transparentHero={false} />

      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {floatingOrb(0, "-left-40", "top-1/4", "w-[500px] h-[500px]", "bg-accent/20")}
        {floatingOrb(3, "-right-40", "top-1/3", "w-[400px] h-[400px]", "bg-primary/15")}
        {floatingOrb(5, "left-1/3", "bottom-0", "w-[600px] h-[300px]", "bg-accent/10")}
      </div>

      {/* Hero */}
      <section className="relative pt-36 pb-8 md:pt-44 md:pb-12">
        <div className="container max-w-4xl mx-auto px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-accent font-semibold tracking-[0.15em] uppercase text-xs mb-5"
          >
            {t.about.label}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-display font-bold text-foreground tracking-tight leading-[1.05]"
          >
            {t.about.title}
            <span className="text-accent">.</span>
          </motion.h1>

        </div>
      </section>

      {/* Content sections */}
      <section className="container max-w-3xl mx-auto px-6 pb-32 relative z-10 space-y-8 mt-8">
        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="p-8 md:p-12 rounded-[2rem] bg-card/60 backdrop-blur-2xl border border-border/30 shadow-[0_8px_60px_-12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.1)_inset]"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-5">{t.about.missionTitle}</h2>
          <p className="text-muted-foreground leading-relaxed text-[0.938rem] mb-3">{t.about.missionP1}</p>
          <p className="text-muted-foreground leading-relaxed text-[0.938rem]">{t.about.missionP2}</p>
        </motion.div>

        {/* How it started */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="p-8 md:p-12 rounded-[2rem] bg-card/60 backdrop-blur-2xl border border-border/30 shadow-[0_8px_60px_-12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.1)_inset]"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-5">{t.about.howStartedTitle}</h2>
          <p className="text-muted-foreground leading-relaxed text-[0.938rem] mb-3">{t.about.howStartedP1}</p>
          <p className="text-muted-foreground leading-relaxed text-[0.938rem]">{t.about.howStartedP2}</p>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6 text-center">{t.about.valuesTitle}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {t.about.values.map((v, i) => {
              const Icon = ICONS[i];
              return (
                <motion.div
                  key={v.title}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="p-7 rounded-2xl bg-card/60 backdrop-blur-2xl border border-border/30 shadow-[0_4px_30px_-8px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.1)_inset] space-y-3"
                >
                  <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center py-8"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">{t.about.ctaTitle}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8 text-lg font-light">{t.about.ctaDesc}</p>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
            <Link to="/">
              <Button variant="gold" size="lg" className="rounded-full px-10 h-14 text-base shadow-[0_0_30px_hsl(var(--accent)/0.25)] hover:shadow-[0_0_50px_hsl(var(--accent)/0.35)] transition-shadow duration-500">
                {t.about.ctaButton} <ArrowRight className={`w-4 h-4 ms-2 ${dir === "rtl" ? "rotate-180" : ""}`} />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
