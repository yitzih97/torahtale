import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Camera, Check, User, Image as ImageIcon, Loader2, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ImageCropDialog } from "@/components/ImageCropDialog";

const AGE_BRACKETS = [
  { min: 2, label: "2-3", desc: "Toddler", emoji: "👶" },
  { min: 4, label: "4-5", desc: "Preschool", emoji: "🧒" },
  { min: 6, label: "6-7", desc: "Early Reader", emoji: "📖" },
  { min: 8, label: "8-9", desc: "Explorer", emoji: "🔍" },
  { min: 10, label: "10-12", desc: "Preteen", emoji: "🌟" },
];

export interface EditChildResult {
  name: string;
  age: number | null;
  gender: string | null;
  art_style: string | null;
  photo_url: string | null;
  description: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (child: EditChildResult) => Promise<void> | void;
  isPending?: boolean;
  initialData: {
    name: string;
    age: number | null;
    gender: string | null;
    art_style: string | null;
    photo_url: string | null;
    description: string | null;
  } | null;
}

export function EditChildDialog({ open, onClose, onSubmit, isPending, initialData }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<{ src: string; fileName: string } | null>(null);

  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name || "");
      setGender(initialData.gender || "");
      setAge(initialData.age ? String(initialData.age) : "");
      setDescription(initialData.description || "");
      setPhotoPreview(initialData.photo_url || null);
      setPhotoFile(null);
    }
  }, [open, initialData]);

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return photoPreview;
    setUploading(true);
    try {
      const ext = photoFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("child-photos").upload(path, photoFile);
      if (error) throw error;
      const { data: signed } = await supabase.storage
        .from("child-photos")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      return signed?.signedUrl ?? null;
    } catch (err) {
      console.error("Photo upload failed:", err);
      return photoPreview;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const photoUrl = await uploadPhoto();
    await onSubmit({
      name: name.trim(),
      age: age ? parseInt(age) : null,
      gender: gender || null,
      // Book art style is chosen per-book in the creation wizard, not on the
      // child. Preserve any legacy value rather than overwriting it.
      art_style: initialData?.art_style ?? null,
      photo_url: photoUrl,
      description: description || null,
    });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCropSrc({ src: reader.result as string, fileName: file.name });
    reader.readAsDataURL(file);
  };

  const handleRecrop = async () => {
    if (!photoPreview) return;
    try {
      const res = await fetch(photoPreview, { mode: "cors" });
      const blob = await res.blob();
      const dataUrl: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
      setCropSrc({ src: dataUrl, fileName: "photo.jpg" });
    } catch (err) {
      console.error("Recrop failed:", err);
    }
  };

  const canSave = !!name.trim() && !!gender && !!age;
  const previewSrc = photoPreview;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="wizard-glass max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-[28px] border-white/60 bg-white/85 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35),inset_0_1px_0_0_rgba(255,255,255,0.9)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
          <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-gradient-to-br from-sky-200/40 to-indigo-200/0 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-gradient-to-br from-rose-200/30 to-amber-200/0 blur-3xl" />
        </div>

        <div className="relative p-6 sm:p-8">
          <header className="mb-6">
            <h2 className="font-display text-2xl font-bold text-primary">Edit child profile</h2>
            <p className="text-xs text-muted-foreground mt-1">Update name, photo, and preferences — all in one place.</p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-6">
            {/* Photo column */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-40 h-40 rounded-2xl overflow-hidden bg-muted/50 border border-border/50 ring-1 ring-black/5 shadow-sm">
                {previewSrc ? (
                  <img src={previewSrc} alt="Child" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <User className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs h-8 px-3 rounded-lg border border-border bg-white/70 hover:bg-white font-medium transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  {photoPreview ? "Replace" : "Upload"}
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                </label>
                {photoPreview && (
                  <>
                    <Button type="button" size="sm" variant="ghost" onClick={handleRecrop} className="h-8 text-xs px-2">
                      Recrop
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      className="h-8 text-xs px-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Fields column */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Avi"
                  className="rounded-xl h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Gender</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ key: "boy", label: "Boy" }, { key: "girl", label: "Girl" }].map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setGender(g.key)}
                      className={`rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${
                        gender === g.key
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-foreground hover:border-accent/40"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Age</Label>
                <Input
                  type="number"
                  min={1}
                  max={18}
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    setAge(v);
                  }}
                  placeholder="e.g., 6"
                  className="rounded-xl h-11 w-28"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Description (optional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brown curly hair, big brown eyes, loves blue..."
                  className="rounded-xl min-h-[80px] text-sm"
                />
              </div>
            </div>
          </div>

          <footer className="flex items-center justify-between mt-8 pt-4 border-t border-border/50">
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancel</Button>
            <Button
              variant="gold"
              onClick={handleSave}
              disabled={!canSave || isPending || uploading}
              className="gap-2"
            >
              {uploading || isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <>Save Changes <Check className="w-4 h-4" /></>
              )}
            </Button>
          </footer>
        </div>
      </DialogContent>

      <ImageCropDialog
        open={!!cropSrc}
        imageSrc={cropSrc?.src ?? null}
        fileName={cropSrc?.fileName ?? "photo.jpg"}
        aspect={1}
        onCancel={() => setCropSrc(null)}
        onCropped={(file, dataUrl) => {
          setPhotoFile(file);
          setPhotoPreview(dataUrl);
          setCropSrc(null);
        }}
      />
    </Dialog>
  );
}
