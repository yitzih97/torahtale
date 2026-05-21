import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CreditCard, ExternalLink } from "lucide-react";
import type { SubscriptionRecord } from "@/hooks/useSubscriptions";
import type { ChildRecord } from "@/hooks/useChildren";

const SHOPIFY_ACCOUNT_URL = "https://fek120-t9.myshopify.com/account";

interface Props {
  open: boolean;
  onClose: () => void;
  subscription: SubscriptionRecord | null;
  children: ChildRecord[];
  onSave: (updates: Partial<SubscriptionRecord> & { id: string }) => Promise<void>;
  isSaving?: boolean;
}

export function SubscriptionEditDialog({ open, onClose, subscription, children, onSave, isSaving }: Props) {
  const [childId, setChildId] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("weekly");
  const [shipping, setShipping] = useState({
    fullName: "",
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  useEffect(() => {
    if (!subscription) return;
    setChildId(subscription.child_id || "");
    setFrequency(subscription.frequency || "weekly");
    const s = (subscription.shipping_data as any) || {};
    setShipping({
      fullName: s.fullName || subscription.child_name || "",
      street: s.street || "",
      city: s.city || "",
      state: s.state || "",
      zip: s.zip || "",
    });
  }, [subscription]);

  if (!subscription) return null;

  const handleSave = async () => {
    const selectedChild = children.find((c) => c.id === childId);
    await onSave({
      id: subscription.id,
      child_id: childId || null,
      child_name: selectedChild?.name || subscription.child_name,
      frequency,
      shipping_data: { ...(subscription.shipping_data || {}), ...shipping },
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-primary">Edit Subscription</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Child</Label>
            <Select value={childId} onValueChange={setChildId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Choose child" />
              </SelectTrigger>
              <SelectContent>
                {children.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <Label className="text-sm font-medium text-primary">Shipping Address</Label>
            <Input
              placeholder="Full Name"
              value={shipping.fullName}
              onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
              className="rounded-xl"
            />
            <Input
              placeholder="Street Address"
              value={shipping.street}
              onChange={(e) => setShipping({ ...shipping, street: e.target.value })}
              className="rounded-xl"
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="City"
                value={shipping.city}
                onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                className="rounded-xl"
              />
              <Input
                placeholder="State"
                value={shipping.state}
                onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                className="rounded-xl"
              />
              <Input
                placeholder="ZIP"
                value={shipping.zip}
                onChange={(e) => setShipping({ ...shipping, zip: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <Label className="text-sm font-medium text-primary mb-2 block">Payment Method</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl gap-2"
              onClick={() => window.open(SHOPIFY_ACCOUNT_URL, "_blank", "noopener,noreferrer")}
            >
              <CreditCard className="w-4 h-4" />
              Manage Payment Method
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Payment methods are securely managed in your Shopify account.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button variant="gold" onClick={handleSave} disabled={isSaving} className="rounded-xl">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
