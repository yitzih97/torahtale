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
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-soft-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between h-16">
        <a href="/" className="flex items-center gap-2 group">
          <BookOpen className={`w-5 h-5 text-accent transition-transform duration-300 group-hover:rotate-[-8deg]`} />
          <span className={`font-display text-lg font-bold tracking-tight transition-colors duration-500 ${
            scrolled ? "text-primary" : "text-primary-foreground"
          }`}>
            MyTorahTale
          </span>
        </a>
        <div className="flex items-center gap-6">
          <a
            href="/dashboard"
            className={`text-sm font-medium transition-colors duration-300 ${
              scrolled ? "text-muted-foreground hover:text-foreground" : "text-primary-foreground/70 hover:text-primary-foreground"
            }`}
          >
            Dashboard
          </a>
          <a
            href="/admin"
            className={`text-sm transition-colors duration-300 ${
              scrolled ? "text-muted-foreground hover:text-foreground" : "text-primary-foreground/50 hover:text-primary-foreground/80"
            }`}
          >
            Admin
          </a>
        </div>
      </div>
    </nav>
  );
};
