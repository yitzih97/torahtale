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
import { useState } from "react";

const Create = () => {
  const navigate = useNavigate();
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
      <CreationWizard onClose={handleClose} />
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave book creation?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be saved automatically. You can pick up right where you left off when you return.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <Button variant="ghost" onClick={discardAndExit}>
              Discard progress
            </Button>
            <AlertDialogAction onClick={saveAndExit}>Save & exit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Create;
