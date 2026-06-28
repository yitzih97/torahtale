import { DEFAULT_TEXT_LAYOUT, type TextLayout } from "@/components/wizard/EditableTextBox";

// Auto-place the story text over the calmest (lowest-detail) area of an
// illustration, so the admin doesn't have to drag every text box. We downsample
// the image and score a handful of candidate regions by how "busy" they are
// (luminance variance); the calmest one wins, with a bias toward the top. The
// text colour is then picked (dark vs white) for contrast against that region.

const SAMPLE_W = 96;

interface RegionStat { variance: number; mean: number }

function regionStat(
  data: Uint8ClampedArray, sw: number, sh: number,
  rx: number, ry: number, rw: number, rh: number,
): RegionStat {
  const x0 = Math.max(0, Math.floor(rx * sw));
  const x1 = Math.min(sw, Math.ceil((rx + rw) * sw));
  const y0 = Math.max(0, Math.floor(ry * sh));
  const y1 = Math.min(sh, Math.ceil((ry + rh) * sh));
  let sum = 0, sum2 = 0, n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * sw + x) * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += lum; sum2 += lum * lum; n++;
    }
  }
  if (!n) return { variance: Infinity, mean: 128 };
  const mean = sum / n;
  return { variance: Math.max(0, sum2 / n - mean * mean), mean };
}

interface Candidate {
  layout: Pick<TextLayout, "x" | "y" | "width" | "align">;
  region: [number, number, number, number]; // x,y,w,h as 0..1
  bias: number; // multiplicative penalty (prefer top, avoid bottom)
}

/**
 * Compute a good default TextLayout for an illustration by finding its calmest
 * region. Returns null if analysis isn't possible (e.g. tainted canvas).
 */
export function computeAutoTextLayout(img: HTMLImageElement, rtl: boolean): TextLayout | null {
  try {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return null;
    const sw = SAMPLE_W;
    const sh = Math.max(1, Math.round(SAMPLE_W * (h / w)));
    const canvas = document.createElement("canvas");
    canvas.width = sw; canvas.height = sh;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, sw, sh);
    const data = ctx.getImageData(0, 0, sw, sh).data;

    const startAlign: TextLayout["align"] = rtl ? "right" : "left";
    const candidates: Candidate[] = [
      { layout: { x: 6, y: 8, width: 42, align: startAlign }, region: [0.04, 0.05, 0.46, 0.34], bias: 1.0 },
      { layout: { x: 52, y: 8, width: 42, align: "left" }, region: [0.5, 0.05, 0.46, 0.34], bias: 1.0 },
      { layout: { x: 8, y: 6, width: 84, align: "center" }, region: [0.06, 0.04, 0.88, 0.24], bias: 1.05 },
      { layout: { x: 6, y: 60, width: 42, align: startAlign }, region: [0.04, 0.6, 0.46, 0.34], bias: 1.35 },
      { layout: { x: 52, y: 60, width: 42, align: "left" }, region: [0.5, 0.6, 0.46, 0.34], bias: 1.35 },
      { layout: { x: 8, y: 70, width: 84, align: "center" }, region: [0.06, 0.66, 0.88, 0.28], bias: 1.4 },
    ];

    let best: Candidate | null = null;
    let bestStat: RegionStat | null = null;
    let bestScore = Infinity;
    for (const c of candidates) {
      const s = regionStat(data, sw, sh, ...c.region);
      const score = s.variance * c.bias; // lower = calmer = better
      if (score < bestScore) { bestScore = score; best = c; bestStat = s; }
    }
    if (!best || !bestStat) return null;

    // Dark text on a light region; white text (no box) on a dark region.
    const color = bestStat.mean >= 130 ? "#2b2418" : "#ffffff";
    return { ...DEFAULT_TEXT_LAYOUT, ...best.layout, color } as TextLayout;
  } catch {
    return null;
  }
}
