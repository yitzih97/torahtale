import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-sm border-b border-gold/20"
          : "bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between h-16">
        <a href="/" className="flex items-center gap-2 text-primary">
          <BookOpen className="w-6 h-6 text-gold" />
          <span className="font-display text-xl font-bold tracking-tight">MyTorahTale</span>
        </a>
        <a href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Admin
        </a>
      </div>
    </nav>
  );
};
