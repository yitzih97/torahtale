import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { BrandMark } from "@/components/BrandMark";

interface NavbarProps {
  onStart?: () => void;
  transparentHero?: boolean;
}

export const Navbar = ({ onStart, transparentHero = true }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { lang, setLang, t, dir } = useLanguage();
  const { getSetting } = useSiteSettings("website");
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleSectionLink = (sectionId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileOpen(false);
    if (location.pathname === "/") {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  const brandName = getSetting("website", "brand-name", "Torah Tale");
  

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || !transparentHero;

  const navLinks: { label: string; href: string; section?: string }[] = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.pricing, href: "/pricing" },
    { label: t.nav.testimonials, href: "/testimonials" },
    { label: t.nav.contact, href: "/contact" },
  ];

  // Toggle only between English and Hebrew; the flag shown is the language you'll switch TO.
  const cycleLang = () => setLang(lang === "en" ? "he" : "en");
  const langFlag = lang === "en" ? "🇮🇱" : "🇺🇸";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${solid ? "bg-background/92 backdrop-blur-xl border-b border-[hsl(var(--gold)/0.18)] shadow-sm" : "bg-gradient-to-b from-background/95 via-background/72 to-transparent"}`} data-scrolled={scrolled}>
      <div className="container flex items-center justify-between h-20 lg:h-24">
        <a href="/" className="group">
          <BrandMark
            className="gap-1.5 transition-transform duration-300 group-hover:scale-[1.01]"
            iconClassName={`h-14 w-14 lg:h-16 lg:w-16 ${!solid ? "[filter:drop-shadow(0_1px_2px_hsl(36_60%_15%/0.5))]" : ""}`}
            wordmarkClassName={`h-16 lg:h-20 w-auto ${!solid ? "[filter:drop-shadow(0_1px_2px_hsl(36_60%_15%/0.5))]" : ""}`}
          />
          <span className="sr-only">{brandName}</span>
        </a>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={link.section ? handleSectionLink(link.section) : undefined}
              className={`text-sm font-semibold transition-colors duration-500 ${solid ? "text-foreground/78 hover:text-accent" : "text-foreground/80 hover:text-accent"}`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={cycleLang}
            className={`w-9 h-9 rounded-full text-lg leading-none flex items-center justify-center border transition-colors duration-300 bg-background/60 backdrop-blur-sm ${
              solid
                ? "border-border hover:border-accent"
                : "border-foreground/25 hover:border-accent"
            }`}
            aria-label={lang === "en" ? "Switch to Hebrew" : "Switch to English"}
          >
            {langFlag}
          </button>

          {user ? (
            <>
              <a href="/dashboard" className={`text-sm font-medium transition-colors duration-500 hidden lg:flex items-center gap-1.5 ${solid ? "text-muted-foreground hover:text-accent" : "text-foreground/75 hover:text-accent"}`}>
                <User className="w-4 h-4" /> {t.nav.dashboard}
              </a>
              <button onClick={signOut} className={`p-2 rounded-full transition-colors hidden lg:block ${solid ? "text-muted-foreground hover:text-destructive hover:bg-muted" : "text-muted-foreground hover:text-destructive hover:bg-muted"}`} aria-label={t.nav.signOut}>
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <a href="/auth" className={`text-sm font-medium transition-colors duration-500 hidden lg:block ${solid ? "text-muted-foreground hover:text-accent" : "text-foreground/75 hover:text-accent"}`}>{t.nav.login}</a>
          )}

          {onStart && (
            <Button variant="gold" size="sm" onClick={onStart} className="rounded-full px-5 hidden lg:inline-flex">{t.nav.createSefer}</Button>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(true)} className={`lg:hidden p-2 rounded-lg transition-colors ${solid ? "text-foreground hover:bg-muted" : "text-foreground hover:bg-foreground/10"}`} aria-label="Open menu">
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
                onClick={link.section ? handleSectionLink(link.section) : () => setMobileOpen(false)}
                className="text-base font-medium text-foreground hover:text-accent transition-colors py-2 border-b border-border"
              >
                {link.label}
              </a>
            ))}

            {/* Mobile language toggle */}
            <button
              onClick={() => { cycleLang(); setMobileOpen(false); }}
              className="text-2xl leading-none transition-transform hover:scale-110 py-2 border-b border-border text-start"
              aria-label={lang === "en" ? "Switch to Hebrew" : "Switch to English"}
            >
              {langFlag}
            </button>

            {user ? (
              <>
                <a href="/dashboard" onClick={() => setMobileOpen(false)} className="text-base font-medium text-foreground hover:text-accent transition-colors py-2 border-b border-border flex items-center gap-2">
                  <User className="w-4 h-4" /> {t.nav.dashboard}
                </a>
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="text-base font-medium text-destructive hover:text-destructive/80 transition-colors py-2 text-start flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> {t.nav.signOut}
                </button>
              </>
            ) : (
              <a href="/auth" onClick={() => setMobileOpen(false)} className="text-base font-medium text-foreground hover:text-accent transition-colors py-2 border-b border-border">
                {t.nav.login}
              </a>
            )}

            {onStart && (
              <Button variant="gold" size="lg" onClick={() => { onStart(); setMobileOpen(false); }} className="rounded-full mt-2 w-full">
                {t.nav.createSefer}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
};
