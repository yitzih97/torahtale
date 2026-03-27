import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { BookOpen, Shield, Heart, Sparkles, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const VALUES = [
  { icon: BookOpen, title: "Torah-Rooted Content", desc: "Every story is grounded in authentic Torah wisdom, reviewed for accuracy and tznius standards." },
  { icon: Shield, title: "Child Safety First", desc: "We follow COPPA guidelines and never share children's data. Privacy is built into every layer." },
  { icon: Sparkles, title: "AI-Powered Personalization", desc: "Cutting-edge AI creates unique illustrations and narratives tailored to each child's world." },
  { icon: Heart, title: "Made with Ahavas Yisrael", desc: "We believe every Jewish child deserves to see themselves in the stories of our mesorah." },
];

const About = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Navbar />

    {/* Hero */}
    <header className="pt-28 pb-16 border-b border-border bg-muted/30">
      <div className="container max-w-4xl mx-auto px-6 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-3">About Us</p>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">Bringing Torah to Life, One Story at a Time</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Torah Tale creates AI-powered, personalized storybooks that place your child at the heart of our most treasured Torah narratives.</p>
      </div>
    </header>

    <main className="container max-w-4xl mx-auto px-6 py-16 space-y-20">
      {/* Mission */}
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-foreground">Our Mission</h2>
        <p className="text-muted-foreground leading-relaxed">We started Torah Tale with a simple idea: what if every frum child could see themselves walking alongside Avraham Avinu, standing at Har Sinai, or building the Mishkan? Personalized children's books have existed for years, but none were rooted in Torah values with the care and authenticity our community deserves.</p>
        <p className="text-muted-foreground leading-relaxed">By combining advanced AI illustration and storytelling with careful rabbinical guidance, we create one-of-a-kind seforim that make parsha learning an unforgettable experience for kinderlach of all ages.</p>
      </section>

      {/* How We Started */}
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-foreground">How We Started</h2>
        <p className="text-muted-foreground leading-relaxed">Torah Tale was born at a Shabbos table. A father wanted to explain Parshas Lech Lecha to his young daughter in a way that would stick — not just the story, but the feeling of being part of it. He imagined a beautifully illustrated book where she was the main character, journeying with Avraham and Sarah.</p>
        <p className="text-muted-foreground leading-relaxed">That conversation turned into a passion project, then a company. Today, Torah Tale serves families across the globe, delivering premium printed storybooks that combine the warmth of a bedtime story with the depth of Torah learning.</p>
      </section>

      {/* Values */}
      <section className="space-y-8">
        <h2 className="text-2xl font-display font-bold text-foreground">Our Values</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {VALUES.map((v) => (
            <div key={v.title} className="p-6 rounded-2xl bg-muted/40 border border-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <v.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-foreground">The Team</h2>
        <div className="p-8 rounded-2xl bg-muted/40 border border-border flex items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <Users className="w-7 h-7 text-accent" />
          </div>
          <div>
            <p className="text-muted-foreground leading-relaxed">Torah Tale is built by a small, passionate team of engineers, educators, and parents who believe technology can serve Torah values. We work closely with mechanchim and rabbonim to ensure every book meets the highest standards of accuracy and yiras shamayim.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-6 py-8">
        <h2 className="text-2xl font-display font-bold text-foreground">Ready to Create Your Child's Story?</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">Join thousands of families who are making Torah learning personal, memorable, and magical.</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/">
            <Button variant="gold" size="lg" className="rounded-full px-8">
              Create a Sefer <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline" size="lg" className="rounded-full px-8">Contact Us</Button>
          </Link>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);

export default About;
