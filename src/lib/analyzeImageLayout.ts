import { DEFAULT_TEXT_LAYOUT, type TextLayout } from "@/components/wizard/EditableTextBox";

// Auto-place AND auto-size the story caption over an illustration so the admin
// almost never has to drag or resize a text box.
//
// Strategy:
//  1. Downsample the image and build a "detail" (edge-density) map — a much
//     better proxy for "busy vs calm" than plain luminance variance, because it
//     flags faces, foliage and fabric while ignoring smooth gradients (skies).
//  2. Score a set of candidate caption boxes (top/bottom bands × left/right/full)
//     by how calm they are, biased toward the bottom band (natural caption spot,
//     and the band we now reserve at generation time).
//  3. AUTO-FIT the font size so the wrapped caption fills its box without
//     overflowing — this is what removes the manual resizing.
//  4. Guarantee readability: if the calmest box is still busy or low-contrast,
//     drop a soft caption box (background) behind the text so it's always legible
//     instead of hoping for a perfectly clean area.

const SAMPLE_W = 120;
const REF_W = 1024;            // fontSize is defined against a 1024px-wide container
const PAD = 14;                // caption inner padding (px @ ref) reserved when fitting
const FONT_MIN = 15;
const FONT_MAX = 30;
const LINE_HEIGHT = 1.5;

interface RegionStat { detail: number; mean: number }

/** Mean edge-detail and mean luminance over a fractional region (0..1). */
function regionStat(
  edge: Float32Array, lum: Float32Array, sw: number, sh: number,
  rx: number, ry: number, rw: number, rh: number,
): RegionStat {
  const x0 = Math.max(0, Math.floor(rx * sw));
  const x1 = Math.min(sw, Math.ceil((rx + rw) * sw));
  const y0 = Math.max(0, Math.floor(ry * sh));
  const y1 = Math.min(sh, Math.ceil((ry + rh) * sh));
  let de = 0, lm = 0, n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = y * sw + x;
      de += edge[i]; lm += lum[i]; n++;
    }
  }
  if (!n) return { detail: Infinity, mean: 128 };
  return { detail: de / n, mean: lm / n };
}

/**
 * Largest font size (px @ ref) at which `text` wraps to fit within a box of the
 * given inner width/height. Binary-searched with canvas text measurement so it
 * matches the on-screen wrapping closely.
 */
function fitFontSize(
  text: string, innerW: number, innerH: number, fontFamily: string,
): number {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx || innerW <= 0 || innerH <= 0) return DEFAULT_TEXT_LAYOUT.fontSize;
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return DEFAULT_TEXT_LAYOUT.fontSize;

  const heightAt = (fs: number): number => {
    ctx.font = `${fs}px ${fontFamily}`;
    let lines = 1, cur = "";
    for (const word of words) {
      const test = cur ? `${cur} ${word}` : word;
      if (ctx.measureText(test).width > innerW && cur) { lines++; cur = word; }
      else cur = test;
    }
    // A single word longer than the box still occupies its own line.
    return lines * fs * LINE_HEIGHT;
  };

  let lo = FONT_MIN, hi = FONT_MAX, best = FONT_MIN;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (heightAt(mid) <= innerH) { best = mid; lo = mid; } else hi = mid;
  }
  return Math.round(best);
}

interface Candidate {
  x: number; y: number; width: number;          // % of container
  align: TextLayout["align"];
  region: [number, number, number, number];     // x,y,w,h (0..1) for scoring
  hFrac: number;                                 // usable height as fraction of container height
  bias: number;                                  // multiplicative penalty (lower = preferred)
}

/**
 * Compute a good default TextLayout for an illustration: calmest region, auto-fit
 * font size for `text`, and a caption box only when the area is too busy for
 * plain text. Returns null if analysis isn't possible (e.g. tainted canvas).
 */
export function computeAutoTextLayout(
  img: HTMLImageElement, rtl: boolean, text?: string,
): TextLayout | null {
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

    // Luminance + edge-detail maps.
    const lum = new Float32Array(sw * sh);
    for (let i = 0; i < sw * sh; i++) {
      const p = i * 4;
      lum[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
    }
    const edge = new Float32Array(sw * sh);
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const i = y * sw + x;
        const gx = x + 1 < sw ? Math.abs(lum[i] - lum[i + 1]) : 0;
        const gy = y + 1 < sh ? Math.abs(lum[i] - lum[i + sw]) : 0;
        edge[i] = gx + gy;
      }
    }

    const startAlign: TextLayout["align"] = rtl ? "right" : "left";
    // The TOP band (calm painted sky) is the reserved caption zone — see the
    // COMPOSITION rule in generate-image — so it's the default preference,
    // with the bottom band as the alternative for scenes with busy skies.
    const candidates: Candidate[] = [
      { x: 8, y: 6, width: 84, align: "center",    region: [0.06, 0.05, 0.88, 0.26], hFrac: 0.26, bias: 1.0 },
      { x: 6, y: 7, width: 46, align: startAlign,  region: [0.04, 0.05, 0.48, 0.30], hFrac: 0.30, bias: 1.06 },
      { x: 50, y: 7, width: 46, align: rtl ? "right" : "left", region: [0.5, 0.05, 0.46, 0.30], hFrac: 0.30, bias: 1.06 },
      { x: 8, y: 66, width: 84, align: "center",   region: [0.06, 0.64, 0.88, 0.30], hFrac: 0.30, bias: 1.22 },
      { x: 6, y: 64, width: 46, align: startAlign, region: [0.04, 0.62, 0.48, 0.32], hFrac: 0.32, bias: 1.28 },
      { x: 50, y: 64, width: 46, align: rtl ? "right" : "left", region: [0.5, 0.62, 0.46, 0.32], hFrac: 0.32, bias: 1.28 },
    ];

    const containerHRef = REF_W * (h / w);

    let best: { c: Candidate; stat: RegionStat; fontSize: number } | null = null;
    let bestScore = Infinity;
    for (const c of candidates) {
      const stat = regionStat(edge, lum, sw, sh, ...c.region);
      const innerW = (c.width / 100) * REF_W - PAD * 2;
      const innerH = c.hFrac * containerHRef - PAD * 2;
      const fontSize = fitFontSize(text || "", innerW, innerH, DEFAULT_TEXT_LAYOUT.fontFamily);
      // Prefer calm regions and, secondarily, ones that let the text render at a
      // comfortable size (bigger fit = better use of the space).
      const sizeBonus = 1 - Math.min(1, (fontSize - FONT_MIN) / (FONT_MAX - FONT_MIN)) * 0.25;
      const score = (stat.detail + 1) * c.bias * sizeBonus;
      if (score < bestScore) { bestScore = score; best = { c, stat, fontSize }; }
    }
    if (!best) return null;

    const { c, fontSize } = best;
    // Consistent, readable styling on EVERY page: inherit the shared default
    // (bold WHITE with a soft drop shadow, no outline, no background box) so
    // captions look the same across all pages/scenes. Only position + size are
    // derived from the image's clear space.
    return {
      ...DEFAULT_TEXT_LAYOUT,
      x: c.x, y: c.y, width: c.width, align: c.align,
      fontSize, bold: true, background: false,
    } as TextLayout;
  } catch {
    return null;
  }
}
