import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Crown, Sparkles, BookOpen } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { CollectionsSection } from "@/components/CollectionsSection";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

const Pricing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, dir } = useLanguage();
  const [selected, setSelected] = useState<"single" | "torah" | "tanach">("torah");
  const { symbol, rate } = t.currency;
  const fmt = (usd: number) => `${symbol}${(usd * rate).toFixed(2)}`;

  // Scroll to #collections (etc.) when arriving via an anchor link.
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => clearTimeout(timer);
  }, [location.hash]);

  const goCreate = () => {
    try {
      localStorage.removeItem("torahtale_wizard_state");
    } catch { /* ignore */ }
    navigate("/create");
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <SEO
        title="Pricing & Plans — Torah Tale Personalized Books"
        description="Simple pricing for Torah Tale books. Choose softcover, hardcover, or board book, or join the Parsha Club for a weekly story delivered to your door."
        path="/pricing"
      />
      <Navbar onStart={() => goCreate()} transparentHero={false} />

      <main className="pt-24 lg:pt-28">
        {/* HERO */}
        <section className="container max-w-5xl text-center py-16 lg:py-24">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            {t.pricing.heroTitle}{" "}
            <span className="text-accent">{t.pricing.heroAccent}</span>
          </h1>
        </section>

        {/* PRICING CARDS */}
        <section className="container pb-16 lg:pb-24">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
            {/* CARD 1 — Single */}
            <div
              onClick={() => setSelected("single")}
              className={`order-2 lg:order-1 relative rounded-2xl border-2 p-8 flex flex-col shadow-sm hover:shadow-md transition-all cursor-pointer ${
                selected === "single"
                  ? "border-accent bg-gradient-to-br from-primary to-primary/90 shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.6)]"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className={`w-5 h-5 ${selected === "single" ? "text-accent" : "text-muted-foreground"}`} />
                <h3 className={`font-display text-xl font-semibold ${selected === "single" ? "text-primary-foreground" : "text-foreground"}`}>
                  {t.pricing.singleTitle}
                </h3>
              </div>
              <div className="mb-8">
                <p className={`text-xs uppercase tracking-wider mb-1 ${selected === "single" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t.pricing.startingAt}</p>
                <div className={`text-5xl font-bold ${selected === "single" ? "text-primary-foreground" : "text-foreground"}`}>{fmt(14.99)}</div>
                <p className={`text-sm mt-1 ${selected === "single" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{t.pricing.singleSubtitle}</p>
              </div>
              <ul className="space-y-3 mb-10 flex-1"></ul>
              <Button variant={selected === "single" ? "gold" : "outline"} size="lg" onClick={(e) => { e.stopPropagation(); goCreate(); }} className="w-full">
                {t.pricing.singleCta}
              </Button>
            </div>

            {/* CARD 2 — Torah Series */}
            <div
              onClick={() => setSelected("torah")}
              className={`order-1 lg:order-2 relative rounded-2xl border-2 p-8 flex flex-col transition-all cursor-pointer lg:scale-105 lg:-my-2 ${
                selected === "torah"
                  ? "border-accent bg-gradient-to-br from-primary to-primary/90 shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.6)]"
                  : "border-border bg-card shadow-sm hover:shadow-md"
              }`}
            >
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground border-0 px-4 py-1 text-xs font-bold tracking-wide shadow-lg">
                <Crown className="w-3 h-3 me-1" /> {t.pricing.mostPopular}
              </Badge>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-accent" />
                <h3 className={`font-display text-xl font-semibold ${selected === "torah" ? "text-primary-foreground" : "text-foreground"}`}>
                  {t.pricing.torahTitle}
                </h3>
              </div>
              <div className="mb-8">
                <p className={`text-xs uppercase tracking-wider mb-1 ${selected === "torah" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t.pricing.startingAt}</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-bold ${selected === "torah" ? "text-primary-foreground" : "text-foreground"}`}>{fmt(74.77)}</span>
                  <span className={selected === "torah" ? "text-primary-foreground/80" : "text-muted-foreground"}>{t.pricing.perMonth}</span>
                </div>
                <p className={`text-sm mt-1 ${selected === "torah" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {t.pricing.torahSubtitle}
                </p>
              </div>
              <ul className="space-y-3 mb-10 flex-1"></ul>
              <Button variant={selected === "torah" ? "gold" : "outline"} size="lg" onClick={(e) => { e.stopPropagation(); goCreate(); }} className="w-full">
                {t.pricing.torahCta}
              </Button>
            </div>

            {/* CARD 3 — Tanach Series */}
            <div
              onClick={() => setSelected("tanach")}
              className={`order-3 relative rounded-2xl border-2 p-8 flex flex-col transition-all cursor-pointer ${
                selected === "tanach"
                  ? "border-accent bg-gradient-to-br from-primary to-primary/90 shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.6)]"
                  : "border-border bg-card shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-2 mb-6">
                <Crown className="w-5 h-5 text-accent" />
                <h3 className={`font-display text-xl font-semibold ${selected === "tanach" ? "text-primary-foreground" : "text-foreground"}`}>
                  {t.pricing.tanachTitle}
                </h3>
              </div>
              <div className="mb-8">
                <p className={`text-xs uppercase tracking-wider mb-1 ${selected === "tanach" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t.pricing.startingAt}</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-bold ${selected === "tanach" ? "text-primary-foreground" : "text-foreground"}`}>{fmt(932.98)}</span>
                  <span className={selected === "tanach" ? "text-primary-foreground/80" : "text-muted-foreground"}>{t.pricing.perYear}</span>
                </div>
                <p className={`text-sm mt-1 ${selected === "tanach" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {t.pricing.tanachSubtitle}
                </p>
              </div>
              <ul className="space-y-3 mb-10 flex-1"></ul>
              <Button variant={selected === "tanach" ? "gold" : "outline"} size="lg" onClick={(e) => { e.stopPropagation(); goCreate(); }} className="w-full">
                {t.pricing.tanachCta}
              </Button>
            </div>
          </div>
        </section>

        {/* COLLECTIONS — curated bundles, moved here from the homepage */}
        <CollectionsSection />

        {/* FAQ */}
        <section className="container max-w-3xl py-16 lg:py-24">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-10">
            {t.pricing.faqTitle}
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {t.pricing.faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-start text-base font-semibold">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
