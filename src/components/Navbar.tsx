import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Menu, Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { blogHref } from "@/hooks/useBlogLocale";
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
    { label: t.nav.howItWorks, href: "/#how-it-works", section: "how-it-works" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.pricing, href: "/pricing" },
    { label: t.nav.testimonials, href: "/testimonials" },
    { label: t.nav.blog, href: blogHref(lang) },
    { label: t.nav.contact ?? "Contact Us", href: "/contact" },
  ];

  // Language picker: a globe symbol opens a small dropdown listing each language
  // by flag + native name (English / עברית). Only en + he are offered here.
  const LANGUAGES: { code: "en" | "he"; flag: string; label: string }[] = [
    { code: "en", flag: "🇺🇸", label: "English" },
    { code: "he", flag: "🇮🇱", label: "עברית" },
  ];

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

        <div className="hidden lg:flex items-center gap-5 xl:gap-7">
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
          {/* Language picker — globe icon opens a flag + name dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors duration-300 bg-background/60 backdrop-blur-sm ${
                  solid
                    ? "border-border hover:border-accent text-foreground/80"
                    : "border-foreground/25 hover:border-accent text-foreground/80"
                }`}
                aria-label="Change language"
              >
                <Globe className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[9rem]">
              {LANGUAGES.map((l) => (
                <DropdownMenuItem
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className="gap-2 cursor-pointer"
                >
                  <span className="text-base leading-none">{l.flag}</span>
                  <span className="flex-1" dir={l.code === "he" ? "rtl" : "ltr"}>{l.label}</span>
                  {lang === l.code && <Check className="w-3.5 h-3.5 text-accent" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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

            {/* Mobile language picker */}
            <div className="flex items-center gap-2 py-2 border-b border-border">
              <Globe className="w-4 h-4 text-muted-foreground" />
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setMobileOpen(false); }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    lang === l.code ? "border-accent bg-accent/10 text-accent" : "border-border text-foreground hover:border-accent/40"
                  }`}
                >
                  <span className="text-base leading-none">{l.flag}</span>
                  <span dir={l.code === "he" ? "rtl" : "ltr"}>{l.label}</span>
                </button>
              ))}
            </div>

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
