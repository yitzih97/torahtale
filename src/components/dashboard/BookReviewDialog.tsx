import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { BookRecord } from "@/hooks/useBooks";

interface Props {
  book: BookRecord | null;
  open: boolean;
  onClose: () => void;
}

export function BookReviewDialog({ book, open, onClose }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["book-review", book?.id, user?.id],
    enabled: !!book && !!user && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_reviews")
        .select("*")
        .eq("book_id", book!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existing) {
      setRating(existing.rating || 0);
      setComment(existing.comment || "");
      setName(existing.reviewer_name || user?.user_metadata?.full_name || "");
    } else if (open) {
      setRating(0);
      setComment("");
      setName(user?.user_metadata?.full_name || "");
    }
  }, [existing, open, user]);

  if (!book) return null;

  const handleSave = async () => {
    if (!user) return;
    if (rating < 1) { toast.error(t.dash.review.pickRating); return; }
    setSaving(true);
    try {
      const payload = {
        book_id: book.id,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
        reviewer_name: name.trim() || null,
        approved: false,
      };
      const { error } = await supabase
        .from("book_reviews")
        .upsert(payload, { onConflict: "book_id,user_id" });
      if (error) throw error;
      toast.success(existing ? t.dash.review.updated : t.dash.review.thanks);
      queryClient.invalidateQueries({ queryKey: ["book-review", book.id, user.id] });
      onClose();
    } catch (err: any) {
      toast.error(err?.message || t.dash.review.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("book_reviews").delete().eq("id", existing.id);
      if (error) throw error;
      toast.success(t.dash.review.removed);
      queryClient.invalidateQueries({ queryKey: ["book-review", book.id, user!.id] });
      onClose();
    } catch (err: any) {
      toast.error(err?.message || t.dash.review.deleteError);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl bg-white/85 backdrop-blur-xl border border-white/70 ring-1 ring-black/5">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {existing ? t.dash.review.editTitle : t.dash.review.title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {book.torah_portion || t.dash.book.taleFallback} · {t.dash.forChild(book.child_name || t.dash.yourChild)}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Stars */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = (hover || rating) >= n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(n)}
                      className="p-1 transition-transform hover:scale-110 active:scale-95"
                      aria-label={t.dash.review.starLabel(n)}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {rating === 0 ? t.dash.review.tapToRate : t.dash.review.outOf(rating)}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.dash.review.yourName}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.dash.review.namePlaceholder}
                className="rounded-2xl bg-white/60 border-white/70"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.dash.review.comment}</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t.dash.review.commentPlaceholder}
                rows={4}
                className="rounded-2xl bg-white/60 border-white/70 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              {existing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting || saving}
                  className="rounded-2xl gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {t.dash.review.delete}
                </Button>
              )}
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={onClose} className="rounded-2xl">
                {t.dash.cancel}
              </Button>
              <Button variant="gold" size="sm" onClick={handleSave} disabled={saving} className="rounded-2xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : existing ? t.dash.review.update : t.dash.review.submit}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
