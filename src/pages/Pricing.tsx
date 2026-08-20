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
import { singlePrice, subPrice } from "@/lib/pricing";

const Pricing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, dir } = useLanguage();
  const [selected, setSelected] = useState<"single" | "torah" | "tanach">("torah");
  const { symbol } = t.currency;
  // Product prices come from the canonical Shopify table (exact USD + ILS), not a
  // currency-rate estimate, so what's shown matches what Shopify charges.
  const isIls = t.currency.code === "ILS";
  const money = (n: number) => `${symbol}${n.toFixed(2)}`;

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

        {/* ── ONE UNIT: how you buy ────────────────────────────────────────
         * Subscriptions and collections were two pages bolted together — a
         * dark card wall, then a differently-coloured band. They are now one
         * section with one rhythm: pick a plan, or build a bundle, same card
         * language throughout.
         */}
        <section className="container pb-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-3xl font-bold uppercase tracking-[0.12em] text-accent md:text-4xl">{t.pricing.plansEyebrow}</p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3 items-stretch">
            {([
              { key: "single", popular: false,  title: t.pricing.singleTitle, sub: t.pricing.singleSubtitle, price: money(singlePrice("softcover", isIls)), per: "", cta: t.pricing.singleCta },
              { key: "torah", popular: true, title: t.pricing.torahTitle,  sub: t.pricing.torahSubtitle,  price: money(subPrice("monthly", "softcover", isIls)), per: t.pricing.perMonth, cta: t.pricing.torahCta },
              { key: "tanach", popular: false, title: t.pricing.tanachTitle, sub: t.pricing.tanachSubtitle, price: money(subPrice("yearly", "softcover", isIls)), per: t.pricing.perYear, cta: t.pricing.tanachCta },
            ] as const).map((p) => {
              const on = selected === p.key;
              return (
                <div
                  key={p.key}
                  onClick={() => setSelected(p.key)}
                  className={`relative flex cursor-pointer flex-col rounded-3xl border-2 p-6 transition-all duration-300 ${
                    on
                      ? "border-accent bg-accent/5 shadow-soft-lg ring-1 ring-accent/25"
                      : "border-border bg-card shadow-soft-sm hover:-translate-y-1 hover:shadow-soft-lg"
                  }`}
                >
                  {p.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-0 bg-accent px-4 py-1 text-[10px] font-bold tracking-wide text-accent-foreground shadow-soft-sm">
                      <Crown className="me-1 h-3 w-3" /> {t.pricing.mostPopular}
                    </Badge>
                  )}
                  <h3 className="font-display text-xl font-bold text-primary">{p.title}</h3>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="font-display text-4xl font-bold text-primary">{p.price}</span>
                    {p.per && <span className="text-sm text-muted-foreground">{p.per}</span>}
                  </div>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{p.sub}</p>
                  <Button
                    variant={on ? "gold" : "outline"}
                    size="lg"
                    onClick={(e) => { e.stopPropagation(); goCreate(); }}
                    className="mt-6 w-full rounded-full"
                  >
                    {p.cta}
                  </Button>
                </div>
              );
            })}
          </div>

          <p className="mx-auto mt-5 max-w-2xl text-center text-xs text-muted-foreground">
            {t.pricing.plansNote}
          </p>
        </section>

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
