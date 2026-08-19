import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, MapPin, Pause, Play, XCircle, Mail, CalendarDays, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { dfFormat } from "@/lib/dateLocale";
import type { SubscriptionRecord } from "@/hooks/useSubscriptions";

interface ContractAddress {
  firstName?: string | null; lastName?: string | null;
  address1?: string | null; address2?: string | null;
  city?: string | null; province?: string | null; zip?: string | null;
  country?: string | null; countryCode?: string | null; phone?: string | null;
}
interface ContractDetail {
  id: string; status: string; nextBillingDate: string | null; currency: string | null;
  interval: string | null; intervalCount: number | null;
  address: ContractAddress | null;
  paymentMethodId: string | null;
  card: { brand: string; last4: string; expMonth: number; expYear: number } | null;
  paypalEmail: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  subscription: SubscriptionRecord | null;
  /** Called after any change so the dashboard can refetch. */
  onChanged?: () => void;
}

export function ManageSubscriptionDialog({ open, onClose, subscription, onChanged }: Props) {
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [hasContract, setHasContract] = useState(true);
  const [busy, setBusy] = useState<string | null>(null); // which action is in-flight
  const [editingAddr, setEditingAddr] = useState(false);
  const [addr, setAddr] = useState<ContractAddress>({});

  const invoke = (body: Record<string, unknown>) =>
    supabase.functions.invoke("shopify-admin-data", { body: { subscriptionId: subscription?.id, ...body } });

  const load = async () => {
    if (!subscription) return;
    setLoading(true);
    try {
      const { data, error } = await invoke({ action: "subscription-detail" });
      if (error) throw error;
      if (data?.hasContract === false) { setHasContract(false); setDetail(null); return; }
      setHasContract(true);
      setDetail(data.contract as ContractDetail);
      setAddr(data.contract?.address || {});
    } catch {
      setHasContract(false);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && subscription) { setEditingAddr(false); void load(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subscription?.id]);

  const runAction = async (action: string, successMsg: string) => {
    setBusy(action);
    try {
      const { data, error } = await invoke({ action });
      if (error || data?.error) throw new Error(data?.error || "failed");
      toast.success(successMsg);
      onChanged?.();
      await load();
    } catch {
      toast.error(t.dash.manage.actionFailed);
    } finally {
      setBusy(null);
    }
  };

  const saveAddress = async () => {
    setBusy("address");
    try {
      const { data, error } = await invoke({ action: "subscription-address", address: addr });
      if (error || data?.error) throw new Error(data?.error || "failed");
      toast.success(t.dash.manage.addressSaved);
      setEditingAddr(false);
      onChanged?.();
      await load();
    } catch {
      toast.error(t.dash.manage.actionFailed);
    } finally {
      setBusy(null);
    }
  };

  /* Everything on this dialog is handled here — pause, resume, cancel and the
     address all go straight to the Shopify Admin API and come back into this
     panel. The ONE thing that cannot be local is card entry: card numbers must
     never touch our servers. So instead of dropping the customer into Shopify's
     customer-accounts portal (which shows invoices and no card form), we have
     Shopify email them a secure link to the real form. */
  const [cardEmailSent, setCardEmailSent] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const updateCard = async () => {
    setBusy("card");
    try {
      const { data, error } = await invoke({ action: "subscription-card-email" });
      if (error || data?.error || !data?.sent) throw new Error(data?.error || "failed");
      setCardEmailSent((data.email as string) || "");
      toast.success(t.dash.manage.cardEmailSent);
    } catch {
      toast.error(t.dash.manage.actionFailed);
    } finally {
      setBusy(null);
    }
  };

  const cancelSub = async () => {
    setConfirmingCancel(false);
    await runAction("subscription-cancel", t.dash.manage.canceled);
  };

  const status = detail?.status?.toLowerCase() || subscription?.status || "";
  const isPaused = status === "paused";
  const isCanceled = status === "cancelled" || status === "canceled";
  const statusLabel = isPaused ? t.dash.subPaused : isCanceled ? t.dash.subCanceled : t.dash.subActive;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg rounded-3xl border-border/50 bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/25 to-accent/5 text-accent ring-1 ring-accent/20">
              <Settings className="h-5 w-5" />
            </span>
            <DialogTitle className="font-heading text-2xl font-bold text-primary">{t.dash.manage.title}</DialogTitle>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">{t.dash.manage.loading}</p>
          </div>
        ) : !hasContract ? (
          <div className="py-8 text-center text-sm text-muted-foreground px-4">{t.dash.manage.noContract}</div>
        ) : (
          <div className="space-y-5 py-1">
            {/* Status + next billing */}
            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 p-4">
              <div>
                <p className="text-xs text-muted-foreground">{t.dash.manage.status}</p>
                <p className="font-semibold text-foreground">{statusLabel}</p>
              </div>
              {detail?.nextBillingDate && !isCanceled && (
                <div className="text-end">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><CalendarDays className="w-3.5 h-3.5" />{t.dash.manage.nextBilling}</p>
                  <p className="font-semibold text-foreground">{dfFormat(new Date(detail.nextBillingDate), "MMM d, yyyy", lang)}</p>
                </div>
              )}
            </div>

            {/* Payment card */}
            <div className="rounded-2xl border border-border/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary flex items-center gap-2"><CreditCard className="w-4 h-4 text-muted-foreground" />{t.dash.manage.card}</p>
                <Button variant="outline" size="sm" className="rounded-full gap-1.5 border-accent/40" onClick={updateCard} disabled={busy === "card"}>
                  {busy === "card" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  {t.dash.manage.updateCard}
                </Button>
              </div>
              <p className="text-sm text-foreground">
                {detail?.card
                  ? `${detail.card.brand} ···· ${detail.card.last4} · ${String(detail.card.expMonth).padStart(2, "0")}/${String(detail.card.expYear).slice(-2)}`
                  : detail?.paypalEmail
                  ? `PayPal · ${detail.paypalEmail}`
                  : t.dash.manage.noCard}
              </p>
              {cardEmailSent !== null ? (
                <p className="rounded-xl bg-accent/10 px-3 py-2 text-[11px] leading-snug text-primary">
                  {t.dash.manage.cardEmailNote(cardEmailSent)}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground leading-snug">{t.dash.manage.cardSecureNote}</p>
              )}
            </div>

            {/* Shipping address */}
            <div className="rounded-2xl border border-border/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" />{t.dash.manage.shippingAddress}</p>
                {!editingAddr && (
                  <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => setEditingAddr(true)}>{t.dash.manage.editAddress}</Button>
                )}
              </div>
              {editingAddr ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder={t.dash.subEdit.fullName} value={addr.firstName || ""} onChange={(e) => setAddr({ ...addr, firstName: e.target.value })} className="rounded-xl" />
                    <Input placeholder={t.dash.subEdit.state} value={addr.lastName || ""} onChange={(e) => setAddr({ ...addr, lastName: e.target.value })} className="rounded-xl" />
                  </div>
                  <Input placeholder={t.dash.subEdit.street} value={addr.address1 || ""} onChange={(e) => setAddr({ ...addr, address1: e.target.value })} className="rounded-xl" />
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder={t.dash.subEdit.city} value={addr.city || ""} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className="rounded-xl" />
                    <Input placeholder={t.dash.subEdit.state} value={addr.province || ""} onChange={(e) => setAddr({ ...addr, province: e.target.value })} className="rounded-xl" />
                    <Input placeholder={t.dash.subEdit.zip} value={addr.zip || ""} onChange={(e) => setAddr({ ...addr, zip: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="gold" size="sm" className="rounded-xl flex-1" onClick={saveAddress} disabled={busy === "address"}>
                      {busy === "address" ? <Loader2 className="w-4 h-4 animate-spin" /> : t.dash.manage.saveAddress}
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => { setEditingAddr(false); setAddr(detail?.address || {}); }}>{t.dash.cancel}</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground leading-snug">
                  {detail?.address
                    ? [
                        [detail.address.firstName, detail.address.lastName].filter(Boolean).join(" "),
                        detail.address.address1,
                        [detail.address.city, detail.address.province, detail.address.zip].filter(Boolean).join(", "),
                      ].filter(Boolean).join(" · ")
                    : t.dash.manage.noAddress}
                </p>
              )}
            </div>

            {/* Cancelling asks in the dialog, in the brand's own voice, instead of
                a browser confirm() box. */}
            {!isCanceled && confirmingCancel && (
              <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <p className="text-sm text-primary">{t.dash.manage.cancelConfirm}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="destructive" size="sm" className="rounded-full" onClick={cancelSub} disabled={!!busy}>
                    {busy === "subscription-cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : t.dash.manage.cancelYes}
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full border-border/60" onClick={() => setConfirmingCancel(false)} disabled={!!busy}>
                    {t.dash.manage.cancelNo}
                  </Button>
                </div>
              </div>
            )}

            {/* Pause / resume / cancel */}
            {!isCanceled && !confirmingCancel && (
              <div className="flex flex-wrap gap-2">
                {isPaused ? (
                  <Button variant="outline" className="rounded-xl gap-1.5 flex-1" onClick={() => runAction("subscription-resume", t.dash.manage.resumed)} disabled={!!busy}>
                    {busy === "subscription-resume" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}{t.dash.manage.resume}
                  </Button>
                ) : (
                  <Button variant="outline" className="rounded-xl gap-1.5 flex-1" onClick={() => runAction("subscription-pause", t.dash.manage.paused)} disabled={!!busy}>
                    {busy === "subscription-pause" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}{t.dash.manage.pause}
                  </Button>
                )}
                <Button variant="ghost" className="rounded-full gap-1.5 text-destructive hover:text-destructive" onClick={() => setConfirmingCancel(true)} disabled={!!busy}>
                  <XCircle className="w-4 h-4" />{t.dash.manage.cancelSub}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
