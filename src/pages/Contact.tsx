import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Mail, MessageSquare, Clock, Send, Sparkles, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "general", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { t, language } = useLanguage();
  const isRtl = language === "he";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({ title: t.contact.fillAll, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contact_tickets").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject,
      message: form.message.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast({ title: t.contact.error, description: t.contact.errorDesc, variant: "destructive" });
    } else {
      setSent(true);
      setForm({ name: "", email: "", subject: "general", message: "" });
    }
  };

  const infoCards = [
    {
      icon: Mail,
      title: t.contact.emailDirectly,
      desc: "help@torahtale.com",
      link: "mailto:help@torahtale.com",
      gradient: "from-primary/20 to-primary/5",
      iconBg: "bg-primary/15 text-primary",
    },
    {
      icon: Clock,
      title: t.contact.responseTime,
      desc: t.contact.responseDesc,
      gradient: "from-accent/20 to-accent/5",
      iconBg: "bg-accent/15 text-accent",
    },
    {
      icon: MessageSquare,
      title: t.contact.faq,
      desc: t.contact.faqDesc,
      gradient: "from-primary/10 to-accent/10",
      iconBg: "bg-accent/15 text-accent",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isRtl ? "rtl" : "ltr"}>
      <Navbar />

      {/* Hero header with decorative elements */}
      <div className="relative overflow-hidden pt-28 pb-20">
        {/* Background decorative circles */}
        <div className="absolute top-20 -right-32 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-32 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        
        <div className="container max-w-6xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              {t.contact.label}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-5 leading-tight">
              {t.contact.title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t.contact.subtitle}
            </p>
          </motion.div>
        </div>
      </div>

      <main className="container max-w-6xl mx-auto px-6 pb-24 -mt-4">
        {/* Info cards row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid sm:grid-cols-3 gap-4 mb-16"
        >
          {infoCards.map((card, i) => (
            <div
              key={i}
              className={`group relative p-5 rounded-2xl bg-gradient-to-br ${card.gradient} border border-border/50 hover:border-border transition-all duration-300 hover:shadow-soft-md`}
            >
              <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center mb-3`}>
                <card.icon className="w-5 h-5" />
              </div>
              <p className="font-semibold text-foreground text-sm mb-1">{card.title}</p>
              {card.link ? (
                <a href={card.link} className="text-sm text-accent hover:underline font-medium">{card.desc}</a>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              )}
            </div>
          ))}
        </motion.div>

        {/* Main form area */}
        <div className="max-w-2xl mx-auto">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-6">
                <Send className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-3">{t.contact.sent}</h2>
              <p className="text-muted-foreground text-lg mb-8">{t.contact.sentDesc}</p>
              <Button
                variant="gold-outline"
                size="lg"
                className="rounded-full"
                onClick={() => setSent(false)}
              >
                {t.contact.send}
                <ArrowRight className="w-4 h-4 ms-2" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="p-8 md:p-10 rounded-3xl bg-card border border-border shadow-soft-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">{t.contact.fullName}</Label>
                      <Input
                        id="name"
                        placeholder={t.contact.namePlaceholder}
                        value={form.name}
                        onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                        maxLength={100}
                        className="h-12 rounded-xl bg-background border-border/60 focus:border-accent transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">{t.contact.emailAddress}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t.contact.emailPlaceholder}
                        value={form.email}
                        onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                        maxLength={255}
                        className="h-12 rounded-xl bg-background border-border/60 focus:border-accent transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium">{t.contact.subject}</Label>
                    <Select value={form.subject} onValueChange={(v) => setForm(p => ({ ...p, subject: v }))}>
                      <SelectTrigger className="h-12 rounded-xl bg-background border-border/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">{t.contact.subjects.general}</SelectItem>
                        <SelectItem value="order">{t.contact.subjects.order}</SelectItem>
                        <SelectItem value="technical">{t.contact.subjects.technical}</SelectItem>
                        <SelectItem value="feedback">{t.contact.subjects.feedback}</SelectItem>
                        <SelectItem value="partnership">{t.contact.subjects.partnership}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium">{t.contact.message}</Label>
                    <Textarea
                      id="message"
                      placeholder={t.contact.messagePlaceholder}
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                      maxLength={2000}
                      className="rounded-xl bg-background border-border/60 focus:border-accent transition-colors resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="gold"
                    size="lg"
                    disabled={submitting}
                    className="w-full rounded-xl h-13 text-base"
                  >
                    <Send className="w-4 h-4 me-2" />
                    {submitting ? t.contact.sending : t.contact.send}
                  </Button>
                </form>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-5">
                help@torahtale.com
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
