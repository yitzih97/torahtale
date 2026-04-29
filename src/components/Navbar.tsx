import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BookOpen, LogOut, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSiteAssets } from "@/hooks/useSiteAssets";

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
  const { getAssetUrl } = useSiteAssets();
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
  const logoUrl = getAssetUrl("logo", "");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || !transparentHero;

  const navLinks = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.pricing, href: "/pricing" },
    { label: t.nav.testimonials, href: "/testimonials" },
    { label: t.nav.contact, href: "/contact" },
  ];

  const cycleLang = () => setLang(lang === "en" ? "he" : lang === "he" ? "yi" : "en");
  const langLabelShort = lang === "en" ? "עב" : lang === "he" ? "יי" : "EN";
  const langLabelLong = lang === "en" ? "עברית" : lang === "he" ? "יידיש" : "English";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${solid ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"}`} data-scrolled={scrolled}>
      <div className="container flex items-center justify-between h-16 lg:h-18">
        <a href="/" className="flex items-center gap-2.5 group">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="w-8 h-8 rounded-xl object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-accent-foreground" />
            </div>
          )}
          <span className={`font-display text-lg font-bold tracking-tight transition-colors duration-500 ${solid ? "text-foreground" : "text-white"}`}>{brandName}</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={link.section ? handleSectionLink(link.section) : undefined}
              className={`text-sm font-medium transition-colors duration-500 ${solid ? "text-muted-foreground hover:text-accent" : "text-white/80 hover:text-white"}`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={cycleLang}
            className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors duration-300 ${
              solid
                ? "border-border text-muted-foreground hover:text-accent hover:border-accent"
                : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
            }`}
            aria-label="Toggle language"
          >
            {langLabelShort}
          </button>

          {user ? (
            <>
              <a href="/dashboard" className={`text-sm font-medium transition-colors duration-500 hidden sm:flex items-center gap-1.5 ${solid ? "text-muted-foreground hover:text-accent" : "text-white/80 hover:text-white"}`}>
                <User className="w-4 h-4" /> {t.nav.dashboard}
              </a>
              <button onClick={signOut} className={`p-2 rounded-full transition-colors hidden sm:block ${solid ? "text-muted-foreground hover:text-destructive hover:bg-muted" : "text-white/70 hover:text-white hover:bg-white/10"}`} aria-label={t.nav.signOut}>
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <a href="/auth" className={`text-sm font-medium transition-colors duration-500 hidden sm:block ${solid ? "text-muted-foreground hover:text-accent" : "text-white/80 hover:text-white"}`}>{t.nav.login}</a>
          )}

          {onStart && (
            <Button variant="gold" size="sm" onClick={onStart} className="rounded-full px-5 hidden sm:inline-flex">{t.nav.createSefer}</Button>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(true)} className={`md:hidden p-2 rounded-lg transition-colors ${solid ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10"}`} aria-label="Open menu">
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
              className="text-base font-medium text-foreground hover:text-accent transition-colors py-2 border-b border-border text-start"
            >
              {langLabelLong}
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
