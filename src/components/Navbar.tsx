import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onStart?: () => void;
}

export const Navbar = ({ onStart }: NavbarProps) => {
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
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between h-16 lg:h-18">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-accent-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            MyTorahTale
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors">
            How It Works
          </a>
          <a href="#gallery" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors">
            Gallery
          </a>
          <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors">
            Reviews
          </a>
        </div>

        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors hidden sm:block">
            Dashboard
          </a>
          {onStart && (
            <Button variant="gold" size="sm" onClick={onStart} className="rounded-full px-5">
              Create a Story
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};
