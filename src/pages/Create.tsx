import { useNavigate } from "react-router-dom";
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
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const Create = () => {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <SEO
        title="Create Your Torah Tale — Personalize a Parsha Book"
        description="Start the personalization wizard. Add your child's name, photo, and details to generate a one-of-a-kind Torah storybook."
        path="/create"
      />
      <CreationWizard onClose={handleClose} />
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
