import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      toast.error(t.auth.invalidResetLink);
      navigate("/auth");
    }
  }, [navigate, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t.auth.passwordUpdated);
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex mx-auto mb-6">
            <BrandMark className="gap-1.5" iconClassName="h-12 w-12" wordmarkClassName="h-14 w-auto" />
          </a>
          <h1 className="font-display text-2xl font-bold text-primary">{t.auth.setNewPassword}</h1>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">{t.auth.newPassword}</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10" required minLength={6} />
              </div>
            </div>
            <Button type="submit" variant="gold" className="w-full" disabled={loading}>
              {loading ? t.auth.updating : t.auth.updatePassword}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
