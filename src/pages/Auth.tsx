import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const floatingOrb = (delay: number, x: string, y: string, size: string, color: string) => (
  <motion.div
    className={`absolute ${x} ${y} ${size} rounded-full ${color} blur-[100px] pointer-events-none`}
    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);

const fieldVariants = {
  idle: { scale: 1, boxShadow: "0 0 0 0px hsl(var(--accent) / 0)" },
  focused: { scale: 1.01, boxShadow: "0 0 0 3px hsl(var(--accent) / 0.15)" },
};

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Where to send the user after a successful sign-in: an explicit ?next=,
  // the route they came from, else the dashboard. Keeps people who signed in
  // mid-flow (e.g. from the wizard) from being dumped on the dashboard.
  const rawNext = searchParams.get("next") || (location.state as any)?.from || "/dashboard";
  const next = rawNext.startsWith("/") ? rawNext : "/dashboard";

  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, navigate, next]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t.auth.welcomeBackToast);
      navigate(next);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t.auth.checkEmail);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t.auth.resetSent);
      setMode("login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden relative">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {floatingOrb(0, "-left-40", "top-1/4", "w-[500px] h-[500px]", "bg-accent/20")}
        {floatingOrb(3, "-right-40", "top-1/3", "w-[400px] h-[400px]", "bg-primary/15")}
        {floatingOrb(5, "left-1/3", "bottom-0", "w-[600px] h-[300px]", "bg-accent/10")}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <a href="/" className="inline-flex mx-auto mb-6">
            <BrandMark stacked iconClassName="h-16 w-16" wordmarkClassName="h-9 w-auto" />
          </a>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            {mode === "login" ? t.auth.welcomeBack : mode === "signup" ? t.auth.createAccount : t.auth.resetPassword}
            <span className="text-accent">.</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-light">
            {mode === "login"
              ? t.auth.signInSubtitle
              : mode === "signup"
              ? t.auth.signUpSubtitle
              : t.auth.forgotSubtitle}
          </p>
        </div>

        <div className="p-8 md:p-10 rounded-[2rem] bg-card/60 backdrop-blur-2xl border border-border/30 shadow-[0_8px_60px_-12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.1)_inset]">
          {/* Google first — the default, primary sign-in. */}
          {mode !== "forgot" && (
            <>
              <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-border/40 bg-background/70 hover:bg-background text-base font-semibold transition-all duration-300"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: { redirectTo: `${window.location.origin}${next}` },
                    });
                    setLoading(false);
                    if (error) toast.error(error.message);
                  }}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {t.auth.continueWithGoogle}
                </Button>
              </motion.div>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent backdrop-blur-sm px-3 text-muted-foreground/60">{t.auth.orContinueWith}</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgotPassword} className="space-y-5">
            {mode === "signup" && (
              <motion.div
                variants={fieldVariants}
                animate={focusedField === "fullName" ? "focused" : "idle"}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="space-y-2.5 rounded-2xl"
              >
                <Label htmlFor="fullName" className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">{t.auth.fullName}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t.auth.namePlaceholder}
                    className="pl-10 h-13 rounded-xl bg-background/80 border-border/40 text-base placeholder:text-muted-foreground/50 transition-all duration-300 focus-visible:ring-accent/20 focus-visible:border-accent/40"
                    onFocus={() => setFocusedField("fullName")}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                </div>
              </motion.div>
            )}
            <motion.div
              variants={fieldVariants}
              animate={focusedField === "email" ? "focused" : "idle"}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="space-y-2.5 rounded-2xl"
            >
              <Label htmlFor="email" className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">{t.auth.email}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.auth.emailPlaceholder}
                  className="pl-10 h-13 rounded-xl bg-background/80 border-border/40 text-base placeholder:text-muted-foreground/50 transition-all duration-300 focus-visible:ring-accent/20 focus-visible:border-accent/40"
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>
            </motion.div>
            {mode !== "forgot" && (
              <motion.div
                variants={fieldVariants}
                animate={focusedField === "password" ? "focused" : "idle"}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="space-y-2.5 rounded-2xl"
              >
                <Label htmlFor="password" className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">{t.auth.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.auth.passwordPlaceholder}
                    className="pl-10 h-13 rounded-xl bg-background/80 border-border/40 text-base placeholder:text-muted-foreground/50 transition-all duration-300 focus-visible:ring-accent/20 focus-visible:border-accent/40"
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    required
                    minLength={6}
                  />
                </div>
              </motion.div>
            )}

            <motion.div
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Button
                type="submit"
                variant="gold"
                className="w-full h-14 rounded-2xl text-base font-semibold tracking-wide shadow-[0_0_30px_hsl(var(--accent)/0.25)] hover:shadow-[0_0_50px_hsl(var(--accent)/0.35)] transition-shadow duration-500"
                disabled={loading}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full"
                  />
                ) : (
                  mode === "login" ? t.auth.signIn : mode === "signup" ? t.auth.signUp : t.auth.sendResetLink
                )}
              </Button>
            </motion.div>
          </form>

          <div className="mt-6 text-center text-sm">
            {mode === "login" && (
              <>
                <button onClick={() => setMode("forgot")} className="text-accent hover:underline">{t.auth.forgotPassword}</button>
                <p className="mt-2 text-muted-foreground">
                  {t.auth.noAccount}{" "}
                  <button onClick={() => setMode("signup")} className="text-accent font-medium hover:underline">{t.auth.signUpLink}</button>
                </p>
              </>
            )}
            {mode === "signup" && (
              <p className="text-muted-foreground">
                {t.auth.haveAccount}{" "}
                <button onClick={() => setMode("login")} className="text-accent font-medium hover:underline">{t.auth.signInLink}</button>
              </p>
            )}
            {mode === "forgot" && (
              <button onClick={() => setMode("login")} className="text-accent hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> {t.auth.backToSignIn}
              </button>
            )}
          </div>
        </div>

        {/* Subtle reflection */}
        <div className="mt-3 mx-8 h-12 rounded-b-3xl bg-gradient-to-b from-card/20 to-transparent blur-sm" />
      </motion.div>
    </div>
  );
}
