import { BookOpen } from "lucide-react";

export const Footer = () => (
  <footer className="py-14 bg-background border-t border-border">
    <div className="container max-w-5xl mx-auto">
      <div className="grid sm:grid-cols-3 gap-10 sm:gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-accent-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">MyTorahTale</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            AI-powered personalized children's seforim rooted in Torah wisdom. A legacy for doros to come.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Navigate</h4>
          <nav className="flex flex-col gap-2.5">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
          </nav>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Legal</h4>
          <nav className="flex flex-col gap-2.5">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
          </nav>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} MyTorahTale. Made with ahavas Yisrael.
        </p>
        <p className="text-xs text-muted-foreground">
          Powered by AI · Inspired by Torah
        </p>
      </div>
    </div>
  </footer>
);
