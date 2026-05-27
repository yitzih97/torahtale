import { useNavigate } from "react-router-dom";
import { CreationWizard } from "@/components/CreationWizard";

const Create = () => {
  const navigate = useNavigate();
  const handleClose = () => {
    if (window.confirm("Exit and discard your current progress?")) {
      try { localStorage.removeItem("torahtale_wizard_state"); } catch { /* ignore */ }
      navigate("/");
    }
  };
  return <CreationWizard onClose={handleClose} />;
};

export default Create;
