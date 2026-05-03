import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Sparkles, BookOpen } from "lucide-react";
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
  const [selected, setSelected] = useState<"single" | "torah" | "tanach">("torah");

  const goCreate = (plan?: "subscription" | "single") => {
    if (plan) {
      // Start a fresh wizard run when entering from pricing so users always
      // go through name → age → photo/description before the order summary,
      // even if they have a stale persisted step from a previous session.
      try {
        localStorage.removeItem("torahtale_wizard_state");
      } catch { /* ignore */ }
      localStorage.setItem(
        "torahtale_wizard_state",
        JSON.stringify({
          planType: plan,
          step: plan === "subscription" ? 0 : 1,
          bookOptionsChosenEarly: plan === "subscription",
        }),
      );
    }
    navigate("/create");
  };

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
      a: "Every book is a physical, premium-printed hardcover, softcover, or board book, shipped directly to your door.",
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
                  Single Book
                </h3>
              </div>
              <div className="mb-8">
                <div className={`text-5xl font-bold ${selected === "single" ? "text-primary-foreground" : "text-foreground"}`}>$22</div>
                <p className={`text-sm mt-1 ${selected === "single" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>One-time purchase</p>
              </div>
              <ul className="space-y-3 mb-10 flex-1"></ul>
              <Button variant={selected === "single" ? "gold" : "outline"} size="lg" onClick={(e) => { e.stopPropagation(); goCreate("single"); }} className="w-full">
                Create Book
              </Button>
            </div>

            {/* CARD 2 — Subscription PRIMARY */}
            <div
              onClick={() => setSelected("torah")}
              className={`order-1 lg:order-2 relative rounded-2xl border-2 p-8 flex flex-col transition-all cursor-pointer lg:scale-105 lg:-my-2 ${
                selected === "torah"
                  ? "border-accent bg-gradient-to-br from-primary to-primary/90 shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.6)]"
                  : "border-border bg-card shadow-sm hover:shadow-md"
              }`}
            >
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground border-0 px-4 py-1 text-xs font-bold tracking-wide shadow-lg">
                <Crown className="w-3 h-3 mr-1" /> MOST POPULAR
              </Badge>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-accent" />
                <h3 className={`font-display text-xl font-semibold ${selected === "torah" ? "text-primary-foreground" : "text-foreground"}`}>
                  Torah Series
                </h3>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-bold ${selected === "torah" ? "text-primary-foreground" : "text-foreground"}`}>$36</span>
                  <span className={selected === "torah" ? "text-primary-foreground/80" : "text-muted-foreground"}>/month</span>
                </div>
                <p className={`text-sm mt-1 ${selected === "torah" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  $9 per book • 4 books per month
                </p>
              </div>
              <ul className="space-y-3 mb-10 flex-1">
                <li className={`flex items-center gap-3 text-sm ${selected === "torah" ? "text-primary-foreground" : "text-foreground"}`}>
                  <Check className="w-4 h-4 text-accent shrink-0" /> Weekly Parsha + Holidays
                </li>
              </ul>
              <Button variant={selected === "torah" ? "gold" : "outline"} size="lg" onClick={(e) => { e.stopPropagation(); goCreate("subscription"); }} className="w-full">
                Start Subscription
              </Button>
            </div>

            {/* CARD 3 — Full Access */}
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
                  Tanach Series
                </h3>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-bold ${selected === "tanach" ? "text-primary-foreground" : "text-foreground"}`}>$49</span>
                  <span className={selected === "tanach" ? "text-primary-foreground/80" : "text-muted-foreground"}>/month</span>
                </div>
                <p className={`text-sm mt-1 ${selected === "tanach" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  All of Torah, Neviim, Kesuvim
                </p>
              </div>
              <ul className="space-y-3 mb-10 flex-1"></ul>
              <Button variant={selected === "tanach" ? "gold" : "outline"} size="lg" onClick={(e) => { e.stopPropagation(); goCreate("subscription"); }} className="w-full">
                Start Subscription
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
              {[cover1, cover2, cover3, cover4, cover5, cover6, cover7, cover8].map((src, i) => (
                <div
                  key={i}
                  className="shrink-0 snap-center w-44 h-60 rounded-lg overflow-hidden shadow-lg border border-border bg-card"
                >
                  <img
                    src={src}
                    alt={`Personalized Torah book cover ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
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
