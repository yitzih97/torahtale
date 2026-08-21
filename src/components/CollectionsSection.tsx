import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Loader2, Plus, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/SectionHeading";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  COLLECTIONS,
  collectionBlurb,
  collectionBooksLabel,
  collectionName,
  PART_COLLECTIONS,
  canCheckoutCollections,
  collectionsBookCount,
  collectionsTotal,
  completeSaving,
  getCollection,
  type Collection,
} from "@/data/collections";
import { createCollectionCheckout } from "@/lib/shopify";

const ease = [0.16, 1, 0.3, 1] as const;

// Featured (the all-in-one) sits third so it lands in the middle of the top row.
const orderedCollections: Collection[] = (() => {
  const featured = COLLECTIONS.find((c) => c.featured);
  const rest = COLLECTIONS.filter((c) => !c.featured);
  return featured ? [rest[0], rest[1], featured, ...rest.slice(2)] : COLLECTIONS;
})();

const PART_KEYS = PART_COLLECTIONS.map((c) => c.key);

export const CollectionsSection = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const { symbol, code } = t.currency;
  const isIls = code === "ILS";
  const fmt = (n: number) => `${symbol}${Math.round(n).toLocaleString()}`;
  const price = (c: Collection) => (isIls ? c.priceIls : c.priceUsd);

  const toggle = (key: string) =>
    setPicked((prev) => {
      // "Complete" contains every other collection, so the two can never be in
      // the same basket — choosing one clears the other rather than quietly
      // charging twice for the same books.
      if (key === "complete") return prev.includes("complete") ? [] : ["complete"];
      const without = prev.filter((k) => k !== "complete");
      return without.includes(key) ? without.filter((k) => k !== key) : [...without, key];
    });

  const total = useMemo(() => collectionsTotal(picked, isIls), [picked, isIls]);
  const books = useMemo(() => collectionsBookCount(picked), [picked]);

  // Selecting every part costs more than the all-in-one. Say so and offer the
  // swap instead of taking the larger payment.
  const partsOnly = picked.length > 0 && !picked.includes("complete");
  const hasAllParts = partsOnly && PART_KEYS.every((k) => picked.includes(k));
  const saving = completeSaving(isIls);

  const requestSelection = (keys: string[]) => {
    const target = `/create?collection=${keys.join(",")}`;
    try { localStorage.removeItem("torahtale_wizard_state"); } catch { /* ignore */ }
    if (!user) {
      toast.info(t.collectionRequest.signInToRequest);
      navigate(`/auth?next=${encodeURIComponent(target)}`);
      return;
    }
    navigate(target);
  };

  /**
   * Buy the selection outright when every collection in it has a Shopify variant
   * to charge for; otherwise hand it to the existing request flow, which reaches
   * the admin inbox. Same button either way — see COLLECTION_VARIANT_IDS.
   */
  const checkout = async () => {
    if (!picked.length || busy) return;
    if (!canCheckoutCollections(picked)) { requestSelection(picked); return; }
    if (!user) {
      toast.info(t.collectionRequest.signInToBuy);
      navigate(`/auth?next=${encodeURIComponent("/pricing#collections")}`);
      return;
    }
    setBusy(true);
    try {
      const res = await createCollectionCheckout({ keys: picked });
      if (!res) { toast.error("Couldn't open checkout — please try again."); return; }
      window.location.href = res.checkoutUrl;
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="collections" className="relative pt-6 pb-14 md:pb-16 overflow-hidden [@media(max-height:820px)]:pt-4">
      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
          className="mb-5 [@media(max-height:820px)]:mb-3"
        >
          <SectionHeading>{t.pricing.collectionsEyebrow}</SectionHeading>
        </motion.div>

        {/* Image-forward tiles: the artwork is the sell, so it fills a fixed
            1:1 card — same square on a phone as on a desktop — and everything
            else is set over it. */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {orderedCollections.map((c, i) => {
            const Icon = c.icon;
            const on = picked.includes(c.key);
            return (
              <motion.button
                key={c.key}
                type="button"
                onClick={() => toggle(c.key)}
                aria-pressed={on}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease, delay: i * 0.05 }}
                className={`group relative aspect-square overflow-hidden rounded-3xl border text-start shadow-soft-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg ${
                  on
                    ? "border-accent ring-2 ring-accent/30"
                    : c.featured
                      ? "border-accent/40"
                      : "border-border/70"
                }`}
              >
                <img
                  src={c.image}
                  alt={collectionName(c, lang)}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/95 via-midnight/55 to-transparent" />

                {c.featured && !on && (
                  <span className="absolute top-3 end-3 z-20 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-accent-foreground shadow-soft-sm">
                    {t.pricing.collBestValue}
                  </span>
                )}
                <span
                  className={`absolute top-3 start-3 z-20 flex h-9 w-9 items-center justify-center rounded-full shadow-soft-sm transition-colors ${
                    on ? "bg-accent text-accent-foreground" : "bg-card/90 text-primary backdrop-blur"
                  }`}
                  aria-hidden
                >
                  {on ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
                <div className="absolute inset-x-0 bottom-0 z-10 p-5">
                  <h3 className="font-display text-xl font-bold leading-tight text-white drop-shadow-sm">
                    {collectionName(c, lang)}
                  </h3>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-light">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {collectionBooksLabel(c, lang)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-parchment/85">
                    {collectionBlurb(c, lang)}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="font-display text-2xl font-bold leading-none text-white">{fmt(price(c))}</p>
                    <span
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur transition-colors ${
                        on
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-white/40 bg-white/10 text-white group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground"
                      }`}
                    >
                      {on ? t.pricing.collAdded : t.pricing.collAdd}
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Bundle summary — the running basket, in the same card language as the
            plans above so the page reads as one purchase decision. */}
        <motion.div
          initial={false}
          animate={{ opacity: picked.length ? 1 : 0.65 }}
          className="mt-8 rounded-3xl border-2 border-border bg-card p-5 shadow-soft-sm sm:p-6"
        >
          {picked.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              {t.pricing.collEmpty}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {picked.map((k) => {
                  const c = getCollection(k);
                  if (!c) return null;
                  return (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 py-1 ps-3 pe-1.5 text-xs font-medium text-primary"
                    >
                      {collectionName(c, lang)}
                      <button
                        type="button"
                        onClick={() => toggle(k)}
                        aria-label={t.pricing.collRemove(collectionName(c, lang))}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-accent/20 hover:text-primary"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>

              {hasAllParts && saving > 0 && (
                <button
                  type="button"
                  onClick={() => setPicked(["complete"])}
                  className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-accent/40 bg-accent/5 px-4 py-3 text-start transition-colors hover:border-accent"
                >
                  <span className="text-sm text-primary">
                    <span className="font-semibold">{t.pricing.collSwapTitle}</span>{" "}
                    <span className="text-muted-foreground">{t.pricing.collSwapSave(fmt(saving))}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-accent" />
                </button>
              )}

              <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t.pricing.collSummary(picked.length, books)}
                  </p>
                  <p className="font-display text-3xl font-bold leading-none text-primary">{fmt(total)}</p>
                </div>
                <Button
                  variant="gold"
                  size="lg"
                  className="gap-2 rounded-full px-7"
                  onClick={() => void checkout()}
                  disabled={busy}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                  {canCheckoutCollections(picked) ? t.pricing.collCheckout : t.pricing.collRequest}
                </Button>
              </div>
            </>
          )}
        </motion.div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t.pricing.collFootnote}
        </p>
      </div>
    </section>
  );
};
