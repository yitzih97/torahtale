import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Upload, X, Loader2, Check, ShoppingCart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SparkleEffect } from "./SparkleEffect";
import heroBook from "@/assets/hero-book.png";
import samplePage from "@/assets/sample-page.png";

interface WizardData {
  childName: string;
  age: string;
  gender: string;
  photo: File | null;
  photoPreview: string | null;
  torahPortion: string;
  artStyle: string;
  language: string;
}

const initialData: WizardData = {
  childName: "",
  age: "",
  gender: "",
  photo: null,
  photoPreview: null,
  torahPortion: "",
  artStyle: "cartoon",
  language: "english",
};

const TOTAL_STEPS = 5;
const ease = [0.22, 1, 0.36, 1] as const;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0, filter: "blur(4px)" }),
  center: { x: 0, opacity: 1, filter: "blur(0px)" },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0, filter: "blur(4px)" }),
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreationWizard = ({ open, onClose }: Props) => {
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<WizardData>(initialData);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [genText, setGenText] = useState("");

  const update = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const next = () => {
    if (step === 3 && !generated) {
      setDir(1);
      setStep(4);
      setGenerating(true);
      const texts = ["Weaving the magic...", "Writing story...", "Illustrating pages...", "Almost there..."];
      let i = 0;
      setGenText(texts[0]);
      const iv = setInterval(() => {
        i++;
        if (i < texts.length) setGenText(texts[i]);
      }, 800);
      setTimeout(() => {
        clearInterval(iv);
        setGenerating(false);
        setGenerated(true);
        setStep(5);
      }, 3200);
      return;
    }
    setDir(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const back = () => {
    setDir(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      update({ photo: file, photoPreview: URL.createObjectURL(file) });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      update({ photo: file, photoPreview: URL.createObjectURL(file) });
    }
  };

  if (!open) return null;

  const canNext =
    (step === 1 && data.childName && data.age && data.gender) ||
    (step === 2 && data.torahPortion) ||
    step === 3 ||
    step === 5;

  const progressPct = step === 4 ? 80 : (step / TOTAL_STEPS) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.4, ease }}
        className="bg-card rounded-book shadow-soft-lg w-full max-w-xl max-h-[90vh] overflow-y-auto relative"
      >
        {/* Progress */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-accent"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease }}
          />
        </div>

        <div className="p-6 sm:p-8">
          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>

          <AnimatePresence mode="wait" custom={dir}>
            {step === 1 && (
              <motion.div key="s1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }} className="space-y-6">
                <div>
                  <span className="font-mono text-xs tracking-widest text-accent uppercase">Step 1 of 5</span>
                  <h2 className="font-display text-2xl font-bold text-primary mt-1">The Hero</h2>
                  <p className="text-muted-foreground text-sm mt-1">Tell us about the star of this story.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="childName">Child's Name</Label>
                    <Input id="childName" placeholder="e.g., Sarah / שרה" value={data.childName} onChange={(e) => update({ childName: e.target.value })} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Age</Label>
                      <Select value={data.age} onValueChange={(v) => update({ age: v })}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Age" /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 11 }, (_, i) => i + 2).map((a) => (
                            <SelectItem key={a} value={String(a)}>{a} years old</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select value={data.gender} onValueChange={(v) => update({ gender: v })}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="boy">Boy</SelectItem>
                          <SelectItem value="girl">Girl</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Upload Photo (optional)</Label>
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="mt-1 border-2 border-dashed border-border rounded-book p-6 text-center cursor-pointer hover:border-accent transition-colors relative"
                    >
                      {data.photoPreview ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={data.photoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
                          <button onClick={() => update({ photo: null, photoPreview: null })} className="text-xs text-destructive hover:underline">Remove</button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                          <input type="file" accept="image/*" onChange={handlePhoto} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }} className="space-y-6">
                <div>
                  <span className="font-mono text-xs tracking-widest text-accent uppercase">Step 2 of 5</span>
                  <h2 className="font-display text-2xl font-bold text-primary mt-1">The Journey</h2>
                  <p className="text-muted-foreground text-sm mt-1">Which Torah portion will {data.childName || "your child"} explore?</p>
                </div>
                <div className="grid gap-3">
                  {[
                    { value: "noach", label: "Noah's Ark", sub: "Parashat Noach" },
                    { value: "beshalach", label: "The Parting of the Sea", sub: "Parashat Beshalach" },
                  ].map((p) => (
                    <button
                      key={p.value}
                      onClick={() => update({ torahPortion: p.value })}
                      className={`p-4 rounded-book border-2 text-left transition-all duration-300 active:scale-[0.98] ${
                        data.torahPortion === p.value
                          ? "border-accent bg-accent/5 shadow-soft-sm"
                          : "border-border hover:border-accent/40"
                      }`}
                    >
                      <span className="font-display text-lg font-semibold text-primary">{p.label}</span>
                      <span className="block text-sm text-muted-foreground mt-0.5">{p.sub}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }} className="space-y-6">
                <div>
                  <span className="font-mono text-xs tracking-widest text-accent uppercase">Step 3 of 5</span>
                  <h2 className="font-display text-2xl font-bold text-primary mt-1">The Magic</h2>
                  <p className="text-muted-foreground text-sm mt-1">Choose the look and language of your book.</p>
                </div>
                <div className="space-y-5">
                  <div>
                    <Label className="mb-2 block">Art Style</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {["cartoon", "3d-pixar", "graphic-novel"].map((s) => (
                        <button
                          key={s}
                          onClick={() => update({ artStyle: s })}
                          className={`p-3 rounded-book border-2 text-center transition-all duration-300 active:scale-[0.97] ${
                            data.artStyle === s ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
                          }`}
                        >
                          <span className="text-sm font-medium capitalize text-primary">
                            {s === "3d-pixar" ? "3D Pixar" : s === "graphic-novel" ? "Graphic Novel" : "Cartoon"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">Language</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {["english", "hebrew", "bilingual"].map((l) => (
                        <button
                          key={l}
                          onClick={() => update({ language: l })}
                          className={`p-3 rounded-book border-2 text-center transition-all duration-300 active:scale-[0.97] ${
                            data.language === l ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
                          }`}
                        >
                          <span className="text-sm font-medium capitalize text-primary">{l}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && generating && (
              <motion.div key="s4" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }} className="py-16 text-center space-y-6 relative">
                <SparkleEffect count={15} />
                <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto" />
                <motion.p
                  key={genText}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-display text-xl text-primary"
                >
                  {genText}
                </motion.p>
                <p className="text-sm text-muted-foreground">Creating something extraordinary for {data.childName || "your child"}...</p>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="s5" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }} className="space-y-6">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="font-mono text-xs tracking-widest text-accent uppercase">Preview Ready</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-primary">
                  {data.childName}'s Torah Tale
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <img src={heroBook} alt="Book cover preview" className="rounded-book shadow-soft-md w-full" />
                  <img src={samplePage} alt="Sample inside page" className="rounded-book shadow-soft-md w-full" />
                </div>
                <div className="bg-secondary rounded-book p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Format</span>
                    <span className="font-medium text-primary">Hardcover</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Torah Portion</span>
                    <span className="font-medium text-primary capitalize">{data.torahPortion === "noach" ? "Parashat Noach" : "Parashat Beshalach"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Art Style</span>
                    <span className="font-medium text-primary capitalize">{data.artStyle === "3d-pixar" ? "3D Pixar" : data.artStyle === "graphic-novel" ? "Graphic Novel" : "Cartoon"}</span>
                  </div>
                  <div className="border-t border-border mt-2 pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-accent">$34.99</span>
                  </div>
                </div>
                <Button variant="gold" size="lg" className="w-full" onClick={() => { alert("Mock checkout — Stripe integration coming soon!"); }}>
                  <ShoppingCart className="w-4 h-4" />
                  Proceed to Secure Checkout
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav buttons */}
          {step !== 4 && (
            <div className="flex justify-between mt-8">
              {step > 1 && step !== 5 ? (
                <Button variant="outline" onClick={back}><ArrowLeft className="w-4 h-4" /> Back</Button>
              ) : <div />}
              {step < 3 && (
                <Button variant="gold" onClick={next} disabled={!canNext}>Next <ArrowRight className="w-4 h-4" /></Button>
              )}
              {step === 3 && (
                <Button variant="gold" onClick={next}>
                  <Sparkles className="w-4 h-4" /> Generate Book
                </Button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
