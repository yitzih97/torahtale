// Client-side coloring-book line-art conversion. This used to run in the
// generate-image edge function, but ImageScript decoding + processing a 2K
// image there blows the edge worker's CPU/memory budget (an uncatchable 546
// kill), which forced coloring pages down to a soft-looking 1K. Running the
// conversion in the browser instead — where there's no such limit — lets
// coloring pages be generated at full 2K for crisp lines and still come out as
// clean black-on-white line art.

/**
 * Turn a drawn RGBA buffer into clean coloring-book line art, IN PLACE:
 *   1. Threshold to pure black outlines on a pure white page (a soft ramp
 *      keeps anti-aliased edges smooth; light/mid grays snap to white so soft
 *      shading doesn't print as ink-costing halftone).
 *   2. Hollow out large SOLID-BLACK fills (dark clothing the model insists on
 *      filling — boots, dark pants, hair) into outlines: a separable erosion by
 *      radius R marks every pixel whose whole (2R+1)² neighborhood is black
 *      (i.e. deep inside a solid region, which a thin outline never has) and
 *      whitens those interiors, leaving each fill as an ~R-px rim.
 */
export function applyLineArt(data: Uint8ClampedArray, width: number, height: number): void {
  const LO = 60, HI = 105;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const v = lum <= LO ? 0 : lum >= HI ? 255 : Math.round(((lum - LO) / (HI - LO)) * 255);
    data[i] = data[i + 1] = data[i + 2] = v;
    data[i + 3] = 255;
  }

  const n = width * height;
  // R scales with resolution so the retained outline is a consistent physical
  // thickness whether we run on a preview image or the larger print canvas.
  const R = Math.max(2, Math.round(Math.min(width, height) / 350));
  const black = new Uint8Array(n);
  for (let p = 0, i = 0; p < n; p++, i += 4) black[p] = data[i] < 128 ? 1 : 0;

  const eroH = new Uint8Array(n);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      let all: 0 | 1 = 1;
      for (let dx = -R; dx <= R; dx++) { const xx = x + dx; if (xx < 0 || xx >= width || !black[row + xx]) { all = 0; break; } }
      eroH[row + x] = all;
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let all = true;
      for (let dy = -R; dy <= R; dy++) { const yy = y + dy; if (yy < 0 || yy >= height || !eroH[yy * width + x]) { all = false; break; } }
      if (all) { const i = (y * width + x) * 4; data[i] = data[i + 1] = data[i + 2] = 255; }
    }
  }
}

/** Load an image URL, convert it to line art (see {@link applyLineArt}), and
 *  return a PNG data URL. Falls back to the original src on any failure (bad
 *  CORS, decode error) so a coloring page always renders something. */
export async function toLineArtDataURL(src: string): Promise<string> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image load failed"));
      img.src = src;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return src;
    ctx.drawImage(img, 0, 0);
    const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyLineArt(id.data, canvas.width, canvas.height);
    ctx.putImageData(id, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return src;
  }
}
