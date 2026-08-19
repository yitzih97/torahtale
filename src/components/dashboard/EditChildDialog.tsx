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
import { useLanguage } from "@/contexts/LanguageContext";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { generateId } from "@/lib/utils";

const AGE_BRACKETS = [
  { min: 0, label: "0-1", desc: "Baby", emoji: "🍼" },
  { min: 2, label: "2-3", desc: "Toddler", emoji: "👶" },
  { min: 4, label: "4-5", desc: "Preschool", emoji: "🧒" },
  { min: 6, label: "6-7", desc: "Early Reader", emoji: "📖" },
  { min: 8, label: "8-9", desc: "Explorer", emoji: "🔍" },
  { min: 10, label: "10-12", desc: "Preteen", emoji: "🌟" },
];

export interface EditChildResult {
  name: string;
  name_he: string | null;
  name_yi: string | null;
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
    name_he: string | null;
    name_yi: string | null;
    age: number | null;
    gender: string | null;
    art_style: string | null;
    photo_url: string | null;
    description: string | null;
  } | null;
}

/** The three name languages a parent can fill in, shown as a toggle. */
const NAME_LANGS: { key: "en" | "he" | "yi"; label: string; rtl?: boolean }[] = [
  { key: "en", label: "English" },
  { key: "he", label: "עברית", rtl: true },
  { key: "yi", label: "ייִדיש", rtl: true },
];

export function EditChildDialog({ open, onClose, onSubmit, isPending, initialData }: Props) {
  const { user } = useAuth();
  const { t, dir, lang } = useLanguage();
  const [name, setName] = useState("");
  const [nameHe, setNameHe] = useState("");
  const [nameYi, setNameYi] = useState("");
  // Which language's name the single input is currently editing. Defaults to the
  // active UI language so a Hebrew user lands straight on the Hebrew name.
  const [nameLang, setNameLang] = useState<"en" | "he" | "yi">("en");
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
      setNameHe(initialData.name_he || "");
      setNameYi(initialData.name_yi || "");
      setNameLang(lang);
      setGender(initialData.gender || "");
      setAge(initialData.age ? String(initialData.age) : "");
      setDescription(initialData.description || "");
      setPhotoPreview(initialData.photo_url || null);
      setPhotoFile(null);
    }
  }, [open, initialData, lang]);

  // Read/write the name for whichever language tab is active.
  const nameValue = nameLang === "he" ? nameHe : nameLang === "yi" ? nameYi : name;
  const setNameValue = (v: string) => {
    if (nameLang === "he") setNameHe(v);
    else if (nameLang === "yi") setNameYi(v);
    else setName(v);
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return photoPreview;
    setUploading(true);
    try {
      const ext = photoFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/${generateId()}.${ext}`;
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
    // The base `name` is required (NOT NULL) and is the fallback for languages
    // with no override — backfill it from whichever name the parent did fill.
    const baseName = name.trim() || nameHe.trim() || nameYi.trim();
    await onSubmit({
      name: baseName,
      name_he: nameHe.trim() || null,
      name_yi: nameYi.trim() || null,
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

  // At least one language's name must be filled (plus gender + age).
  const canSave = (!!name.trim() || !!nameHe.trim() || !!nameYi.trim()) && !!gender && !!age;
  const previewSrc = photoPreview;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-3xl border-border/50 bg-card shadow-[0_30px_80px_-30px_rgba(60,45,15,0.45)]">
        {/* Warm accent wash, in the brand's own gold rather than the sky/indigo
            glass this dialog used to carry. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-gradient-to-br from-accent/15 to-transparent blur-3xl" />
          <div className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-gradient-to-br from-accent/10 to-transparent blur-3xl" />
        </div>

        <div className="relative p-6 sm:p-8" dir={dir}>
          <header className="mb-6 flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/25 to-accent/5 text-accent ring-1 ring-accent/20">
              <User className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary leading-tight">{t.dash.editChildTitle}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t.dash.editChildSubtitle}</p>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-6">
            {/* Photo column */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-40 h-40 rounded-3xl overflow-hidden bg-muted/40 border-2 border-accent/25 ring-1 ring-accent/10 shadow-[0_12px_30px_-16px_rgba(60,45,15,0.5)]">
                {previewSrc ? (
                  <img src={previewSrc} alt="Child" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <User className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs h-8 px-3 rounded-full border border-accent/40 bg-accent/5 text-primary hover:bg-accent/10 font-medium transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  {photoPreview ? t.dash.replacePhoto : t.dash.uploadPhoto}
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                </label>
                {photoPreview && (
                  <>
                    <Button type="button" size="sm" variant="ghost" onClick={handleRecrop} className="h-8 text-xs px-2">
                      {t.dash.recropPhoto}
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
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.dash.childName}</Label>
                {/* Language tabs — edit the name separately per language. */}
                <div className="flex gap-1.5">
                  {NAME_LANGS.map((l) => {
                    const filled = (l.key === "he" ? nameHe : l.key === "yi" ? nameYi : name).trim();
                    return (
                      <button
                        key={l.key}
                        type="button"
                        onClick={() => setNameLang(l.key)}
                        className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all ${
                          nameLang === l.key
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-muted-foreground hover:border-accent/40"
                        }`}
                        dir={l.rtl ? "rtl" : "ltr"}
                      >
                        {l.label}{filled ? " ✓" : ""}
                      </button>
                    );
                  })}
                </div>
                <Input
                  key={nameLang}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  placeholder={t.dash.childNamePlaceholder}
                  className="rounded-xl h-11"
                  dir={nameLang === "en" ? "ltr" : "rtl"}
                />
                <p className="text-[11px] text-muted-foreground">{t.dash.nameLangHint}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.dash.childGender}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ key: "boy", label: t.dash.boy }, { key: "girl", label: t.dash.girl }].map((g) => (
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
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.dash.childAge}</Label>
                <Input
                  type="number"
                  min={0}
                  max={18}
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    setAge(v);
                  }}
                  placeholder={t.dash.childAgePlaceholder}
                  className="rounded-xl h-11 w-28"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.dash.childDescription}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.dash.childDescriptionPlaceholder}
                  className="rounded-xl min-h-[80px] text-sm"
                />
              </div>
            </div>
          </div>

          <footer className="mt-8 flex flex-col-reverse gap-2 border-t border-border/50 pt-5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <Button variant="outline" onClick={onClose} className="h-11 rounded-full border-border/60 sm:min-w-[7rem]">
              {t.dash.cancel}
            </Button>
            <Button
              variant="gold"
              onClick={handleSave}
              disabled={!canSave || isPending || uploading}
              className="h-11 gap-2 rounded-full px-7 sm:min-w-[11rem]"
            >
              {uploading || isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t.dash.saving}</>
              ) : (
                <>{t.dash.saveChanges} <Check className="w-4 h-4" /></>
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
