/**
 * Crops a region (normalized 0..1 bbox) from a source image data URL and returns a JPEG File + dataUrl.
 */
export async function cropFromDataUrl(
  src: string,
  bbox: { x: number; y: number; w: number; h: number },
  fileName = "person.jpg",
  pad = 0.15,
): Promise<{ file: File; dataUrl: string }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new window.Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });

  const W = img.naturalWidth;
  const H = img.naturalHeight;

  // Apply padding around bbox, clamp to image bounds.
  const padX = bbox.w * pad;
  const padY = bbox.h * pad;
  const x = Math.max(0, (bbox.x - padX)) * W;
  const y = Math.max(0, (bbox.y - padY)) * H;
  const w = Math.min(1 - bbox.x + padX, bbox.w + padX * 2) * W;
  const h = Math.min(1 - bbox.y + padY, bbox.h + padY * 2) * H;

  const size = Math.round(Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  // Center the crop in a square canvas
  const dx = (size - w) / 2;
  const dy = (size - h) / 2;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, x, y, w, h, dx, dy, w, h);

  const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.92));
  const file = new File([blob], fileName, { type: "image/jpeg" });
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  return { file, dataUrl };
}

/**
 * Downscale a data URL to a max dimension and re-encode as JPEG. Keeps the
 * payload sent to the detection edge function small so it can't time out / OOM
 * on a full-resolution phone photo. Detection bboxes are normalized 0..1, so a
 * smaller image still maps back onto the original for cropping.
 */
export async function downscaleDataUrl(src: string, maxDim = 1024, quality = 0.82): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new window.Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale >= 1) return src; // already small enough
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
