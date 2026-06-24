import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cropFromDataUrl, fileToDataUrl, downscaleDataUrl } from "@/lib/cropFromBbox";
import { toast } from "sonner";

export type DetectedRole = "tatty" | "mommy" | "child";

export interface DetectedPerson {
  role: DetectedRole;
  gender: "boy" | "girl";
  approxAge: number;
  description: string;
  bbox: { x: number; y: number; w: number; h: number };
}

export interface ReviewedPerson {
  role: DetectedRole;
  gender: "boy" | "girl";
  name: string;
  age: string;
  description: string;
  photo: File;
  photoPreview: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  t: any;
  onConfirm: (people: ReviewedPerson[]) => void;
}

export const FamilyPhotoDialog = ({ open, onOpenChange, t, onConfirm }: Props) => {
  const [sourceDataUrl, setSourceDataUrl] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [people, setPeople] = useState<
    Array<DetectedPerson & { name: string; age: string; photoPreview: string; photoFile: File }>
  >([]);

  const reset = () => {
    setSourceDataUrl(null);
    setPeople([]);
    setDetecting(false);
  };

  const handleFile = async (file: File) => {
    setDetecting(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setSourceDataUrl(dataUrl);
      // Send a downscaled copy to the detector (full-res photos make the edge
      // function time out / crash → "Failed to send a request"). Crops below
      // still use the full-res original for quality.
      const small = await downscaleDataUrl(dataUrl, 1024, 0.82);
      const base64 = small.split(",")[1];
      // Hard client-side timeout so the spinner can never hang indefinitely.
      const timeout = new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error(t.wizard.detectTimeout || "This is taking too long. Please try again, or skip and describe your child instead.")), 35000),
      );
      const invoke = supabase.functions.invoke("detect-family-photo", {
        body: { imageBase64: base64, mimeType: "image/jpeg" },
      });
      const { data, error } = await Promise.race([invoke, timeout]);
      if (error) throw error;
      const detected: DetectedPerson[] = data?.people || [];
      if (!detected.length) {
        toast.error(t.wizard.noPeopleFound);
        reset();
        return;
      }
      const cropped = await Promise.all(
        detected.map(async (p, i) => {
          const { file: cropFile, dataUrl: cropUrl } = await cropFromDataUrl(
            dataUrl,
            p.bbox,
            `person-${i + 1}.jpg`,
          );
          return {
            ...p,
            name: "",
            age: String(p.approxAge || ""),
            photoPreview: cropUrl,
            photoFile: cropFile,
          };
        }),
      );
      setPeople(cropped);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Detection failed");
      reset();
    } finally {
      setDetecting(false);
    }
  };

  const handleConfirm = () => {
    const incomplete = people.some((p) => !p.name.trim() || !p.age.trim());
    if (incomplete) {
      toast.error(t.wizard.fillAllFields || "Please fill in name and age for everyone");
      return;
    }
    const out: ReviewedPerson[] = people.map((p) => ({
      role: p.role,
      gender: p.role === "tatty" ? "boy" : p.role === "mommy" ? "girl" : p.gender,
      name: p.name.trim(),
      age: p.age.trim(),
      description: p.description,
      photo: p.photoFile,
      photoPreview: p.photoPreview,
    }));
    onConfirm(out);
    reset();
    onOpenChange(false);
  };

  const roleLabel = (r: DetectedRole) =>
    r === "tatty" ? t.wizard.roleTatty : r === "mommy" ? t.wizard.roleMommy : t.wizard.roleChild;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="wizard-glass max-w-lg p-0 overflow-hidden rounded-3xl max-h-[90vh] flex flex-col border-border/40 shadow-2xl">
        <div className="relative p-6 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20 shrink-0">
              <Users className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="font-display text-xl font-bold text-foreground">
                {people.length ? t.wizard.reviewFamily : t.wizard.uploadFamilyPhoto}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t.wizard.familyPhotoHint}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!sourceDataUrl && !detecting && (
            <label className="group flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-accent/30 bg-gradient-to-b from-accent/5 to-transparent p-12 cursor-pointer hover:border-accent/60 hover:from-accent/10 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <Camera className="w-7 h-7 text-accent" />
              </div>
              <span className="font-display text-base font-semibold text-foreground">
                {t.wizard.uploadFamilyPhoto}
              </span>
              <span className="text-xs text-muted-foreground text-center max-w-[15rem]">
                {t.wizard.familyPhotoHint}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) handleFile(f);
                }}
              />
            </label>
          )}

          {detecting && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-accent animate-spin" />
              </div>
              <p className="text-sm font-medium text-foreground">{t.wizard.detectingFamily}</p>
            </div>
          )}

          {people.length > 0 && (
            <div className="space-y-3">
              {people.map((p, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 items-center p-3 rounded-xl border border-border/40 bg-card/40"
                >
                  <img
                    src={p.photoPreview}
                    alt={`Person ${idx + 1}`}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex gap-1.5">
                      {(["tatty", "mommy", "child"] as DetectedRole[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() =>
                            setPeople((prev) =>
                              prev.map((pp, i) => (i === idx ? { ...pp, role: r } : pp)),
                            )
                          }
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                            p.role === r
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                          }`}
                        >
                          {roleLabel(r)}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder={t.wizard.namePlaceholderRole(roleLabel(p.role))}
                        value={p.name}
                        onChange={(e) =>
                          setPeople((prev) =>
                            prev.map((pp, i) => (i === idx ? { ...pp, name: e.target.value } : pp)),
                          )
                        }
                        className="h-9 text-sm"
                      />
                      <Input
                        type="number"
                        min={0}
                        max={99}
                        placeholder={t.wizard.age || "Age"}
                        value={p.age}
                        onChange={(e) =>
                          setPeople((prev) =>
                            prev.map((pp, i) => (i === idx ? { ...pp, age: e.target.value } : pp)),
                          )
                        }
                        className="h-9 text-sm w-20"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {people.length > 0 && (
          <div className="px-5 py-4 border-t border-border/40 flex gap-2 justify-end">
            <Button variant="outline" onClick={reset} className="rounded-full">
              {t.wizard.tryAgain || "Try Again"}
            </Button>
            <Button onClick={handleConfirm} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              {t.wizard.addToBook}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
