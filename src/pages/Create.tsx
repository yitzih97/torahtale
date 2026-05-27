import { useNavigate } from "react-router-dom";
import { CreationWizard } from "@/components/CreationWizard";

const Create = () => {
  const navigate = useNavigate();
  return <CreationWizard onClose={() => navigate("/")} />;
};

export default Create;
