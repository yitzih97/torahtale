import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Landmark, ScrollText, Scroll, Sparkles, HeartHandshake,
  Library, Check, Loader2, ArrowRight, type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

import imgChumash from "@/assets/collections/chumash.webp";
import imgNeviim from "@/assets/collections/neviim.webp";
import imgKesuvim from "@/assets/collections/kesuvim.webp";
import imgMegillos from "@/assets/collections/megillos.webp";
import imgYamimTovim from "@/assets/collections/yamim-tovim.webp";
import imgMiddos from "@/assets/collections/middos.webp";
import imgComplete from "@/assets/collections/complete.webp";

const ease = [0.16, 1, 0.3, 1] as const;

interface Collection {
  key: string;
  icon: LucideIcon;
  image: string;
  name: string;
  blurb: string;
  books: string;
  priceUsd: number;
  priceIls: number;
  featured?: boolean;
}

// Mock bundle catalog — front-end only for now (no live checkout). Requests are
// sent to the admin as messages so pricing/fulfilment can be handled by hand.
// Book counts match the story catalog (TorahPortions by category).
const COLLECTIONS: Collection[] = [
  { key: "chumash", icon: BookOpen, image: imgChumash, name: "The Chumash Collection", blurb: "Every weekly parsha across all five Chumashim — Bereishis through Devarim — a full year of personalized parsha storybooks.", books: "54 books", priceUsd: 349, priceIls: 1290 },
  { key: "neviim", icon: Landmark, image: imgNeviim, name: "The Nevi'im Collection", blurb: "The heroes and prophets of Tanach — Yehoshua, Shoftim, Shmuel, Melachim and more brought to life for your kinderlach.", books: "25 books", priceUsd: 179, priceIls: 660 },
  { key: "kesuvim", icon: ScrollText, image: imgKesuvim, name: "The Kesuvim Collection", blurb: "Timeless stories and lessons from the Writings — Tehillim, Mishlei, Daniel, Divrei HaYamim and beyond.", books: "21 books", priceUsd: 149, priceIls: 550 },
  { key: "megillos", icon: Scroll, image: imgMegillos, name: "The Megillos Collection", blurb: "All five Megillos — Esther, Rus, Shir HaShirim, Eicha and Koheles — one keepsake set.", books: "5 books", priceUsd: 49, priceIls: 180 },
  { key: "yamim-tovim", icon: Sparkles, image: imgYamimTovim, name: "The Yamim Tovim Collection", blurb: "A story for every Yom Tov — Rosh Hashanah, Yom Kippur, Sukkos, Chanukah, Purim, Pesach, Shavuos and more.", books: "15 books", priceUsd: 109, priceIls: 400 },
  { key: "middos", icon: HeartHandshake, image: imgMiddos, name: "The Middos Collection", blurb: "Character-building adventures — chesed, emes, kibud av va'em, savlanus and more middos tovos.", books: "10 books", priceUsd: 79, priceIls: 290 },
  { key: "complete", icon: Library, image: imgComplete, name: "The Complete Collection", blurb: "The ultimate library — every Chumash, Nevi'im, Kesuvim, Megillos, Yamim Tovim and Middos book, all starring your child. Our very best value.", books: "130 books", priceUsd: 799, priceIls: 2950, featured: true },
];

export const CollectionsSection = () => {
  const { t } = useLanguage();
  const { symbol, rate, code } = t.currency;
  const fmt = (usd: number, ils: number) =>
    code === "ILS" ? `${symbol}${ils.toLocaleString()}` : `${symbol}${Math.round(usd * rate).toLocaleString()}`;

  const [requesting, setRequesting] = useState<Collection | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const openRequest = (c: Collection) => {
    setRequesting(c);
    setSent(false);
    setForm({ name: "", email: "", phone: "", notes: "" });
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requesting) return;
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Please add your name and email so we can reach you.");
      return;
    }
    setSubmitting(true);
    const message =
      `Collection purchase request: ${requesting.name} (${requesting.books}, ~${fmt(requesting.priceUsd, requesting.priceIls)}).\n` +
      (form.phone.trim() ? `Phone: ${form.phone.trim()}\n` : "") +
      (form.notes.trim() ? `\nNotes: ${form.notes.trim()}` : "\nNo additional notes.");
    const { error } = await supabase.from("contact_tickets").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      subject: "collection",
      message,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Something went wrong — please try again or use the contact page.");
      return;
    }
    setSent(true);
    toast.success("Request sent! We'll be in touch shortly.");
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
                    onClick={() => openRequest(c)}
                  >
                    Request <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Prices are estimates. Request a collection and our team will confirm the details, pricing, and delivery with you personally.
        </p>
      </div>

      {/* Request-to-purchase dialog */}
      <Dialog open={!!requesting} onOpenChange={(v) => !v && setRequesting(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          {sent ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
                <Check className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-primary">Request received!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Thanks for your interest in <span className="font-medium text-foreground">{requesting?.name}</span>.
                Our team will reach out to {form.email || "you"} shortly to finalize the details.
              </p>
              <Button className="mt-6 rounded-xl" variant="outline" onClick={() => setRequesting(null)}>Close</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Request {requesting?.name}</DialogTitle>
              </DialogHeader>
              <p className="-mt-1 text-sm text-muted-foreground">
                {requesting?.books} · from {requesting ? fmt(requesting.priceUsd, requesting.priceIls) : ""}. Tell us how to reach you and
                we'll set up your collection personally.
              </p>
              <form onSubmit={submitRequest} className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="col-name" className="text-xs">Your name</Label>
                  <Input id="col-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="col-email" className="text-xs">Email</Label>
                    <Input id="col-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="col-phone" className="text-xs">Phone <span className="text-muted-foreground">(optional)</span></Label>
                    <Input id="col-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="col-notes" className="text-xs">Anything we should know? <span className="text-muted-foreground">(optional)</span></Label>
                  <Textarea id="col-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Child's name & age, which stories, gift date…" className="rounded-xl" />
                </div>
                <Button type="submit" variant="gold" disabled={submitting} className="w-full rounded-xl gap-2">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <>Send request</>}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
