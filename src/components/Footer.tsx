import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { BrandMark } from "@/components/BrandMark";

export const Footer = () => {
  const { getSetting } = useSiteSettings("website");
  const { t } = useLanguage();

  const brandName = getSetting("website", "brand-name", "Torah Tale");

  const linkCls = "text-sm text-muted-foreground hover:text-accent transition-colors";

  return (
    <footer className="py-14 bg-background border-t border-border">
      <div className="container max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 sm:gap-8">
          <div className="space-y-4">
            <div className="space-y-4">
              <BrandMark iconClassName="h-12 w-12" wordmarkClassName="h-10 w-auto" />
              <span className="sr-only">{brandName}</span>
            </div>
            {t.footer.tagline && <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{t.footer.tagline}</p>}
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest text-accent/70 uppercase">{t.footer.navigate}</h4>
            <nav className="flex flex-col gap-2.5">
              <a href="/" className={linkCls}>{t.footer.home}</a>
              <a href="/about" className={linkCls}>{t.footer.aboutUs}</a>
              <a href="/pricing" className={linkCls}>{t.footer.pricing}</a>
              <a href="/testimonials" className={linkCls}>{t.footer.testimonials}</a>
              <a href="/dashboard" className={linkCls}>{t.nav.dashboard}</a>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest text-accent/60 uppercase">{t.footer.discover}</h4>
            <nav className="flex flex-col gap-2.5">
              <a href="/#how-it-works" className={linkCls}>{t.footer.howItWorks}</a>
              <a href="/blog" className={linkCls}>{t.footer.blog}</a>
              <a href="/faq" className={linkCls}>{t.footer.faq}</a>
              <a href="/affiliates" className={linkCls}>Affiliate Program</a>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest text-accent/60 uppercase">{t.footer.support}</h4>
            <nav className="flex flex-col gap-2.5">
              <a href="/contact" className={linkCls}>{t.footer.contactUs}</a>
              <a href="mailto:help@torahtale.com" className={linkCls}>help@torahtale.com</a>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest text-accent/60 uppercase">{t.footer.legal}</h4>
            <nav className="flex flex-col gap-2.5">
              <a href="/privacy" className={linkCls}>{t.footer.privacyPolicy}</a>
              <a href="/terms" className={linkCls}>{t.footer.termsOfService}</a>
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
