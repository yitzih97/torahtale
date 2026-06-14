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

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
