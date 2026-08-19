import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { GlassIconTile } from "@/components/ui/glass-icon-tile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import {
  User as UserIcon, CreditCard, Bell, LogOut, Shield,
  Loader2, Mail, Lock, Trash2, AlertTriangle, ArrowRight,
} from "lucide-react";
import { OrdersHistoryPanel } from "./OrdersHistoryPanel";
import { SHOPIFY_ACCOUNT_URL } from "@/lib/shopify";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

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

  /* ── Closing the account ───────────────────────────────────────────────────
   * The button here previously had no onClick at all, so it did nothing. It now
   * runs a two-question flow before anything is destroyed: first WHY, then a
   * confirmation of what goes and what stays, gated on typing DELETE. A live
   * subscription blocks it outright — and the edge function re-checks all of
   * this server-side, so none of these guards can be skipped from the console.
   */
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteDetail, setDeleteDetail] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [liveSubs, setLiveSubs] = useState<number | null>(null);

  const d = t.dash.settingsPanel.del;
  const DELETE_REASONS = d.reasons;

  const openDelete = async () => {
    setDeleteStep(1); setDeleteReason(""); setDeleteDetail(""); setDeleteConfirm("");
    setDeleteOpen(true);
    // Friendly up-front check; the function checks again before deleting.
    const { data } = await supabase
      .from("subscriptions").select("id, status").eq("user_id", user.id);
    setLiveSubs((data || []).filter((r: any) => r.status === "active" || r.status === "paused").length);
  };

  const submitDelete = async () => {
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        body: { confirm: deleteConfirm.trim(), reason: deleteReason, reasonDetail: deleteDetail },
      });
      if (error || (data as any)?.error) {
        const code = (data as any)?.error;
        if (code === "active_subscription") {
          setLiveSubs((data as any)?.activeCount ?? 1);
          toast.error(t.dash.settingsPanel.del.blockedToast);
          return;
        }
        throw new Error(code || "failed");
      }
      toast.success(t.dash.settingsPanel.del.done);
      await supabase.auth.signOut();
      navigate("/");
    } catch {
      toast.error(t.dash.settingsPanel.del.failed);
    } finally {
      setDeleting(false);
    }
  };

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
              onClick={() => void openDelete()}
            >
              <Trash2 className="w-4 h-4" /> {t.dash.settingsPanel.deleteAccount}
            </Button>
          </div>
        </GlassPanel>
      </div>

      {/* Two questions, then the typed confirmation. */}
      <Dialog open={deleteOpen} onOpenChange={(o) => { if (!o && !deleting) setDeleteOpen(false); }}>
        <DialogContent className="max-w-md rounded-3xl border-border/50 bg-card p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-heading text-xl font-bold text-primary">
                  {deleteStep === 1 ? d.q1Title : d.q2Title}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{d.stepOf(deleteStep)}</p>
              </div>
            </div>

            {liveSubs === null ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : liveSubs > 0 ? (
              <>
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-primary">
                  {d.blocked(liveSubs)}
                </div>
                <Button variant="outline" className="h-11 w-full rounded-full border-border/60" onClick={() => setDeleteOpen(false)}>
                  {t.dash.cancel}
                </Button>
              </>
            ) : deleteStep === 1 ? (
              <>
                <p className="text-sm text-muted-foreground">{d.q1Body}</p>
                <div className="space-y-1.5">
                  {DELETE_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setDeleteReason(r)}
                      className={`w-full rounded-xl border-2 px-3.5 py-2.5 text-start text-sm transition-all ${
                        deleteReason === r ? "border-accent bg-accent/10 text-primary" : "border-border/50 text-foreground hover:border-accent/40"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={deleteDetail}
                  onChange={(e) => setDeleteDetail(e.target.value)}
                  placeholder={d.detailPlaceholder}
                  className="min-h-[70px] rounded-xl text-sm"
                />
                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    variant="gold"
                    className="h-11 w-full gap-2 rounded-full"
                    disabled={!deleteReason}
                    onClick={() => setDeleteStep(2)}
                  >
                    {d.next} <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="h-10 w-full rounded-full border-border/60" onClick={() => setDeleteOpen(false)}>
                    {t.dash.cancel}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-2xl bg-muted/50 p-3.5 text-sm text-muted-foreground">{d.q2Body}</div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{d.typeToConfirm}</Label>
                  <Input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    className="h-11 rounded-xl"
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    variant="destructive"
                    className="h-11 w-full rounded-full"
                    disabled={deleting || deleteConfirm.trim().toUpperCase() !== "DELETE"}
                    onClick={() => void submitDelete()}
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : d.confirmBtn}
                  </Button>
                  <Button variant="outline" className="h-10 w-full rounded-full border-border/60" disabled={deleting} onClick={() => setDeleteStep(1)}>
                    {d.back}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
