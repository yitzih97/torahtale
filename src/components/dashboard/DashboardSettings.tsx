import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GlassIconTile } from "@/components/ui/glass-icon-tile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import {
  User as UserIcon, CreditCard, Bell, LogOut, Shield,
  Loader2, Mail, Lock, Trash2,
} from "lucide-react";
import { OrdersHistoryPanel } from "./OrdersHistoryPanel";
import { SHOPIFY_ACCOUNT_URL } from "@/lib/shopify";
import { useLanguage } from "@/contexts/LanguageContext";

const ease = [0.22, 1, 0.36, 1] as const;

const orbs = [
  "from-violet-200/60 to-fuchsia-200/40",
  "from-sky-200/60 to-indigo-200/40",
  "from-emerald-200/60 to-teal-200/40",
  "from-rose-200/60 to-pink-200/40",
  "from-amber-200/60 to-orange-200/40",
];

interface Props {
  user: User;
}

function GlassPanel({
  children, index, Icon, title, subtitle,
}: {
  children: React.ReactNode;
  index: number;
  Icon: typeof UserIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease }}
      className="wizard-glass relative rounded-3xl overflow-hidden
        bg-white/70 backdrop-blur-xl backdrop-saturate-150
        border border-white/70 ring-1 ring-black/5
        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_20px_40px_-20px_rgba(15,23,42,0.18)]
        p-5 sm:p-6"
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-70 bg-gradient-to-br ${orbs[index % orbs.length]}`}
      />
      <div className="relative flex items-start gap-4 mb-5">
        <GlassIconTile Icon={Icon} size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="relative">{children}</div>
    </motion.section>
  );
}

export function DashboardSettings({ user }: Props) {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState(user.user_metadata?.full_name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notifShipping, setNotifShipping] = useState(true);
  const [notifSubscription, setNotifSubscription] = useState(true);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
      if (error) throw error;
      await supabase.from("profiles").update({ full_name: fullName } as any).eq("id", user.id);
      toast.success(t.dash.settingsPanel.profileUpdated);
    } catch (err: any) {
      toast.error(err?.message || t.dash.settingsPanel.profileError);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error(t.dash.settingsPanel.pwTooShort); return; }
    if (newPassword !== confirmPassword) { toast.error(t.dash.settingsPanel.pwMismatch); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(t.dash.settingsPanel.pwUpdated);
      setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || t.dash.settingsPanel.pwError);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success(t.dash.settingsPanel.signedOut);
  };

  const inputCls =
    "rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 ring-1 ring-black/5 focus-visible:ring-2";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Profile */}
      <GlassPanel index={0} Icon={UserIcon} title={t.dash.settingsPanel.profile} subtitle={t.dash.settingsPanel.profileSub}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.dash.settingsPanel.fullName}</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t.dash.settingsPanel.namePlaceholder} className={inputCls} />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.dash.settingsPanel.email}</Label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white/55 backdrop-blur-md border border-white/70 ring-1 ring-black/5 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
          <Button variant="gold" size="sm" onClick={handleSaveProfile} disabled={savingProfile} className="rounded-2xl">
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : t.dash.saveChanges}
          </Button>
        </div>
      </GlassPanel>

      {/* Password */}
      <GlassPanel index={1} Icon={Lock} title={t.dash.settingsPanel.password} subtitle={t.dash.settingsPanel.passwordSub}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.dash.settingsPanel.newPassword}</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.dash.settingsPanel.confirmPassword}</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
          </div>
          <Button variant="outline" size="sm" onClick={handleChangePassword} disabled={changingPassword || !newPassword} className="rounded-2xl bg-white/60 backdrop-blur-md border-white/70">
            {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : t.dash.settingsPanel.updatePassword}
          </Button>
        </div>
      </GlassPanel>

      {/* Payment */}
      <GlassPanel index={2} Icon={CreditCard} title={t.dash.settingsPanel.payment} subtitle={t.dash.settingsPanel.paymentSub}>
        <div className="rounded-2xl p-4 bg-white/55 backdrop-blur-md border border-white/70 ring-1 ring-black/5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t.dash.settingsPanel.manageCards}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t.dash.settingsPanel.cardsHint}
            </p>
          </div>
          <Button
            variant="gold"
            size="sm"
            className="rounded-2xl gap-2 flex-shrink-0"
            onClick={() => window.open(SHOPIFY_ACCOUNT_URL, "_blank", "noopener,noreferrer")}
          >
            <CreditCard className="w-4 h-4" /> {t.dash.settingsPanel.manage}
          </Button>
        </div>
      </GlassPanel>

      {/* Notifications */}
      <GlassPanel index={3} Icon={Bell} title={t.dash.settingsPanel.notifications} subtitle={t.dash.settingsPanel.notificationsSub}>
        <div className="space-y-2">
          {[
            { label: t.dash.settingsPanel.notifShipping, desc: t.dash.settingsPanel.notifShippingDesc, value: notifShipping, onChange: setNotifShipping },
            { label: t.dash.settingsPanel.notifSubs, desc: t.dash.settingsPanel.notifSubsDesc, value: notifSubscription, onChange: setNotifSubscription },
          ].map((pref) => (
            <div key={pref.label} className="flex items-center justify-between gap-3 px-3 py-3 rounded-2xl bg-white/55 backdrop-blur-md border border-white/70 ring-1 ring-black/5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{pref.label}</p>
                <p className="text-xs text-muted-foreground">{pref.desc}</p>
              </div>
              <Switch checked={pref.value} onCheckedChange={pref.onChange} />
            </div>
          ))}
        </div>
      </GlassPanel>
      {/* Orders & Invoices */}
      <div className="lg:col-span-2">
        <OrdersHistoryPanel />
      </div>


      {/* Account */}
      <div className="lg:col-span-2">
        <GlassPanel index={4} Icon={Shield} title={t.dash.settingsPanel.account} subtitle={t.dash.settingsPanel.accountSub}>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl gap-2 bg-white/60 backdrop-blur-md border-white/70"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" /> {t.dash.settingsPanel.signOut}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-2xl gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" /> {t.dash.settingsPanel.deleteAccount}
            </Button>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
