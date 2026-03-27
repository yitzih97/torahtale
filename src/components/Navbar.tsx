import { useState, useEffect } from "react";
import { BookOpen, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSiteAssets } from "@/hooks/useSiteAssets";

interface NavbarProps {
  onStart?: () => void;
}

export const Navbar = ({ onStart }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { getSetting } = useSiteSettings("website");
  const { getAssetUrl } = useSiteAssets();

  const brandName = getSetting("website", "brand-name", "Torah Tale");
  const navbarCta = getSetting("website", "navbar-cta", "Create a Sefer");
  const logoUrl = getAssetUrl("logo", "");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"}`}>
      <div className="container flex items-center justify-between h-16 lg:h-18">
        <a href="/" className="flex items-center gap-2.5 group">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="w-8 h-8 rounded-xl object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-accent-foreground" />
            </div>
          )}
          <span className="font-display text-lg font-bold tracking-tight text-foreground">{brandName}</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors">How It Works</a>
          <a href="#gallery" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors">Gallery</a>
          <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors">Reviews</a>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-full text-muted-foreground hover:text-accent hover:bg-muted transition-colors" aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <>
              <a href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors hidden sm:flex items-center gap-1.5">
                <User className="w-4 h-4" /> Dashboard
              </a>
              <button onClick={signOut} className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-muted transition-colors hidden sm:block" aria-label="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <a href="/auth" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors hidden sm:block">Login</a>
          )}

          {onStart && (
            <Button variant="gold" size="sm" onClick={onStart} className="rounded-full px-5">{navbarCta}</Button>
          )}
        </div>
      </div>
    </nav>
  );
};
