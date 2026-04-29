import { useNavigate } from "react-router-dom";
import { Check, Crown, Sparkles, BookOpen } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import cover1 from "@/assets/gallery/s1-cover.jpg";
import cover2 from "@/assets/gallery/s2-cover.jpg";
import cover3 from "@/assets/gallery/s3-cover.jpg";
import cover4 from "@/assets/gallery/s4-cover.jpg";
import cover5 from "@/assets/gallery/s5-cover.jpg";
import cover6 from "@/assets/gallery/s6-cover.jpg";
import cover7 from "@/assets/gallery/s7-cover.jpg";
import cover8 from "@/assets/gallery/s8-cover.jpg";

const Pricing = () => {
  const navigate = useNavigate();

  const goCreate = (plan?: "subscription" | "single") => {
    if (plan) {
      try {
        const existing = JSON.parse(
          localStorage.getItem("torahtale_wizard_state") || "{}",
        );
        localStorage.setItem(
          "torahtale_wizard_state",
          JSON.stringify({ ...existing, planType: plan }),
        );
      } catch {
        localStorage.setItem(
          "torahtale_wizard_state",
          JSON.stringify({ planType: plan }),
        );
      }
    }
    navigate("/create");
  };

  const subscriptionFeatures = [
    "Personalized child as main character",
    "Weekly Parsha stories",
    "Holiday editions included",
    "Ongoing growing book collection",
    "Premium print quality, shipped to your door",
    "Cancel anytime",
  ];

  const singleFeatures = [
    "One personalized story",
    "Choose any Parsha or story",
    "Same premium print quality",
  ];

  const faqs = [
    {
      q: "Can I cancel anytime?",
      a: "Yes — your subscription is fully flexible. Cancel from your dashboard at any time, no questions asked.",
    },
    {
      q: "How often do I receive books?",
      a: "Subscribers receive 4 personalized books per month, aligned with the weekly Parsha and major Yomim Tovim.",
    },
    {
      q: "Can I choose specific stories?",
      a: "Yes. With a single book purchase you pick any Parsha or story. Subscribers get the weekly Parsha automatically and can request swaps anytime.",
    },
    {
      q: "Is this physical or digital?",
      a: "Every book is a physical, premium-printed hardcover or softcover, shipped directly to your door.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar onStart={() => goCreate()} transparentHero={false} />

      <main className="pt-24 lg:pt-28">
        {/* HERO */}
        <section className="container max-w-5xl text-center py-16 lg:py-24">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            Create Personalized Torah Books{" "}
            <span className="text-accent">Your Kids Will Love</span>
          </h1>
        </section>

        {/* PRICING CARDS */}
        <section className="container pb-16 lg:pb-24">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
            {/* CARD 2 — Single (rendered first on desktop left) */}
            <div className="order-2 lg:order-1 relative rounded-2xl border border-border bg-card p-8 flex flex-col shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Single Custom Book
                </h3>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">$29</span>
                  <span className="text-muted-foreground">–</span>
                  <span className="text-4xl font-bold text-foreground">$39</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  One-time purchase
                </p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {singleFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="lg"
                onClick={() => goCreate("single")}
                className="w-full"
              >
                Create One Book
              </Button>
            </div>

            {/* CARD 1 — Subscription PRIMARY */}
            <div className="order-1 lg:order-2 relative rounded-2xl border-2 border-accent bg-gradient-to-br from-primary to-primary/90 p-8 flex flex-col shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.6)] lg:scale-105 lg:-my-2">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground border-0 px-4 py-1 text-xs font-bold tracking-wide shadow-lg">
                <Crown className="w-3 h-3 mr-1" /> MOST POPULAR
              </Badge>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-accent" />
                <h3 className="font-display text-xl font-semibold text-primary-foreground">
                  Torah Journey Subscription
                </h3>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-primary-foreground/70">From</span>
                  <span className="text-5xl font-bold text-primary-foreground">
                    $9
                  </span>
                  <span className="text-primary-foreground/80">per book</span>
                </div>
                <p className="text-sm text-primary-foreground/70 mt-1">
                  Billed monthly • 4 books per month
                </p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {subscriptionFeatures.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-sm text-primary-foreground"
                  >
                    <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="gold"
                size="lg"
                onClick={() => goCreate("subscription")}
                className="w-full"
              >
                Start Subscription
              </Button>
            </div>

            {/* CARD 3 — Coming Soon */}
            <div className="order-3 relative rounded-2xl border border-dashed border-border bg-muted/30 p-8 flex flex-col">
              <Badge variant="outline" className="self-start mb-3">
                Coming Soon
              </Badge>
              <h3 className="font-display text-xl font-semibold text-foreground mb-1">
                Full Tanach Access
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Torah + Neviim + Kesuvim tracks
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 opacity-50" />
                  Complete personalized Tanach library
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 opacity-50" />
                  Deeper learning tracks per child
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 opacity-50" />
                  Priority shipping
                </li>
              </ul>
              <Button variant="ghost" size="lg" disabled className="w-full">
                Notify Me
              </Button>
            </div>
          </div>
        </section>

        {/* COLLECTION VISUAL */}
        <section className="py-16 lg:py-24 overflow-hidden">
          <div className="container max-w-5xl text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Build a Library That Grows With Them
            </h2>
            <p className="text-muted-foreground mt-3">
              Every month, a new book joins their personal Torah collection.
            </p>
          </div>
          <div className="relative">
            <div className="flex gap-5 overflow-x-auto px-6 pb-6 snap-x scrollbar-hide">
              {[
                "from-amber-100 to-amber-200",
                "from-blue-100 to-blue-200",
                "from-rose-100 to-rose-200",
                "from-emerald-100 to-emerald-200",
                "from-violet-100 to-violet-200",
                "from-orange-100 to-orange-200",
                "from-sky-100 to-sky-200",
                "from-pink-100 to-pink-200",
              ].map((grad, i) => (
                <div
                  key={i}
                  className={`shrink-0 snap-center w-44 h-60 rounded-lg bg-gradient-to-br ${grad} shadow-lg flex items-center justify-center border border-white/40`}
                >
                  <BookOpen className="w-10 h-10 text-foreground/40" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="container max-w-3xl py-16 lg:py-24">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-10">
            Questions? We've got answers.
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-semibold">
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
