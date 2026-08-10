import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

  // Starting the book wizard requires a signed-in account. Every CTA lands here,
  // so this single gate covers them all: bounce guests to auth and bring them
  // straight back to the wizard beginning once they've signed in.
  useEffect(() => {
    if (authLoading || user) return;
    const target = collection ? `/create?collection=${collection.key}` : "/create";
    navigate(`/auth?next=${encodeURIComponent(target)}`, { replace: true });
  }, [collection, authLoading, user, navigate]);

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

  if (authLoading || !user) return null; // waiting for auth check / redirect to sign-in

  return (
    <>
      <SEO
        title="Create Your Torah Tale — Personalize a Parsha Book"
        description="Start the personalization wizard. Add your child's name, photo, and details to generate a one-of-a-kind Torah storybook."
        path="/create"
      />
      <CreationWizard onClose={handleClose} collection={collection} />
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent dir={dir} className={dir === "rtl" ? "text-right" : undefined}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.wizard.exitTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.wizard.exitDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel>{t.wizard.exitKeep}</AlertDialogCancel>
            <Button variant="ghost" onClick={discardAndExit}>
              {t.wizard.exitDiscard}
            </Button>
            <AlertDialogAction onClick={saveAndExit}>{t.wizard.exitSave}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Create;
