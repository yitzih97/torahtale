import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { COLLECTIONS, type Collection } from "@/data/collections";

const ease = [0.16, 1, 0.3, 1] as const;

export const CollectionsSection = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { symbol, rate, code } = t.currency;
  const fmt = (usd: number, ils: number) =>
    code === "ILS" ? `${symbol}${ils.toLocaleString()}` : `${symbol}${Math.round(usd * rate).toLocaleString()}`;

  // Requesting a collection opens the creation wizard in collection mode
  // (story selection + payment skipped — the request goes to the admin inbox).
  // Signed-in users only, so the request is tied to a reachable account.
  const requestCollection = (c: Collection) => {
    const target = `/create?collection=${c.key}`;
    try { localStorage.removeItem("torahtale_wizard_state"); } catch { /* ignore */ }
    if (!user) {
      toast.info("Please sign in to request a collection.");
      navigate(`/auth?next=${encodeURIComponent(target)}`);
      return;
    }
    navigate(target);
  };

  return (
    <section id="collections" className="relative py-20 md:py-28 bg-secondary/40 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(circle_at_20%_10%,hsl(42_78%_70%/0.18),transparent_45%),radial-gradient(circle_at_85%_90%,hsl(42_60%_60%/0.12),transparent_45%)]" />
      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <p className="text-accent font-semibold tracking-[0.15em] uppercase text-xs mb-4">Collections</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Build a whole library, not just one book
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Get a curated bundle of personalized storybooks — the whole Chumash, all of Nevi'im, or the complete Tanach —
            starring your child. Request a collection and we'll set it all up for you.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease, delay: i * 0.05 }}
                className={`group relative flex flex-col rounded-3xl border p-6 shadow-soft-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg ${
                  c.featured
                    ? "border-accent/50 bg-gradient-to-br from-accent/10 to-card ring-1 ring-accent/20 sm:col-span-2 lg:col-span-1"
                    : "border-border bg-card"
                }`}
              >
                {c.featured && (
                  <span className="absolute -top-3 right-5 z-10 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-accent-foreground shadow-soft-sm">
                    Best value
                  </span>
                )}
                {/* Generated collection image (Higgsfield), full-bleed card header */}
                <div className="relative -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-3xl">
                  <img src={c.image} alt={c.name} loading="lazy" className="h-44 w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
                  <div className="absolute bottom-2.5 left-3 flex h-9 w-9 items-center justify-center rounded-xl bg-card/95 text-accent shadow-soft-sm backdrop-blur">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="font-display text-lg font-bold text-primary">{c.name}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-accent">{c.books}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{c.blurb}</p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-muted-foreground">from</span>
                    <p className="font-display text-2xl font-bold text-primary leading-none">{fmt(c.priceUsd, c.priceIls)}</p>
                  </div>
                  <Button
                    variant={c.featured ? "gold" : "outline"}
                    size="sm"
                    className="rounded-xl gap-1.5"
                    onClick={() => requestCollection(c)}
                  >
                    Request <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Prices are estimates. Request a collection and our team will confirm the details, pricing, and delivery with you personally —
          we'll send an invoice, and your books are generated once payment is received.
        </p>
      </div>
    </section>
  );
};
