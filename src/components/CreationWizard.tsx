import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Upload, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SparkleEffect } from "./SparkleEffect";
import { BookViewer } from "./wizard/BookViewer";
import { ShippingForm, DEFAULT_SHIPPING, type ShippingData } from "./wizard/ShippingForm";
import { CheckoutStep } from "./wizard/CheckoutStep";
import { SuccessStep } from "./wizard/SuccessStep";
import { TORAH_PORTIONS } from "./wizard/TorahPortions";

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

const TOTAL_STEPS = 8;
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
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<WizardData>(initialData);
  const [generating, setGenerating] = useState(false);
  const [shipping, setShipping] = useState<ShippingData>(DEFAULT_SHIPPING);
  const [genText, setGenText] = useState("");
  const [portionFilter, setPortionFilter] = useState<"all" | "torah" | "holiday">("all");

  const update = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const next = () => {
    // Step 3 → trigger generation
    if (step === 3) {
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
    if (file) update({ photo: file, photoPreview: URL.createObjectURL(file) });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) update({ photo: file, photoPreview: URL.createObjectURL(file) });
  };

  const handlePlaceOrder = () => {
    setDir(1);
    setStep(8);
  };

  if (!open) return null;

  const canNext =
    (step === 1 && data.childName && data.age && data.gender) ||
    (step === 2 && data.torahPortion) ||
    step === 3 ||
    step === 5 ||
    (step === 6 && shipping.fullName && shipping.street && shipping.city && shipping.state && shipping.zip);

  const progressPct = step === 4 ? 45 : (step / TOTAL_STEPS) * 100;

  const filteredPortions = portionFilter === "all"
    ? TORAH_PORTIONS
    : TORAH_PORTIONS.filter((p) => p.category === portionFilter);

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
          <motion.div className="h-full bg-accent" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5, ease }} />
        </div>

        <div className="p-6 sm:p-8">
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>

          <AnimatePresence mode="wait" custom={dir}>
            {/* STEP 1: The Hero */}
            {step === 1 && (
              <motion.div key="s1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }} className="space-y-6">
                <div>
                  <span className="font-mono text-xs tracking-widest text-accent uppercase">Step 1 of {TOTAL_STEPS}</span>
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
                    <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="mt-1 border-2 border-dashed border-border rounded-book p-6 text-center cursor-pointer hover:border-accent transition-colors relative">
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

            {/* STEP 2: The Journey */}
            {step === 2 && (
              <motion.div key="s2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }} className="space-y-6">
                <div>
                  <span className="font-mono text-xs tracking-widest text-accent uppercase">Step 2 of {TOTAL_STEPS}</span>
                  <h2 className="font-display text-2xl font-bold text-primary mt-1">The Journey</h2>
                  <p className="text-muted-foreground text-sm mt-1">Which story will {data.childName || "your child"} explore?</p>
                </div>
                {/* Filter tabs */}
                <div className="flex gap-2">
                  {(["all", "torah", "holiday"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setPortionFilter(f)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-300 capitalize ${
                        portionFilter === f ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f === "all" ? "All" : f === "torah" ? "Torah Portions" : "Holidays"}
                    </button>
                  ))}
                </div>
                <div className="grid gap-2 max-h-[40vh] overflow-y-auto pr-1">
                  {filteredPortions.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => update({ torahPortion: p.value })}
                      className={`p-3 rounded-book border-2 text-left transition-all duration-300 active:scale-[0.98] ${
                        data.torahPortion === p.value
                          ? "border-accent bg-accent/5 shadow-soft-sm"
                          : "border-border hover:border-accent/40"
                      }`}
                    >
                      <span className="font-display text-base font-semibold text-primary">{p.label}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">{p.sub}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: The Magic */}
            {step === 3 && (
              <motion.div key="s3" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }} className="space-y-6">
                <div>
                  <span className="font-mono text-xs tracking-widest text-accent uppercase">Step 3 of {TOTAL_STEPS}</span>
                  <h2 className="font-display text-2xl font-bold text-primary mt-1">The Magic</h2>
                  <p className="text-muted-foreground text-sm mt-1">Choose the look and language of your book.</p>
                </div>
                <div className="space-y-5">
                  <div>
                    <Label className="mb-2 block">Art Style</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {["cartoon", "3d-pixar", "graphic-novel"].map((s) => (
                        <button key={s} onClick={() => update({ artStyle: s })} className={`p-3 rounded-book border-2 text-center transition-all duration-300 active:scale-[0.97] ${data.artStyle === s ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"}`}>
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
                        <button key={l} onClick={() => update({ language: l })} className={`p-3 rounded-book border-2 text-center transition-all duration-300 active:scale-[0.97] ${data.language === l ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"}`}>
                          <span className="text-sm font-medium capitalize text-primary">{l}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Generating */}
            {step === 4 && generating && (
              <motion.div key="s4" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }} className="py-16 text-center space-y-6 relative">
                <SparkleEffect count={15} />
                <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto" />
                <motion.p key={genText} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-xl text-primary">
                  {genText}
                </motion.p>
                <p className="text-sm text-muted-foreground">Creating something extraordinary for {data.childName || "your child"}...</p>
              </motion.div>
            )}

            {/* STEP 5: Book Viewer */}
            {step === 5 && (
              <motion.div key="s5" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }}>
                <BookViewer childName={data.childName} torahPortion={data.torahPortion} />
              </motion.div>
            )}

            {/* STEP 6: Shipping */}
            {step === 6 && (
              <motion.div key="s6" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }}>
                <ShippingForm data={shipping} onChange={setShipping} />
              </motion.div>
            )}

            {/* STEP 7: Checkout */}
            {step === 7 && (
              <motion.div key="s7" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }}>
                <CheckoutStep
                  childName={data.childName}
                  torahPortion={data.torahPortion}
                  artStyle={data.artStyle}
                  shipping={shipping}
                  onPlaceOrder={handlePlaceOrder}
                />
              </motion.div>
            )}

            {/* STEP 8: Success */}
            {step === 8 && (
              <motion.div key="s8" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }}>
                <SuccessStep
                  childName={data.childName}
                  onGoToDashboard={() => {
                    onClose();
                    navigate("/dashboard");
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav buttons */}
          {step !== 4 && step !== 7 && step !== 8 && (
            <div className="flex justify-between mt-8">
              {step > 1 ? (
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
              {step === 5 && (
                <Button variant="gold" onClick={next}>Approve & Continue <ArrowRight className="w-4 h-4" /></Button>
              )}
              {step === 6 && (
                <Button variant="gold" onClick={next} disabled={!canNext}>Continue to Checkout <ArrowRight className="w-4 h-4" /></Button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
