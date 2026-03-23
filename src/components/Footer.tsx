import { BookOpen } from "lucide-react";

export const Footer = () => (
  <footer className="py-16 bg-primary border-t border-primary-foreground/10">
    <div className="container">
      <div className="grid sm:grid-cols-3 gap-10 sm:gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary-foreground">
            <BookOpen className="w-5 h-5 text-accent" />
            <span className="font-display text-lg font-bold">MyTorahTale</span>
          </div>
          <p className="text-sm text-primary-foreground/50 leading-relaxed max-w-xs">
            AI-powered personalized children's books rooted in Torah wisdom. A legacy in every page.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="font-mono text-xs tracking-widest text-primary-foreground/40 uppercase">Navigate</h4>
          <nav className="flex flex-col gap-2.5">
            <a href="/" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">Home</a>
            <a href="/dashboard" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">Dashboard</a>
            <a href="/admin" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">Admin</a>
          </nav>
        </div>

        <div className="space-y-4">
          <h4 className="font-mono text-xs tracking-widest text-primary-foreground/40 uppercase">Legal</h4>
          <nav className="flex flex-col gap-2.5">
            <a href="#" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">Terms of Service</a>
          </nav>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-mono text-xs text-primary-foreground/30">
          © {new Date().getFullYear()} MyTorahTale. Made with love.
        </p>
        <p className="font-mono text-xs text-primary-foreground/30">
          Powered by Gemini Pro & Nano Banana 2
        </p>
      </div>
    </div>
  </footer>
);
