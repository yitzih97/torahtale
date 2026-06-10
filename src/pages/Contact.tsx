import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Mail, Clock, MessageSquare, Send, CheckCircle2, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { SEO } from "@/components/SEO";

const floatingOrb = (delay: number, x: string, y: string, size: string, color: string) => (
  <motion.div
    className={`absolute ${x} ${y} ${size} rounded-full ${color} blur-[100px] pointer-events-none`}
    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "general", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { t, lang, dir } = useLanguage();
  const isRtl = (lang === "he" || lang === "yi");
  const formRef = useRef<HTMLFormElement>(null);

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

  const fieldVariants = {
    idle: { scale: 1, boxShadow: "0 0 0 0px hsl(var(--accent) / 0)" },
    focused: { scale: 1.01, boxShadow: "0 0 0 3px hsl(var(--accent) / 0.15)" },
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <Navbar transparentHero={false} />

      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {floatingOrb(0, "-left-40", "top-1/4", "w-[500px] h-[500px]", "bg-accent/20")}
        {floatingOrb(3, "-right-40", "top-1/3", "w-[400px] h-[400px]", "bg-primary/15")}
        {floatingOrb(5, "left-1/3", "bottom-0", "w-[600px] h-[300px]", "bg-accent/10")}
      </div>

      {/* Hero */}
      <section className="relative pt-36 pb-8 md:pt-44 md:pb-12">
        <div className="container max-w-4xl mx-auto px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-accent font-semibold tracking-[0.15em] uppercase text-xs mb-5"
          >
            {t.contact.label}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-display font-bold text-foreground tracking-tight leading-[1.05]"
          >
            {t.contact.title}
            <span className="text-accent">.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed font-light"
          >
            {t.contact.subtitle}
          </motion.p>
        </div>
      </section>

      {/* Info pills */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.35 }}
        className="container max-w-3xl mx-auto px-6 mb-16"
      >
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {[
            { icon: Mail, text: "help@torahtale.com", href: "mailto:help@torahtale.com" },
            { icon: Clock, text: t.contact.responseDesc },
            { icon: MessageSquare, text: t.contact.faq, href: "/faq" },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -2, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)] cursor-default"
            >
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-accent" />
              </div>
              {item.href ? (
                <a href={item.href} className="text-sm text-foreground hover:text-accent transition-colors font-medium">
                  {item.text}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground leading-snug">{item.text}</span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Form */}
      <section className="container max-w-2xl mx-auto px-6 pb-32 relative z-10">
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center py-20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto mb-8 shadow-[0_0_60px_hsl(var(--accent)/0.2)]"
              >
                <CheckCircle2 className="w-10 h-10 text-accent" />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">{t.contact.sent}</h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto">{t.contact.sentDesc}</p>
              <Button
                variant="gold"
                size="lg"
                className="rounded-full px-10 h-14 text-base"
                onClick={() => setSent(false)}
              >
                {t.contact.send}
                <ArrowRight className="w-4 h-4 ms-2" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Glass card */}
              <div className="p-8 md:p-12 rounded-[2rem] bg-card/60 backdrop-blur-2xl border border-border/30 shadow-[0_8px_60px_-12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.1)_inset]">
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-7">
                  {/* Name & Email */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    {[
                      { id: "name", label: t.contact.fullName, placeholder: t.contact.namePlaceholder, type: "text", value: form.name, key: "name" as const },
                      { id: "email", label: t.contact.emailAddress, placeholder: t.contact.emailPlaceholder, type: "email", value: form.email, key: "email" as const },
                    ].map((field) => (
                      <motion.div
                        key={field.id}
                        variants={fieldVariants}
                        animate={focusedField === field.id ? "focused" : "idle"}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="space-y-2.5 rounded-2xl"
                      >
                        <Label htmlFor={field.id} className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                          {field.label}
                        </Label>
                        <Input
                          id={field.id}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={field.value}
                          onChange={(e) => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                          onFocus={() => setFocusedField(field.id)}
                          onBlur={() => setFocusedField(null)}
                          maxLength={field.key === "email" ? 255 : 100}
                          className="h-13 rounded-xl bg-background/80 border-border/40 text-base placeholder:text-muted-foreground/50 transition-all duration-300 focus-visible:ring-accent/20 focus-visible:border-accent/40"
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Subject */}
                  <motion.div
                    variants={fieldVariants}
                    animate={focusedField === "subject" ? "focused" : "idle"}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="space-y-2.5 rounded-2xl"
                  >
                    <Label htmlFor="subject" className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                      {t.contact.subject}
                    </Label>
                    <Select value={form.subject} onValueChange={(v) => setForm(p => ({ ...p, subject: v }))}>
                      <SelectTrigger
                        className="h-13 rounded-xl bg-background/80 border-border/40 text-base transition-all duration-300"
                        onFocus={() => setFocusedField("subject")}
                        onBlur={() => setFocusedField(null)}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/40">
                        <SelectItem value="general">{t.contact.subjects.general}</SelectItem>
                        <SelectItem value="order">{t.contact.subjects.order}</SelectItem>
                        <SelectItem value="technical">{t.contact.subjects.technical}</SelectItem>
                        <SelectItem value="feedback">{t.contact.subjects.feedback}</SelectItem>
                        <SelectItem value="partnership">{t.contact.subjects.partnership}</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  {/* Message */}
                  <motion.div
                    variants={fieldVariants}
                    animate={focusedField === "message" ? "focused" : "idle"}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="space-y-2.5 rounded-2xl"
                  >
                    <Label htmlFor="message" className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                      {t.contact.message}
                    </Label>
                    <Textarea
                      id="message"
                      placeholder={t.contact.messagePlaceholder}
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                      onFocus={() => setFocusedField("message")}
                      onBlur={() => setFocusedField(null)}
                      maxLength={2000}
                      className="rounded-xl bg-background/80 border-border/40 text-base placeholder:text-muted-foreground/50 transition-all duration-300 focus-visible:ring-accent/20 focus-visible:border-accent/40 resize-none min-h-[140px]"
                    />
                  </motion.div>

                  {/* Submit */}
                  <motion.div
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Button
                      type="submit"
                      variant="gold"
                      disabled={submitting}
                      className="w-full h-14 rounded-2xl text-base font-semibold tracking-wide shadow-[0_0_30px_hsl(var(--accent)/0.25)] hover:shadow-[0_0_50px_hsl(var(--accent)/0.35)] transition-shadow duration-500"
                    >
                      {submitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full"
                        />
                      ) : (
                        <>
                          <Send className="w-4 h-4 me-2" />
                          {t.contact.send}
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </div>

              {/* Subtle reflection */}
              <div className="mt-3 mx-8 h-12 rounded-b-3xl bg-gradient-to-b from-card/20 to-transparent blur-sm" />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
