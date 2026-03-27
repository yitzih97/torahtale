import { useState, useEffect } from "react";
import { BookOpen, LogOut, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSiteAssets } from "@/hooks/useSiteAssets";

interface NavbarProps {
  onStart?: () => void;
}

export const Navbar = ({ onStart }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const navLinks = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Gallery", href: "#gallery" },
    { label: "Reviews", href: "#testimonials" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"}`} data-scrolled={scrolled}>
      <div className="container flex items-center justify-between h-16 lg:h-18">
        <a href="/" className="flex items-center gap-2.5 group">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="w-8 h-8 rounded-xl object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-accent-foreground" />
            </div>
          )}
          <span className={`font-display text-lg font-bold tracking-tight transition-colors duration-500 ${scrolled ? "text-foreground" : "text-white"}`}>{brandName}</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className={`text-sm font-medium transition-colors duration-500 ${scrolled ? "text-muted-foreground hover:text-accent" : "text-white/80 hover:text-white"}`}>{link.label}</a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <a href="/dashboard" className={`text-sm font-medium transition-colors duration-500 hidden sm:flex items-center gap-1.5 ${scrolled ? "text-muted-foreground hover:text-accent" : "text-white/80 hover:text-white"}`}>
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
            <Button variant="gold" size="sm" onClick={onStart} className="rounded-full px-5 hidden sm:inline-flex">{navbarCta}</Button>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile sheet menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="top" className="pt-12 pb-8">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium text-foreground hover:text-accent transition-colors py-2 border-b border-border"
              >
                {link.label}
              </a>
            ))}

            {user ? (
              <>
                <a href="/dashboard" onClick={() => setMobileOpen(false)} className="text-base font-medium text-foreground hover:text-accent transition-colors py-2 border-b border-border flex items-center gap-2">
                  <User className="w-4 h-4" /> Dashboard
                </a>
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="text-base font-medium text-destructive hover:text-destructive/80 transition-colors py-2 text-left flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <a href="/auth" onClick={() => setMobileOpen(false)} className="text-base font-medium text-foreground hover:text-accent transition-colors py-2 border-b border-border">
                Login
              </a>
            )}

            {onStart && (
              <Button variant="gold" size="lg" onClick={() => { onStart(); setMobileOpen(false); }} className="rounded-full mt-2 w-full">
                {navbarCta}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
};
