import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { CreationWizard } from "@/components/CreationWizard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCollection } from "@/data/collections";

const Create = () => {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [open, setOpen] = useState(false);

  // Collection-request mode: /create?collection=<key> runs the wizard without
  // story selection or payment and sends the request to the admin inbox.
  const collection = getCollection(searchParams.get("collection"));

  // Dev-only escape hatch for scripts/capture-wizard-shots.mjs, which walks the
  // wizard to refresh the screenshots in the blog's step-by-step guide. Gated on
  // import.meta.env.DEV, so it does not exist in a production build.
  const screenshotMode = import.meta.env.DEV && searchParams.has("shots");

  // Starting the book wizard requires a signed-in account. Every CTA lands here,
  // so this single gate covers them all: bounce guests to auth and bring them
  // straight back to the wizard beginning once they've signed in.
  useEffect(() => {
    if (screenshotMode) return;
    if (authLoading || user) return;
    const target = collection ? `/create?collection=${collection.key}` : "/create";
    navigate(`/auth?next=${encodeURIComponent(target)}`, { replace: true });
  }, [screenshotMode, collection, authLoading, user, navigate]);

  const handleClose = () => setOpen(true);

  const saveAndExit = () => {
    setOpen(false);
    navigate("/");
  };

  const discardAndExit = () => {
    try {
      localStorage.removeItem("torahtale_wizard_state");
    } catch {
      /* ignore */
    }
    setOpen(false);
    navigate("/");
  };

  if (!screenshotMode && (authLoading || !user)) return null; // waiting for auth check / redirect to sign-in

  return (
    <>
      <SEO
        title="Create Your Torah Tale — Personalize a Parsha Book"
        description="Start the personalization wizard. Add your child's name, photo, and details to generate a one-of-a-kind Torah storybook."
        path="/create"
      />
      <CreationWizard onClose={handleClose} collection={collection} />
      {/* Branded to match the wizard it interrupts: the same accent tile, the
          Torah Tale display face on the question, and a clear primary action.
          The two ways of leaving are separated from the way back — "Discard"
          is the destructive one and reads as such. */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent
          dir={dir}
          className={`max-w-md rounded-3xl border-border/50 bg-card p-6 sm:p-7 shadow-[0_30px_80px_-30px_rgba(60,45,15,0.45)] ${dir === "rtl" ? "text-right" : ""}`}
        >
          <AlertDialogHeader className="space-y-3 sm:text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/25 to-accent/5 text-accent ring-1 ring-accent/20">
              <BookOpen className="h-7 w-7" />
            </span>
            <AlertDialogTitle className="font-heading text-2xl sm:text-3xl font-bold text-primary">
              {t.wizard.exitTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground sm:text-center">
              {t.wizard.exitDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5 flex-col gap-2 sm:flex-col sm:space-x-0">
            <AlertDialogAction
              onClick={saveAndExit}
              className="h-12 w-full rounded-full bg-accent text-accent-foreground text-base font-semibold shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] hover:bg-accent/90"
            >
              {t.wizard.exitSave}
            </AlertDialogAction>
            <AlertDialogCancel className="mt-0 h-11 w-full rounded-full border-border/60 text-base font-medium">
              {t.wizard.exitKeep}
            </AlertDialogCancel>
            <Button
              variant="ghost"
              onClick={discardAndExit}
              className="h-9 w-full rounded-full text-sm font-normal text-muted-foreground hover:text-destructive"
            >
              {t.wizard.exitDiscard}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Create;
