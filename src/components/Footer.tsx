import { BookOpen } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSiteAssets } from "@/hooks/useSiteAssets";
import { useLanguage } from "@/contexts/LanguageContext";

export const Footer = () => {
  const { getSetting } = useSiteSettings("website");
  const { getAssetUrl } = useSiteAssets();
  const { t } = useLanguage();

  const brandName = getSetting("website", "brand-name", "Torah Tale");
  const logoUrl = getAssetUrl("logo", "");

  return (
    <footer className="py-14 bg-background border-t border-border">
      <div className="container max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-4 gap-10 sm:gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                <img src={logoUrl} alt={brandName} className="w-8 h-8 rounded-xl object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-accent-foreground" />
                </div>
              )}
              <span className="font-display text-lg font-bold text-foreground">{brandName}</span>
            </div>
            <p className="text-sm text-muted-foreground font-body leading-relaxed max-w-xs">{t.footer.tagline}</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest text-accent/60 uppercase">{t.footer.navigate}</h4>
            <nav className="flex flex-col gap-2.5">
              <a href="/" className="text-sm text-muted-foreground hover:text-accent transition-colors">{t.footer.home}</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-accent transition-colors">{t.footer.howItWorks}</a>
              <a href="/dashboard" className="text-sm text-muted-foreground hover:text-accent transition-colors">{t.footer.dashboard}</a>
              <a href="/about" className="text-sm text-muted-foreground hover:text-accent transition-colors">{t.footer.aboutUs}</a>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest text-accent/60 uppercase">{t.footer.support}</h4>
            <nav className="flex flex-col gap-2.5">
              <a href="/contact" className="text-sm text-muted-foreground hover:text-accent transition-colors">{t.footer.contactUs}</a>
              <a href="mailto:help@torahtale.com" className="text-sm text-muted-foreground hover:text-accent transition-colors">help@torahtale.com</a>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest text-accent/60 uppercase">{t.footer.legal}</h4>
            <nav className="flex flex-col gap-2.5">
              <a href="/privacy" className="text-sm text-muted-foreground hover:text-accent transition-colors">{t.footer.privacyPolicy}</a>
              <a href="/terms" className="text-sm text-muted-foreground hover:text-accent transition-colors">{t.footer.termsOfService}</a>
            </nav>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {getSetting("website", "footer-copyright", "Torah Tale. Made with ahavas Yisrael.")}</p>
          <p className="text-xs text-muted-foreground">{t.footer.poweredBy}</p>
        </div>
      </div>
    </footer>
  );
};
