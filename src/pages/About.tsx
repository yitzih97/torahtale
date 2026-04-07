import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { BookOpen, Shield, Heart, Sparkles, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const ICONS = [BookOpen, Shield, Sparkles, Heart];

const About = () => {
  const { t, dir } = useLanguage();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <header className="pt-28 pb-16 border-b border-border bg-muted/30">
        <div className="container max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-3">{t.about.label}</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">{t.about.title}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t.about.subtitle}</p>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-6 py-16 space-y-20">
        <section className="space-y-4">
          <h2 className="text-2xl font-display font-bold text-foreground">{t.about.missionTitle}</h2>
          <p className="text-muted-foreground leading-relaxed">{t.about.missionP1}</p>
          <p className="text-muted-foreground leading-relaxed">{t.about.missionP2}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-display font-bold text-foreground">{t.about.howStartedTitle}</h2>
          <p className="text-muted-foreground leading-relaxed">{t.about.howStartedP1}</p>
          <p className="text-muted-foreground leading-relaxed">{t.about.howStartedP2}</p>
        </section>

        <section className="space-y-8">
          <h2 className="text-2xl font-display font-bold text-foreground">{t.about.valuesTitle}</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {t.about.values.map((v, i) => {
              const Icon = ICONS[i];
              return (
                <div key={v.title} className="p-6 rounded-2xl bg-muted/40 border border-border space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-display font-bold text-foreground">{t.about.teamTitle}</h2>
          <div className="p-8 rounded-2xl bg-muted/40 border border-border flex items-center gap-6">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <Users className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-muted-foreground leading-relaxed">{t.about.teamDesc}</p>
            </div>
          </div>
        </section>

        <section className="text-center space-y-6 py-8">
          <h2 className="text-2xl font-display font-bold text-foreground">{t.about.ctaTitle}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">{t.about.ctaDesc}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/">
              <Button variant="gold" size="lg" className="rounded-full px-8">
                {t.about.ctaButton} <ArrowRight className={`w-4 h-4 ml-2 ${dir === "rtl" ? "rotate-180" : ""}`} />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="rounded-full px-8">{t.about.ctaContact}</Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
