import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  imageSrc: string | null;
  fileName?: string;
  /** Aspect ratio (width/height). Default 1 (square). */
  aspect?: number;
  onCancel: () => void;
  onCropped: (file: File, dataUrl: string) => void;
}

async function getCroppedBlob(imageSrc: string, area: Area, fileName: string): Promise<{ file: File; dataUrl: string }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);

  const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92));
  const file = new File([blob], fileName.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  return { file, dataUrl };
}

export const ImageCropDialog = ({ open, imageSrc, fileName = "photo.jpg", aspect = 1, onCancel, onCropped }: Props) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !area) return;
    setSaving(true);
    try {
      const { file, dataUrl } = await getCroppedBlob(imageSrc, area, fileName);
      onCropped(file, dataUrl);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
        <div className="p-5 pb-2">
          <DialogTitle className="font-display text-lg font-bold text-primary">Crop Photo</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Drag to reposition, pinch or use the slider to zoom.
          </DialogDescription>
        </div>

        <div className="relative w-full h-72 bg-black">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="round"
              showGrid={false}
            />
          )}
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Zoom</label>
            <Slider value={[zoom]} min={1} max={4} step={0.05} onValueChange={(v) => setZoom(v[0])} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
            <Button variant="gold" onClick={handleConfirm} disabled={saving || !area}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Use Photo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
