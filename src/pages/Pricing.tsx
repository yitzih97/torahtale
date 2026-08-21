import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Crown, Sparkles, BookOpen } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { CollectionsSection } from "@/components/CollectionsSection";
import { SectionHeading } from "@/components/SectionHeading";
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

      <main className="pt-[100px]">

        {/* ── PLANS ───────────────────────────────────────────────────────
         * Subscriptions and collections used to be two pages bolted together.
         * They are now one flow with one rhythm: the plans sit on a warm
         * parchment band, collections on the plain page below, same card
         * language throughout.
         */}
        <section className="relative overflow-hidden border-b border-gold/15 bg-gradient-to-b from-[hsl(42_55%_97%)] via-[hsl(40_50%_95.5%)] to-background">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 start-[12%] h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
            <div className="absolute -bottom-28 end-[10%] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="container relative z-10 py-5 lg:py-6 [@media(max-height:820px)]:py-3.5">
            <h1 className="mx-auto max-w-4xl text-center font-display text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl">
              {t.pricing.heroTitle}{" "}
              <span className="text-accent">{t.pricing.heroAccent}</span>
            </h1>

            <div className="mt-6 [@media(max-height:820px)]:mt-4">
              <SectionHeading>{t.pricing.plansEyebrow}</SectionHeading>
            </div>

            <div className="mx-auto mt-6 grid max-w-5xl gap-5 md:grid-cols-3 items-stretch [@media(max-height:820px)]:mt-4">
              {([
                { key: "single", icon: BookOpen, popular: false, title: t.pricing.singleTitle, sub: t.pricing.singleSubtitle, price: money(singlePrice("softcover", isIls)), per: "", cta: t.pricing.singleCta },
                { key: "torah", icon: Sparkles, popular: true, title: t.pricing.torahTitle, sub: t.pricing.torahSubtitle, price: money(subPrice("monthly", "softcover", isIls)), per: t.pricing.perMonth, cta: t.pricing.torahCta },
                { key: "tanach", icon: Crown, popular: false, title: t.pricing.tanachTitle, sub: t.pricing.tanachSubtitle, price: money(subPrice("yearly", "softcover", isIls)), per: t.pricing.perYear, cta: t.pricing.tanachCta },
              ] as const).map((p) => {
                const on = selected === p.key;
                const Icon = p.icon;
                return (
                  <div
                    key={p.key}
                    onClick={() => setSelected(p.key)}
                    className={`relative flex cursor-pointer flex-col rounded-3xl border p-5 transition-all duration-300 [@media(max-height:820px)]:p-4 ${
                      on
                        ? "border-accent/60 bg-card shadow-soft-lg ring-2 ring-accent/25"
                        : "border-border/70 bg-card/85 shadow-soft-sm backdrop-blur-sm hover:-translate-y-1 hover:border-accent/40 hover:shadow-soft-md"
                    }`}
                  >
                    {p.popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-0 bg-accent px-4 py-1 text-[10px] font-bold tracking-wide text-accent-foreground shadow-soft-sm">
                        <Crown className="me-1 h-3 w-3" /> {t.pricing.mostPopular}
                      </Badge>
                    )}
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-colors ${on ? "bg-accent text-accent-foreground" : "bg-gold/12 text-gold"}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <h3 className="font-display text-xl font-bold leading-tight text-primary">{p.title}</h3>
                    </div>
                    <div className="mt-3.5 flex items-baseline gap-1.5">
                      <span className="font-display text-4xl font-bold leading-none text-primary">{p.price}</span>
                      {p.per && <span className="text-sm text-muted-foreground">{p.per}</span>}
                    </div>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{p.sub}</p>
                    <Button
                      variant={on ? "gold" : "outline"}
                      size="default"
                      onClick={(e) => { e.stopPropagation(); goCreate(); }}
                      className="mt-4 w-full rounded-full"
                    >
                      {p.cta}
                    </Button>
                  </div>
                );
              })}
            </div>

            <p className="mx-auto mt-3.5 max-w-4xl text-center text-xs leading-relaxed text-muted-foreground/90 [@media(max-height:820px)]:mt-3">
              {t.pricing.plansNote}
            </p>
          </div>
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
