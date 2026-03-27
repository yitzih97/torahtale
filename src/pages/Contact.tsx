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

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "general", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
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
      toast({ title: "Something went wrong", description: "Please try again or email us directly.", variant: "destructive" });
    } else {
      toast({ title: "Message sent!", description: "We'll get back to you within 24–48 hours." });
      setForm({ name: "", email: "", subject: "general", message: "" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <header className="pt-28 pb-12 border-b border-border bg-muted/30">
        <div className="container max-w-6xl mx-auto px-6">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-3">Support</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">Have a question, issue with an order, or just want to say hi? We'd love to hear from you.</p>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-5 gap-16">
          {/* Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Your name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} maxLength={255} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={form.subject} onValueChange={(v) => setForm(p => ({ ...p, subject: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Question</SelectItem>
                    <SelectItem value="order">Order Issue</SelectItem>
                    <SelectItem value="technical">Technical Support</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="partnership">Partnership Inquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Tell us how we can help..." rows={6} value={form.message} onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))} maxLength={2000} />
              </div>

              <Button type="submit" variant="gold" size="lg" disabled={submitting} className="rounded-full px-8">
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-8">
            <div className="p-6 rounded-2xl bg-muted/40 border border-border space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Email Us Directly</p>
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
                  <p className="font-semibold text-foreground">Response Time</p>
                  <p className="text-sm text-muted-foreground">We typically respond within 24–48 hours, Sunday–Thursday.</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-muted/40 border border-border space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">FAQ</p>
                  <p className="text-sm text-muted-foreground">Most questions about orders, subscriptions, and book creation are answered in our help center.</p>
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
