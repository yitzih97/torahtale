import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cropFromDataUrl, fileToDataUrl } from "@/lib/cropFromBbox";
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
      const base64 = dataUrl.split(",")[1];
      const { data, error } = await supabase.functions.invoke("detect-family-photo", {
        body: { imageBase64: base64, mimeType: file.type || "image/jpeg" },
      });
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
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-border/40">
          <DialogTitle className="font-display text-lg font-bold text-primary flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            {people.length ? t.wizard.reviewFamily : t.wizard.uploadFamilyPhoto}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t.wizard.familyPhotoHint}
          </DialogDescription>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!sourceDataUrl && !detecting && (
            <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/60 bg-card/40 p-10 cursor-pointer hover:border-accent/50 transition">
              <Camera className="w-8 h-8 text-accent" />
              <span className="font-display text-sm font-semibold text-foreground">
                {t.wizard.uploadFamilyPhoto}
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
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <p className="text-sm text-muted-foreground">{t.wizard.detectingFamily}</p>
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
            <Button variant="outline" onClick={reset}>
              {t.wizard.tryAgain || "Try Again"}
            </Button>
            <Button variant="gold" onClick={handleConfirm}>
              {t.wizard.addToBook}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
