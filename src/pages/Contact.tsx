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
import { Mail, MessageSquare, Clock, Send } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "general", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLanguage();

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
      toast({ title: t.contact.sent, description: t.contact.sentDesc });
      setForm({ name: "", email: "", subject: "general", message: "" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <header className="pt-28 pb-12 border-b border-border bg-muted/30">
        <div className="container max-w-6xl mx-auto px-6">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-3">{t.contact.label}</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">{t.contact.title}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">{t.contact.subtitle}</p>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-5 gap-16">
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t.contact.fullName}</Label>
                  <Input id="name" placeholder={t.contact.namePlaceholder} value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t.contact.emailAddress}</Label>
                  <Input id="email" type="email" placeholder={t.contact.emailPlaceholder} value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} maxLength={255} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">{t.contact.subject}</Label>
                <Select value={form.subject} onValueChange={(v) => setForm(p => ({ ...p, subject: v }))}>
                  <SelectTrigger>
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
                <Label htmlFor="message">{t.contact.message}</Label>
                <Textarea id="message" placeholder={t.contact.messagePlaceholder} rows={6} value={form.message} onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))} maxLength={2000} />
              </div>

              <Button type="submit" variant="gold" size="lg" disabled={submitting} className="rounded-full px-8">
                <Send className="w-4 h-4 mr-2" />
                {submitting ? t.contact.sending : t.contact.send}
              </Button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="p-6 rounded-2xl bg-muted/40 border border-border space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t.contact.emailDirectly}</p>
                  <a href="mailto:help@torahtale.com" className="text-sm text-accent hover:underline">help@torahtale.com</a>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-muted/40 border border-border space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t.contact.responseTime}</p>
                  <p className="text-sm text-muted-foreground">{t.contact.responseDesc}</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-muted/40 border border-border space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t.contact.faq}</p>
                  <p className="text-sm text-muted-foreground">{t.contact.faqDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
