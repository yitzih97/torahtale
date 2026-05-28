import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Type, Heart, Calendar, Palette, Check, User,
  Camera, Sun, PenLine, Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ImageCropDialog } from "@/components/ImageCropDialog";

/* ── preset images ── */
import presetBoyCartoon from "@/assets/presets/boy-cartoon.jpg";
import presetGirlCartoon from "@/assets/presets/girl-cartoon.jpg";
import presetBoy3dPixar from "@/assets/presets/boy-3d-pixar.jpg";
import presetGirl3dPixar from "@/assets/presets/girl-3d-pixar.jpg";
import presetBoyRealistic from "@/assets/presets/boy-realistic.jpg";
import presetGirlRealistic from "@/assets/presets/girl-realistic.jpg";
import presetToddlerBoy from "@/assets/presets/toddler-boy-cartoon.jpg";
import presetToddlerGirl from "@/assets/presets/toddler-girl-cartoon.jpg";
import presetPreschoolBoy from "@/assets/presets/preschool-boy-cartoon.jpg";
import presetPreschoolGirl from "@/assets/presets/preschool-girl-cartoon.jpg";
import presetExplorerBoy from "@/assets/presets/explorer-boy-cartoon.jpg";
import presetExplorerGirl from "@/assets/presets/explorer-girl-cartoon.jpg";
import presetPreteenBoy from "@/assets/presets/preteen-boy-cartoon.jpg";
import presetPreteenGirl from "@/assets/presets/preteen-girl-cartoon.jpg";

/* ── constants ── */

const TOTAL_STEPS = 5;
const ease = [0.22, 1, 0.36, 1] as const;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const AGE_BRACKETS = [
  { min: 2, max: 3, label: "2-3", desc: "Toddler", emoji: "👶" },
  { min: 4, max: 5, label: "4-5", desc: "Preschool", emoji: "🧒" },
  { min: 6, max: 7, label: "6-7", desc: "Early Reader", emoji: "📖" },
  { min: 8, max: 9, label: "8-9", desc: "Explorer", emoji: "🔍" },
  { min: 10, max: 12, label: "10-12", desc: "Preteen", emoji: "🌟" },
];

const ART_STYLES = [
  { key: "cartoon", label: "Cartoon", desc: "Colorful & whimsical" },
  { key: "3d-pixar", label: "3D Pixar", desc: "Cinematic & polished" },
  { key: "realistic", label: "Realistic", desc: "Lifelike & detailed" },
];

const STEP_LABELS = [
  { label: "Name", icon: Type },
  { label: "Gender", icon: Heart },
  { label: "Age", icon: Calendar },
  { label: "Style", icon: Palette },
  { label: "Photo", icon: Image },
];

/* ── helpers ── */

const getStylePreset = (gender: string, style: string): string => {
  const map: Record<string, Record<string, string>> = {
    boy: { cartoon: presetBoyCartoon, "3d-pixar": presetBoy3dPixar, realistic: presetBoyRealistic },
    girl: { cartoon: presetGirlCartoon, "3d-pixar": presetGirl3dPixar, realistic: presetGirlRealistic },
  };
  return map[gender]?.[style] || presetBoyCartoon;
};

const getAgePreset = (gender: string, ageLabel: string): string => {
  const g = gender || "boy";
  const map: Record<string, Record<string, string>> = {
    boy: { "2-3": presetToddlerBoy, "4-5": presetPreschoolBoy, "6-7": presetBoyCartoon, "8-9": presetExplorerBoy, "10-12": presetPreteenBoy },
    girl: { "2-3": presetToddlerGirl, "4-5": presetPreschoolGirl, "6-7": presetGirlCartoon, "8-9": presetExplorerGirl, "10-12": presetPreteenGirl },
  };
  return map[g]?.[ageLabel] || (g === "girl" ? presetGirlCartoon : presetBoyCartoon);
};

const ageToBracketLabel = (age: string): string => {
  const n = parseInt(age) || 5;
  if (n <= 3) return "2-3";
  if (n <= 5) return "4-5";
  if (n <= 7) return "6-7";
  if (n <= 9) return "8-9";
  return "10-12";
};

/* ── types ── */

export interface AddChildResult {
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
  onSubmit: (child: AddChildResult) => void;
  isPending?: boolean;
  initialData?: {
    name: string;
    age: number | null;
    gender: string | null;
    art_style: string | null;
    photo_url: string | null;
    description: string | null;
  };
  mode?: "add" | "edit";
  initialStep?: number;
}

export function AddChildWizard({ open, onClose, onSubmit, isPending, initialData, mode = "add", initialStep = 1 }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(initialStep);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [artStyle, setArtStyle] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(initialStep);
      setDir(1);
      if (initialData) {
        setName(initialData.name || "");
        setGender(initialData.gender || "");
        setAge(initialData.age ? String(initialData.age) : "");
        setArtStyle(initialData.art_style || "");
        setDescription(initialData.description || "");
        setPhotoPreview(initialData.photo_url || null);
        setPhotoFile(null);
      }
    }
  }, [open, initialData, initialStep]);

  const reset = useCallback(() => {
    setStep(1);
    setDir(1);
    setName("");
    setGender("");
    setAge("");
    setArtStyle("");
    setDescription("");
    setPhotoFile(null);
    setPhotoPreview(null);
  }, []);

  const handleClose = () => { reset(); onClose(); };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return photoPreview; // keep existing URL if no new file
    setUploading(true);
    try {
      const ext = photoFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("child-photos").upload(path, photoFile);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("child-photos").getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err) {
      console.error("Photo upload failed:", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFinish = async () => {
    const photoUrl = await uploadPhoto();
    onSubmit({
      name,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      art_style: artStyle || null,
      photo_url: photoUrl || null,
      description: description || null,
    });
    reset();
  };

  const [cropSrc, setCropSrc] = useState<{ src: string; fileName: string } | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCropSrc({ src: reader.result as string, fileName: file.name });
      reader.readAsDataURL(file);
    }
  };

  const handleRecropExisting = async () => {
    if (!photoPreview) return;
    try {
      // Fetch and convert to data URL to avoid canvas CORS tainting
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
      console.error("Failed to load photo for recrop:", err);
    }
  };

  const next = () => { setDir(1); setStep((s) => Math.min(s + 1, TOTAL_STEPS)); };
  const back = () => { setDir(-1); setStep((s) => Math.max(s - 1, 1)); };

  const canNext = (() => {
    switch (step) {
      case 1: return !!name.trim();
      case 2: return !!gender;
      case 3: return !!age;
      case 4: return !!artStyle;
      case 5: return true; // photo/desc optional
      default: return false;
    }
  })();

  const getPreviewImage = (): string | null => {
    if (photoPreview) return photoPreview;
    if (gender && age && artStyle) return getStylePreset(gender, artStyle);
    if (gender && age) return getAgePreset(gender, ageToBracketLabel(age));
    if (gender) return getStylePreset(gender, "cartoon");
    return null;
  };

  const preview = getPreviewImage();
  const isEdit = mode === "edit";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="wizard-glass max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-[28px] border-white/60 bg-white/85 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35),inset_0_1px_0_0_rgba(255,255,255,0.9)]">
        {/* Ambient orbs for the liquid-glass feel */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
          <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-gradient-to-br from-sky-200/40 to-indigo-200/0 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-gradient-to-br from-rose-200/30 to-amber-200/0 blur-3xl" />
        </div>
        <div className="relative">
        {/* ── Stepper ── */}
        <div className="px-6 sm:px-8 pt-6 pb-2">

          <div className="flex items-center justify-between gap-1">
            {STEP_LABELS.map((s, i) => {
              const stepNum = i + 1;
              const isActive = stepNum === step;
              const isCompleted = stepNum < step;
              return (
                <div key={s.label} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-500 ${
                      isCompleted ? "bg-accent text-accent-foreground"
                      : isActive ? "bg-accent/15 text-accent ring-2 ring-accent/30"
                      : "bg-muted text-muted-foreground"
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-[10px] font-medium transition-colors duration-300 ${
                      isActive ? "text-accent" : isCompleted ? "text-foreground" : "text-muted-foreground"
                    }`}>{s.label}</span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`flex-1 h-px mx-2 transition-colors duration-500 ${isCompleted ? "bg-accent" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={false}
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="p-6 sm:p-8 pt-4">
          {/* Layout with preview */}
          <div className={step >= 2 ? "flex flex-col sm:flex-row gap-6" : ""}>
            {step >= 2 && (
              <div className="sm:order-2 flex-shrink-0 flex justify-center sm:pt-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-muted/50 border border-border/50 shadow-sm">
                    {preview ? (
                      <img src={preview} alt="Character preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <User className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  {(name || age || gender) && (
                    <p className="text-xs text-muted-foreground text-center">
                      {name && <span className="font-semibold text-foreground">{name}</span>}
                      {age && <span> · {age}yo</span>}
                      {gender && <span> · {gender}</span>}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 sm:order-1">
              <AnimatePresence mode="wait" custom={dir}>
                {/* Step 1: Name */}
                {step === 1 && (
                  <motion.div key="s1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }} className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
                        <Type className="w-6 h-6 text-accent" /> {isEdit ? "Update your child's name" : "What's your child's name?"}
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1">This will be used for their profile and all future books.</p>
                    </div>
                    <Input
                      placeholder="e.g., Chaya Mushka"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-xl h-14 text-lg px-5"
                      autoFocus
                    />
                  </motion.div>
                )}

                {/* Step 2: Gender */}
                {step === 2 && (
                  <motion.div key="s2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }} className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
                        <Heart className="w-6 h-6 text-accent" /> Is {name || "your child"} a boy or a girl?
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1">This shapes the character's appearance in illustrations.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: "boy", label: "Boy", detail: "Will wear a kippah", img: presetBoyCartoon },
                        { key: "girl", label: "Girl", detail: "Modest dress", img: presetGirlCartoon },
                      ].map((g) => (
                        <button
                          key={g.key}
                          onClick={() => setGender(g.key)}
                          className={`rounded-2xl border-2 overflow-hidden text-center transition-all duration-300 active:scale-[0.97] ${
                            gender === g.key
                              ? "border-accent bg-accent/5 shadow-md"
                              : "border-border hover:border-accent/30"
                          }`}
                        >
                          <div className="aspect-square overflow-hidden bg-muted/30">
                            <img src={g.img} alt={g.label} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-3">
                            <p className="font-display font-semibold text-primary">{g.label}</p>
                            <p className="text-[11px] text-muted-foreground">{g.detail}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Age */}
                {step === 3 && (
                  <motion.div key="s3" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }} className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-accent" /> How old is {name || "your child"}?
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1">We'll match the character's look to their age.</p>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {AGE_BRACKETS.map((bracket) => {
                        const isSelected = age && parseInt(age) >= bracket.min && parseInt(age) <= bracket.max;
                        const previewImg = gender ? getAgePreset(gender, bracket.label) : null;
                        return (
                          <button
                            key={bracket.label}
                            onClick={() => setAge(String(bracket.min))}
                            className={`rounded-2xl border-2 overflow-hidden text-center transition-all duration-300 active:scale-[0.97] ${
                              isSelected
                                ? "border-accent bg-accent/5 shadow-md"
                                : "border-border hover:border-accent/30"
                            }`}
                          >
                            {previewImg && (
                              <div className="aspect-square overflow-hidden">
                                <img src={previewImg} alt={bracket.desc} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="p-2">
                              <p className="text-lg">{bracket.emoji}</p>
                              <p className="font-display font-semibold text-xs text-primary">{bracket.label}</p>
                              <p className="text-[10px] text-muted-foreground">{bracket.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Art Style */}
                {step === 4 && (
                  <motion.div key="s4" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }} className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
                        <Palette className="w-6 h-6 text-accent" /> Pick a preferred art style
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1">This will be the default style for {name || "your child"}'s books.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {ART_STYLES.map((style) => {
                        const previewImg = gender ? getStylePreset(gender, style.key) : getStylePreset("boy", style.key);
                        return (
                          <button
                            key={style.key}
                            onClick={() => setArtStyle(style.key)}
                            className={`rounded-2xl border-2 overflow-hidden text-center transition-all duration-300 active:scale-[0.97] ${
                              artStyle === style.key
                                ? "border-accent bg-accent/5 shadow-md"
                                : "border-border hover:border-accent/30"
                            }`}
                          >
                            <div className="aspect-[3/2] overflow-hidden">
                              <img src={previewImg} alt={style.label} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-3">
                              <p className="font-display font-semibold text-primary text-sm">{style.label}</p>
                              <p className="text-[11px] text-muted-foreground">{style.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Step 5: Photo / Description */}
                {step === 5 && (
                  <motion.div key="s5" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease }} className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
                        <Image className="w-6 h-6 text-accent" /> Help us draw {name || "your child"}
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1">Upload a photo or describe your child's appearance. Both are optional!</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Upload option */}
                      <div className="rounded-2xl border-2 border-dashed border-border p-5 text-center hover:border-accent/50 hover:bg-accent/5 transition-all duration-300 relative">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-primary">Upload a Photo</p>
                            <p className="text-xs text-muted-foreground mt-1">Best results with clear face photos</p>
                          </div>
                          {photoPreview ? (
                            <div className="flex flex-col items-center gap-3 w-full">
                              <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-2xl object-cover ring-2 ring-accent/20" />
                              <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="gold-outline"
                                  onClick={handleRecropExisting}
                                  className="text-xs h-8"
                                >
                                  Recrop
                                </Button>
                                <label className="inline-flex items-center justify-center text-xs h-8 px-4 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer font-medium">
                                  Replace
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoSelect}
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                                  className="text-xs text-destructive hover:underline font-medium px-2"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoSelect}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          )}
                        </div>

                        <div className="mt-4 rounded-xl bg-accent/5 border border-accent/15 p-3 text-left">
                          <p className="text-xs font-semibold text-accent mb-1.5 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5" /> Tips for best results
                          </p>
                          <ul className="text-[11px] text-muted-foreground space-y-1">
                            <li className="flex items-start gap-1.5"><User className="w-3 h-3 mt-0.5 flex-shrink-0 text-accent/60" /> Face clearly visible</li>
                            <li className="flex items-start gap-1.5"><Sun className="w-3 h-3 mt-0.5 flex-shrink-0 text-accent/60" /> Good lighting</li>
                            <li className="flex items-start gap-1.5"><Camera className="w-3 h-3 mt-0.5 flex-shrink-0 text-accent/60" /> Close-up portrait</li>
                          </ul>
                        </div>
                      </div>

                      {/* Description option */}
                      <div className="rounded-2xl border-2 border-border p-5">
                        <div className="flex flex-col items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <PenLine className="w-6 h-6 text-primary" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-primary">Describe Instead</p>
                            <p className="text-xs text-muted-foreground mt-1">Tell us what your child looks like</p>
                          </div>
                        </div>
                        <Textarea
                          placeholder="e.g., Brown curly hair, olive skin, big brown eyes, loves wearing blue..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="rounded-xl min-h-[120px] text-sm"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/50">
            <Button
              variant="ghost"
              onClick={step === 1 ? handleClose : back}
              className="gap-2 text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 1 ? "Cancel" : "Back"}
            </Button>

            {step < TOTAL_STEPS ? (
              <Button
                variant="gold"
                onClick={next}
                disabled={!canNext}
                className="gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="gold"
                onClick={handleFinish}
                disabled={!canNext || isPending || uploading}
                className="gap-2"
              >
                {uploading ? "Uploading..." : isPending ? (isEdit ? "Saving..." : "Adding...") : (isEdit ? "Save Changes" : "Add Child")} <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
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
