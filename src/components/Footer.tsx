import { BookOpen } from "lucide-react";

export const Footer = () => (
  <footer className="py-12 border-t border-border">
    <div className="container text-center space-y-4">
      <div className="flex items-center justify-center gap-2 text-primary">
        <BookOpen className="w-5 h-5 text-gold" />
        <span className="font-display text-lg font-bold">MyTorahTale</span>
      </div>
      <p className="font-mono text-xs text-muted-foreground tracking-wide">
        A legacy in every page. Made with love.
      </p>
    </div>
  </footer>
);
