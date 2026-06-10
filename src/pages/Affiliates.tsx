import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles,
  UserPlus,
  Link2,
  Share2,
  Wallet,
  CheckCircle2,
  TrendingUp,
  Gift,
  Users,
} from "lucide-react";

const schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  audience: z.string().trim().min(2, "Tell us where you'll share").max(500),
  payout_email: z.string().trim().email("Invalid PayPal / payout email").max(255),
  social_link: z.string().trim().max(300).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

const content = {
  en: {
    badge: "Affiliate Program",
    title: "Share Torah Tale. Earn Real Money.",
    subtitle:
      "Join our affiliate family and earn a generous commission on every personalized sefer ordered through your link.",
    perksTitle: "Why partner with Torah Tale",
    perks: [
      { icon: TrendingUp, title: "Market-leading commission", desc: "Industry-competitive payout on every order — recurring on subscriptions." },
      { icon: Gift, title: "30-day cookie window", desc: "You get credit even if they buy days after clicking your link." },
      { icon: Users, title: "A product families love", desc: "High conversion — frum parents are searching for exactly this." },
    ],
    stepsTitle: "How it works — start earning in 4 steps",
    steps: [
      { icon: UserPlus, title: "Apply below", desc: "Fill out the short form. We review every application within 1–2 business days." },
      { icon: Link2, title: "Get your unique link", desc: "Once approved, we email you a personal referral link and a dashboard login." },
      { icon: Share2, title: "Share with your community", desc: "Post it on WhatsApp groups, social media, blogs, school newsletters — wherever families gather." },
      { icon: Wallet, title: "Get paid monthly", desc: "Track your clicks and sales in real time. We pay out every month via PayPal or bank transfer." },
    ],
    formTitle: "Apply to become an affiliate",
    formSubtitle: "Tell us about you — approval usually takes 1–2 business days.",
    fields: {
      full_name: "Full Name",
      email: "Email",
      phone: "Phone (optional)",
      audience: "Where will you share Torah Tale?",
      audiencePh: "e.g. WhatsApp groups of frum mothers, my Instagram (5k), our school newsletter…",
      payout_email: "Payout Email (PayPal / Zelle)",
      social_link: "Website or Social Profile (optional)",
      message: "Anything else we should know? (optional)",
      submit: "Submit Application",
      submitting: "Submitting…",
    },
    successTitle: "Application received!",
    successDesc: "We'll review and email you within 1–2 business days.",
    faqTitle: "Quick answers",
    faqs: [
      { q: "How much can I earn?", a: "Our commission rate is market-leading and disclosed in your welcome email after approval. Top affiliates earn hundreds to thousands of dollars per month." },
      { q: "When do I get paid?", a: "Payouts go out monthly for all commissions older than 30 days (to cover refund windows)." },
      { q: "Who can apply?", a: "Anyone with a relevant audience — bloggers, content creators, school administrators, community askanim, rebbetzins, and parents." },
      { q: "How do I track sales?", a: "After approval you'll get a private dashboard showing clicks, signups, and commissions in real time." },
    ],
  },
  he: {
    badge: "תוכנית שותפים",
    title: "שתפו את תורה טייל. הרוויחו כסף אמיתי.",
    subtitle: "הצטרפו למשפחת השותפים שלנו והרוויחו עמלה נדיבה על כל ספר שמוזמן דרך הקישור האישי שלכם.",
    perksTitle: "למה להיות שותפים שלנו",
    perks: [
      { icon: TrendingUp, title: "עמלה מובילה בשוק", desc: "תשלום תחרותי על כל הזמנה — חוזר על מנויים." },
      { icon: Gift, title: "חלון מעקב של 30 יום", desc: "תקבלו קרדיט גם אם הלקוח קונה ימים אחרי הקליק." },
      { icon: Users, title: "מוצר שמשפחות אוהבות", desc: "המרה גבוהה — הורים חרדים מחפשים בדיוק את זה." },
    ],
    stepsTitle: "איך זה עובד — מתחילים להרוויח ב-4 שלבים",
    steps: [
      { icon: UserPlus, title: "מלאו את הטופס", desc: "אנחנו בודקים כל בקשה תוך 1–2 ימי עסקים." },
      { icon: Link2, title: "קבלו קישור אישי", desc: "לאחר אישור, נשלח אליכם קישור הפניה ייחודי וגישה לדאשבורד." },
      { icon: Share2, title: "שתפו עם הקהילה", desc: "וואטסאפ, רשתות חברתיות, בלוגים, עלוני בית ספר — בכל מקום." },
      { icon: Wallet, title: "תשלום חודשי", desc: "מעקב בזמן אמת. תשלום חודשי דרך PayPal או העברה בנקאית." },
    ],
    formTitle: "הגישו בקשה להיות שותפים",
    formSubtitle: "ספרו לנו על עצמכם — אישור בדרך כלל תוך 1–2 ימי עסקים.",
    fields: {
      full_name: "שם מלא",
      email: "אימייל",
      phone: "טלפון (אופציונלי)",
      audience: "איפה תשתפו את תורה טייל?",
      audiencePh: "לדוגמה: קבוצות וואטסאפ של אמהות, אינסטגרם שלי, עלון בית הספר…",
      payout_email: "אימייל לתשלום (PayPal)",
      social_link: "אתר או פרופיל חברתי (אופציונלי)",
      message: "משהו נוסף שכדאי לדעת? (אופציונלי)",
      submit: "שליחת בקשה",
      submitting: "שולח…",
    },
    successTitle: "הבקשה התקבלה!",
    successDesc: "נבדוק ונחזור אליכם תוך 1–2 ימי עסקים.",
    faqTitle: "תשובות מהירות",
    faqs: [
      { q: "כמה אפשר להרוויח?", a: "העמלה שלנו מובילה בשוק ומפורטת במייל הקבלה לאחר אישור. שותפים מובילים מרוויחים מאות עד אלפי דולרים בחודש." },
      { q: "מתי משלמים?", a: "תשלום חודשי על כל עמלה ישנה מ-30 יום." },
      { q: "מי יכול להגיש בקשה?", a: "כל מי שיש לו קהל רלוונטי — בלוגרים, יוצרי תוכן, מנהלי בתי ספר, אסקנים, רבניות והורים." },
      { q: "איך עוקבים אחר מכירות?", a: "לאחר אישור תקבלו דאשבורד פרטי עם נתונים בזמן אמת." },
    ],
  },
};

const Affiliates = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const c = content[lang === "he" || lang === "yi" ? "he" : "en"];

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    audience: "",
    payout_email: "",
    social_link: "",
    message: "",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Please check the form", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("affiliate_applications").insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      audience: parsed.data.audience,
      payout_email: parsed.data.payout_email,
      social_link: parsed.data.social_link || null,
      message: parsed.data.message || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
      return;
    }
    setSuccess(true);
    toast({ title: c.successTitle, description: c.successDesc });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Affiliate Program — Earn With Torah Tale"
        description="Join the Torah Tale affiliate program. Share personalized Torah storybooks with frum families and earn a market-leading commission on every order."
        path="/affiliates"
      />
      <Navbar onStart={() => navigate("/pricing")} transparentHero={false} />

      <main className="pt-28 lg:pt-32 pb-20">
        {/* Hero */}
        <section className="container max-w-5xl text-center px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-[hsl(var(--gold)/0.3)] text-xs font-semibold tracking-widest text-accent uppercase mb-6">
            <Sparkles className="w-3.5 h-3.5" /> {c.badge}
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] text-foreground mb-5">
            {c.title}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {c.subtitle}
          </p>
        </section>

        {/* Perks */}
        <section className="container max-w-6xl mt-20 px-4">
          <h2 className="font-serif text-2xl sm:text-3xl text-center mb-10 text-foreground">{c.perksTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {c.perks.map((p, i) => (
              <Card key={i} className="glass p-7 hover-lift border-[hsl(var(--gold)/0.15)]">
                <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center mb-5">
                  <p.icon className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="font-serif text-xl text-foreground mb-2">{p.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="container max-w-5xl mt-24 px-4">
          <h2 className="font-serif text-2xl sm:text-3xl text-center mb-12 text-foreground">{c.stepsTitle}</h2>
          <div className="space-y-5">
            {c.steps.map((s, i) => (
              <div key={i} className="glass rounded-2xl p-6 sm:p-7 flex items-start gap-5 border border-[hsl(var(--gold)/0.12)] hover-lift">
                <div className="flex-shrink-0 relative">
                  <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center">
                    <s.icon className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <span className="absolute -top-2 -end-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md">
                    {i + 1}
                  </span>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-serif text-xl text-foreground mb-1.5">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Form */}
        <section id="apply" className="container max-w-2xl mt-24 px-4">
          <Card className="glass p-7 sm:p-10 border-[hsl(var(--gold)/0.2)]">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-full gold-gradient flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-8 h-8 text-accent-foreground" />
                </div>
                <h2 className="font-serif text-2xl text-foreground mb-2">{c.successTitle}</h2>
                <p className="text-muted-foreground">{c.successDesc}</p>
              </div>
            ) : (
              <>
                <div className="mb-7 text-center">
                  <h2 className="font-serif text-2xl sm:text-3xl text-foreground mb-2">{c.formTitle}</h2>
                  <p className="text-sm text-muted-foreground">{c.formSubtitle}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">{c.fields.full_name}</Label>
                      <Input id="full_name" required value={form.full_name} onChange={update("full_name")} maxLength={100} />
                    </div>
                    <div>
                      <Label htmlFor="email">{c.fields.email}</Label>
                      <Input id="email" type="email" required value={form.email} onChange={update("email")} maxLength={255} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">{c.fields.phone}</Label>
                      <Input id="phone" value={form.phone} onChange={update("phone")} maxLength={40} />
                    </div>
                    <div>
                      <Label htmlFor="payout_email">{c.fields.payout_email}</Label>
                      <Input id="payout_email" type="email" required value={form.payout_email} onChange={update("payout_email")} maxLength={255} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="social_link">{c.fields.social_link}</Label>
                    <Input id="social_link" value={form.social_link} onChange={update("social_link")} maxLength={300} />
                  </div>
                  <div>
                    <Label htmlFor="audience">{c.fields.audience}</Label>
                    <Textarea id="audience" required value={form.audience} onChange={update("audience")} maxLength={500} placeholder={c.fields.audiencePh} rows={3} />
                  </div>
                  <div>
                    <Label htmlFor="message">{c.fields.message}</Label>
                    <Textarea id="message" value={form.message} onChange={update("message")} maxLength={1000} rows={3} />
                  </div>
                  <Button type="submit" variant="gold" size="lg" className="w-full rounded-full mt-2" disabled={submitting}>
                    {submitting ? c.fields.submitting : c.fields.submit}
                  </Button>
                </form>
              </>
            )}
          </Card>
        </section>

        {/* FAQ */}
        <section className="container max-w-3xl mt-24 px-4">
          <h2 className="font-serif text-2xl sm:text-3xl text-center mb-10 text-foreground">{c.faqTitle}</h2>
          <div className="space-y-4">
            {c.faqs.map((f, i) => (
              <div key={i} className="glass rounded-xl p-6 border border-[hsl(var(--gold)/0.1)]">
                <h3 className="font-semibold text-foreground mb-2">{f.q}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Affiliates;
