import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import {
  User as UserIcon, CreditCard, Bell, LogOut, Shield,
  Loader2, Mail, Lock, Trash2,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1];

interface Props {
  user: User;
}

export function DashboardSettings({ user }: Props) {
  const [fullName, setFullName] = useState(user.user_metadata?.full_name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification prefs (local state — placeholder for future DB-backed prefs)
  const [notifBookReady, setNotifBookReady] = useState(true);
  const [notifShipping, setNotifShipping] = useState(true);
  const [notifSubscription, setNotifSubscription] = useState(true);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
      if (error) throw error;

      await supabase.from("profiles").update({
        full_name: fullName,
      } as any).eq("id", user.id);

      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-primary">Profile</h3>
            <p className="text-xs text-muted-foreground">Manage your personal information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              {user.email}
            </div>
          </div>
          <Button
            variant="gold"
            size="sm"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="rounded-xl"
          >
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease }}
        className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-primary">Change Password</h3>
            <p className="text-xs text-muted-foreground">Update your account password</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Confirm Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword}
            className="rounded-xl"
          >
            {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
          </Button>
        </div>
      </motion.div>

      {/* Payment Methods (Placeholder) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease }}
        className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-primary">Payment Methods</h3>
            <p className="text-xs text-muted-foreground">Manage your saved payment methods</p>
          </div>
        </div>

        <div className="bg-muted/30 rounded-xl p-4 text-center">
          <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No payment methods saved yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Payment methods are saved automatically when you place an order.</p>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease }}
        className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-primary">Notifications</h3>
            <p className="text-xs text-muted-foreground">Choose what emails you receive</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { label: "Book Ready", desc: "Get notified when your book is ready to view", value: notifBookReady, onChange: setNotifBookReady },
            { label: "Shipping Updates", desc: "Track your book's delivery status", value: notifShipping, onChange: setNotifShipping },
            { label: "Subscription Reminders", desc: "Weekly reminders about upcoming deliveries", value: notifSubscription, onChange: setNotifSubscription },
          ].map((pref) => (
            <div key={pref.label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-primary">{pref.label}</p>
                <p className="text-xs text-muted-foreground">{pref.desc}</p>
              </div>
              <Switch checked={pref.value} onCheckedChange={pref.onChange} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Account Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease }}
        className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-primary">Account</h3>
            <p className="text-xs text-muted-foreground">Manage your account</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
          <Button variant="ghost" size="sm" className="rounded-xl gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="w-4 h-4" /> Delete Account
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
