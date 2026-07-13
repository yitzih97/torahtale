import jsPDF from "jspdf";
import { BOOK_TEXT_STYLE, COVER_URL, getCoverTagline, type BookPage } from "@/components/wizard/BookViewer";
import { getPortionDisplay } from "@/components/wizard/TorahPortions";
import { DEFAULT_TEXT_LAYOUT, DEFAULT_BORDER_COLOR, DEFAULT_OUTLINE_COLOR, makeDefaultLayout, makeQuestionsLayout, migrateLayout, type TextLayout } from "@/components/wizard/EditableTextBox";
import { computeAutoTextLayout } from "@/lib/analyzeImageLayout";
import torahTaleIcon from "@/assets/brand/torah-tale-icon.png";
import torahTaleWordmark from "@/assets/brand/torah-tale-text-gold.png";

/* Spread = 2:1 landscape sheet. Image fills one half, text composited
   per page from BookPage.textLayout. */

const SPREAD_W = 2400;
const SPREAD_H = 1200;
const HALF_W = SPREAD_W / 2;

// Coloring book: 8.5×11 PORTRAIT line-art pages (ratio 8.5:11), at the same
// ~150dpi logical scale as the other formats.
const COLOR_W = 1275;
const COLOR_H = 1650;

/** Interior page layout for a book format:
 *   • "spread"   — board (6×6): one wide 2:1 illustration per open spread.
 *   • "portrait" — coloring (8.5×11): one tall line-art page.
 *   • "square"   — softcover/hardcover (8×8): one square page.  */
type LayoutMode = "spread" | "portrait" | "square";

/** Board (6×6) prints as wide 2:1 spreads; softcover/hardcover (8×8) print as
 *  separate square pages; coloring (8.5×11) prints as tall portrait pages. A
 *  "board" book with far more pages than the 10-spread blueprint holds was
 *  mis-flagged, so fall back to page-based square. */
function isSpreadBased(bookFormat: string, pages: BookPage[]): boolean {
  const storyCount = pages.filter((p) => p.type === "story" || !p.type).length;
  return bookFormat.startsWith("board") && storyCount <= 12;
}

function layoutMode(bookFormat: string, pages: BookPage[]): LayoutMode {
  if (isSpreadBased(bookFormat, pages)) return "spread";
  if ((bookFormat || "").startsWith("coloring")) return "portrait";
  return "square";
}

/** Interior canvas dimensions (logical px, before print scale) for a mode. */
function interiorDims(mode: LayoutMode): [number, number] {
  if (mode === "spread") return [SPREAD_W, SPREAD_H];
  if (mode === "portrait") return [COLOR_W, COLOR_H];
  return [SPREAD_H, SPREAD_H];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function safeLoad(src: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!src) return null;
  try { return await loadImage(src); } catch { return null; }
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of (text || "").split("\n")) {
    if (!para.trim()) { lines.push(""); continue; }
    const words = para.split(/\s+/);
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line); line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Draw the cream "paper" half background. */
function drawPaperHalf(ctx: CanvasRenderingContext2D, side: "left" | "right") {
  const x = side === "left" ? 0 : HALF_W;
  ctx.fillStyle = "#f6efdf";
  ctx.fillRect(x, 0, HALF_W, SPREAD_H);
  const glow = ctx.createRadialGradient(x + HALF_W / 2, SPREAD_H / 2, 40, x + HALF_W / 2, SPREAD_H / 2, HALF_W * 0.7);
  glow.addColorStop(0, "rgba(232, 197, 117, 0.35)");
  glow.addColorStop(1, "rgba(232, 197, 117, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x, 0, HALF_W, SPREAD_H);
}

/** Fill the whole canvas with the cream "paper" background + soft center glow.
 *  Used for the discussion-questions page so the questions sit on a clean,
 *  empty page and stay easy to read. */
function drawPaperFull(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = "#f6efdf";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, Math.max(W, H) * 0.6);
  glow.addColorStop(0, "rgba(232, 197, 117, 0.30)");
  glow.addColorStop(1, "rgba(232, 197, 117, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

/** Composite a text overlay using the page's TextLayout. Coords are % of the
 *  canvas (W×H). */
function drawTextOverlay(ctx: CanvasRenderingContext2D, text: string, layout: TextLayout, W: number, H: number, rtl = false) {
  if (!text) return;
  // Hebrew/Yiddish need an explicit paragraph direction so sentence-final
  // punctuation (. , ? !) and list numbers land at the correct visual end.
  ctx.direction = rtl ? "rtl" : "ltr";
  // layout.fontSize and padding are absolute px defined against a 1024px-wide
  // reference container (see EditableTextBox / TextLayout). Scale them by the
  // canvas width so the PDF matches the on-screen preview 1:1.
  const scale = W / 1024;
  const fontSize = layout.fontSize * scale;
  const weight = layout.bold ? "700" : "400";
  const italic = layout.italic ? "italic " : "";
  ctx.font = `${italic}${weight} ${fontSize}px ${layout.fontFamily}`;
  ctx.textBaseline = "top";

  const boxX = (layout.x / 100) * W;
  const boxY = (layout.y / 100) * H;
  const boxW = (layout.width / 100) * W;
  const hasPad = layout.background || layout.border;
  const padX = (hasPad ? 18 : 6) * scale;
  const padY = (hasPad ? 14 : 4) * scale;
  const maxTextW = boxW - padX * 2;
  const lines = wrapLines(ctx, text, maxTextW);
  const lineHeight = fontSize * (layout.lineHeight ?? 1.5);
  const textH = lines.length * lineHeight;
  const boxH = textH + padY * 2;

  if (layout.background) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.14)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = "rgba(252, 247, 236, 0.94)";
    roundedRect(ctx, boxX, boxY, boxW, boxH, 18);
    ctx.fill();
    ctx.restore();
  }
  if (layout.border) {
    ctx.strokeStyle = layout.borderColor ?? DEFAULT_BORDER_COLOR;
    ctx.lineWidth = 2;
    roundedRect(ctx, boxX, boxY, boxW, boxH, 18);
    ctx.stroke();
  }

  // Optional soft drop shadow behind the letters (mirrors the on-screen
  // textShadow). Applied to the fill pass only; cleared before the outline
  // stroke so the white border stays crisp.
  const shadow = !!layout.shadow;

  ctx.textAlign = layout.align;
  let textAnchorX = boxX + padX;
  if (layout.align === "center") textAnchorX = boxX + boxW / 2;
  else if (layout.align === "right") textAnchorX = boxX + boxW - padX;

  // Thin solid-white BORDER behind the letters keeps captions readable on any
  // scene without a background box (mirrors the outlineWidth stroke in
  // EditableTextBox). Skipped when a solid background box is already present
  // or the outline is set to 0.
  const outlineWidthRef = layout.outlineWidth ?? 2; // px at the 1024-ref container
  const outline = !layout.background && outlineWidthRef > 0;
  const outlineColor = layout.outlineColor ?? DEFAULT_OUTLINE_COLOR;
  const outlineLW = Math.max(1, outlineWidthRef * (fontSize / layout.fontSize));
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  for (let i = 0; i < lines.length; i++) {
    const ly = boxY + padY + i * lineHeight;
    // Shadow pass: paint the OUTER glyph shape once with a soft shadow enabled,
    // then redraw the crisp outline + fill on top (mirrors CSS text-shadow).
    if (shadow) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = Math.max(2, 6 * scale);
      ctx.shadowOffsetY = 2 * scale;
      if (outline) {
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = outlineLW;
        ctx.strokeText(lines[i], textAnchorX, ly);
      } else {
        ctx.fillStyle = layout.color;
        ctx.fillText(lines[i], textAnchorX, ly);
      }
      ctx.restore();
    }
    if (outline) {
      // Scale the ref-space width to canvas pixels the same way the font is scaled.
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = outlineLW;
      ctx.strokeText(lines[i], textAnchorX, ly);
    }
    ctx.fillStyle = layout.color;
    ctx.fillText(lines[i], textAnchorX, ly);
  }
}

function drawGutter(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const midX = W / 2;
  const grad = ctx.createLinearGradient(midX - 12, 0, midX + 12, 0);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.5, "rgba(0,0,0,0.32)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(midX - 12, 0, 24, H);
}

/** Cover-fit an image onto one half, CLIPPED to that half so a non-square
 *  image (e.g. a wide cover) can never bleed across the gutter onto the other
 *  page. Mirrors CSS object-cover, which the on-screen preview uses. */
function drawHalfImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, halfX: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(halfX, 0, HALF_W, SPREAD_H);
  ctx.clip();
  const ratio = Math.max(HALF_W / img.naturalWidth, SPREAD_H / img.naturalHeight);
  const dw = img.naturalWidth * ratio;
  const dh = img.naturalHeight * ratio;
  ctx.drawImage(img, halfX + (HALF_W - dw) / 2, (SPREAD_H - dh) / 2, dw, dh);
  ctx.restore();
}

/** Cover-fit an image across the full canvas (mirrors CSS object-cover, which
 *  the on-screen preview uses for story pages — full spread for board, single
 *  square page for 8×8). */
function drawFullImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number) {
  const ratio = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const dw = img.naturalWidth * ratio;
  const dh = img.naturalHeight * ratio;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

async function renderStorySpread(page: BookPage, _storyIdx: number, rtl: boolean, mode: LayoutMode, scale = 1): Promise<string> {
  // Board: 2:1 spread. 8×8: square page. Coloring: 8.5×11 portrait page.
  const [W, H] = interiorDims(mode);

  // `scale` renders at a higher backing resolution (used for print — the Printify
  // page slot is 2400², double our 1200 base) while keeping every coordinate/font
  // size in the original logical space, so nothing below needs to change.
  const canvas = document.createElement("canvas");
  canvas.width = W * scale; canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  if (scale !== 1) ctx.scale(scale, scale);

  const img = await safeLoad(page.image);
  // Layout precedence: an admin-adjusted layout wins; otherwise auto-place the
  // text over the illustration's calmest area; otherwise the static default.
  let layout = migrateLayout(page.textLayout);
  if (img) {
    drawFullImage(ctx, img, W, H);
    if (!layout) layout = computeAutoTextLayout(img, rtl, page.text) || undefined;
  } else {
    ctx.fillStyle = "#dcd2bd";
    ctx.fillRect(0, 0, W, H);
  }
  if (!layout) layout = makeDefaultLayout(rtl ? "right" : "left", rtl);
  // Coloring pages are line art on WHITE — the white caption default would be
  // invisible, so force dark text with no shadow and a soft cream backing box.
  if (mode === "portrait") layout = { ...layout, color: "#2b2418", shadow: false, background: true };

  if (mode === "spread") drawGutter(ctx, W, H);
  drawTextOverlay(ctx, page.text || "", layout, W, H, rtl);
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function renderQuestionsSpread(page: BookPage, rtl: boolean, mode: LayoutMode, scale = 1): Promise<string> {
  // The questions page sits on a clean, empty parchment page (no illustration)
  // so the discussion text is always easy to read.
  const layout = migrateLayout(page.textLayout) || makeQuestionsLayout(rtl);
  const [W, H] = interiorDims(mode);
  const canvas = document.createElement("canvas");
  canvas.width = W * scale; canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  if (scale !== 1) ctx.scale(scale, scale);
  drawPaperFull(ctx, W, H);
  if (mode === "spread") drawGutter(ctx, W, H);
  const questions = page.questions || [];
  const formatted = page.text || questions.map((q) => `${q.number}. ${q.question}`).join("\n\n");
  drawTextOverlay(ctx, formatted, layout, W, H, rtl);
  return canvas.toDataURL("image/jpeg", 0.92);
}

/** Cover-fit an image into an arbitrary rounded rect (clipped), for the back-
 *  cover preview grid. */
function drawImageInRect(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, r: number) {
  ctx.save();
  roundedRect(ctx, x, y, w, h, r);
  ctx.clip();
  const ratio = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * ratio;
  const dh = img.naturalHeight * ratio;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

export interface BackCoverPreview { label: string; url: string | null }

/* ─────────────── Cover "furniture": frame + majestic typography ───────────────
 * Draws the branded cover chrome over an already-drawn illustration, in the
 * current logical coordinate space (origin 0,0, size W×H): a navy filigree frame
 * with gold keylines + corner flourishes, the "TORAH TALE" brand, a big engraved
 * gold PARSHA title, a magenta personalized story title, and a bottom tagline.
 * Shared by the 8×8/hardcover/board wraparound and the coloring portrait cover. */

const COVER_NAVY = "#122140";
const COVER_GOLD = "#e3c169";
const COVER_MAGENTA = "#8f2b52";
const FRONT_TAGLINE = "A Personalized Parsha Adventure";

// Cinzel is used only on the print canvas (no DOM node uses it), so make sure the
// weights are actually loaded before we draw or canvas silently falls back.
async function ensureCoverFonts() {
  try {
    const f: any = (document as any).fonts;
    if (!f) return;
    await Promise.all([
      f.load("700 120px Cinzel"), f.load("600 40px Cinzel"),
      f.load("600 60px 'Cormorant Garamond'"), f.load("italic 500 40px 'Cormorant Garamond'"),
    ]);
    await f.ready;
  } catch { /* fall back to whatever is available */ }
}

function goldFill(ctx: CanvasRenderingContext2D, baselineY: number, capH: number): CanvasGradient {
  const g = ctx.createLinearGradient(0, baselineY - capH * 0.92, 0, baselineY + capH * 0.12);
  g.addColorStop(0, "#fff6d5"); g.addColorStop(0.28, "#f6df97"); g.addColorStop(0.5, "#e7be5c");
  g.addColorStop(0.72, "#c9992f"); g.addColorStop(1, "#a9791f");
  return g;
}

// One line of engraved gold caps (deep shadow → dark bevel → gold face → highlight).
function engravedLine(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, font: string, capH: number) {
  ctx.save();
  ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillText(text, cx + 3, y + 4);
  ctx.fillStyle = "#5b3d0e"; ctx.fillText(text, cx, y + 2);
  ctx.fillStyle = goldFill(ctx, y, capH);
  ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
  ctx.fillText(text, cx, y);
  ctx.shadowColor = "transparent";
  ctx.lineWidth = Math.max(1, capH * 0.012); ctx.strokeStyle = "rgba(255,250,225,0.5)"; ctx.strokeText(text, cx, y);
  ctx.restore();
}

const letterSpace = (s: string, n = 2) => s.split("").join(" ".repeat(n));

// Centered ornament:  ·——❦——·
function coverFlourish(ctx: CanvasRenderingContext2D, cx: number, y: number, w: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - w / 2, y); ctx.lineTo(cx - 16, y); ctx.moveTo(cx + 16, y); ctx.lineTo(cx + w / 2, y); ctx.stroke();
  ctx.font = "22px 'Cormorant Garamond', serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("❦", cx, y);
  ctx.beginPath(); ctx.arc(cx - w / 2, y, 2.6, 0, 7); ctx.arc(cx + w / 2, y, 2.6, 0, 7); ctx.fill();
  ctx.restore();
}

function cornerFiligree(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number, color: string) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(0, s); ctx.quadraticCurveTo(0, 0, s, 0);
  ctx.moveTo(s * 0.28, s); ctx.quadraticCurveTo(s * 0.28, s * 0.28, s, s * 0.28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.55, s * 0.1); ctx.quadraticCurveTo(s * 0.82, 0, s * 0.92, s * 0.22);
  ctx.quadraticCurveTo(s * 0.7, s * 0.2, s * 0.55, s * 0.1); ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}

/** Draw the branded frame + typography for a W×H cover at the current origin. The
 *  caller must have already drawn the illustration. */
function drawCoverFurniture(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  opts: { brand?: string; parsha: string; title?: string; childLine?: string; tagline?: string; rtl?: boolean },
) {
  const gold = COVER_GOLD, U = W; // size unit
  const dir: CanvasDirection = opts.rtl ? "rtl" : "ltr";

  // Legibility scrims: darken the top (title area) and soften the bottom (tagline).
  let g = ctx.createLinearGradient(0, 0, 0, H * 0.5);
  g.addColorStop(0, "rgba(8,14,30,0.82)"); g.addColorStop(0.55, "rgba(8,14,30,0.32)"); g.addColorStop(1, "rgba(8,14,30,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.5);
  g = ctx.createLinearGradient(0, H * 0.82, 0, H);
  g.addColorStop(0, "rgba(8,14,30,0)"); g.addColorStop(1, "rgba(8,14,30,0.72)");
  ctx.fillStyle = g; ctx.fillRect(0, H * 0.82, W, H * 0.18);

  // Navy frame band + gold double keyline + corner filigree.
  const m = Math.round(U * 0.028), bw = Math.round(U * 0.02);
  ctx.strokeStyle = COVER_NAVY; ctx.lineWidth = bw;
  ctx.strokeRect(m + bw / 2, m + bw / 2, W - 2 * m - bw, H - 2 * m - bw);
  const gi = m + bw + Math.round(U * 0.007);
  ctx.strokeStyle = gold; ctx.lineWidth = 2; ctx.strokeRect(gi, gi, W - 2 * gi, H - 2 * gi);
  ctx.strokeStyle = "rgba(227,193,105,0.5)"; ctx.lineWidth = 1;
  ctx.strokeRect(gi + 5, gi + 5, W - 2 * gi - 10, H - 2 * gi - 10);
  const cs = U * 0.05, ci = gi + 10;
  cornerFiligree(ctx, ci, ci, cs, 0, gold);
  cornerFiligree(ctx, W - ci, ci, cs, Math.PI / 2, gold);
  cornerFiligree(ctx, W - ci, H - ci, cs, Math.PI, gold);
  cornerFiligree(ctx, ci, H - ci, cs, -Math.PI / 2, gold);

  ctx.direction = dir;
  const top = m + bw;
  // Brand.
  if (opts.brand) {
    ctx.save(); ctx.fillStyle = gold; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.font = `600 ${Math.round(U * 0.028)}px 'Cinzel', serif`;
    ctx.fillText(letterSpace(opts.brand.toUpperCase(), 2), W / 2, top + U * 0.062);
    coverFlourish(ctx, W / 2, top + U * 0.084, U * 0.15, gold);
    ctx.restore();
  }
  // Parsha — big engraved gold, fit + wrap to ≤2 lines.
  const maxTW = W * 0.82;
  const fit = (t: string, base: number) => {
    let f = base; ctx.font = `700 ${f}px 'Cinzel', serif`;
    while (ctx.measureText(t).width > maxTW && f > U * 0.05) { f -= 4; ctx.font = `700 ${f}px 'Cinzel', serif`; }
    return f;
  };
  const words = (opts.parsha || "").toUpperCase().split(" ");
  let l1 = (opts.parsha || "").toUpperCase(), l2 = "";
  let fs = fit(l1, U * 0.125);
  if (fs < U * 0.08 && words.length > 1) {
    l1 = words.slice(0, -1).join(" "); l2 = words.slice(-1).join(" ");
    fs = Math.min(fit(l1, U * 0.125), fit(l2, U * 0.125));
  }
  const tFont = `700 ${fs}px 'Cinzel', serif`;
  let ty = top + U * 0.062 + U * 0.11;
  engravedLine(ctx, l1, W / 2, ty, tFont, fs);
  if (l2) { ty += fs * 1.02; engravedLine(ctx, l2, W / 2, ty, tFont, fs); }

  // Divider + magenta personalized title.
  coverFlourish(ctx, W / 2, ty + U * 0.045, U * 0.2, gold);
  if (opts.title) {
    ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    const mfs = Math.round(U * 0.055);
    ctx.font = `600 ${mfs}px 'Cormorant Garamond', serif`;
    const lines = wrapLines(ctx, opts.title, W * 0.78);
    let my = ty + U * 0.045 + U * 0.06;
    lines.forEach((ln, i) => {
      const yy = my + i * mfs * 1.02;
      ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
      ctx.fillStyle = "#f4c9dc"; ctx.fillText(ln, W / 2, yy + 2);
      ctx.shadowColor = "transparent"; ctx.fillStyle = COVER_MAGENTA; ctx.fillText(ln, W / 2, yy);
    });
    my += lines.length * mfs * 1.02;
    if (opts.childLine) {
      const cfs = Math.round(U * 0.032);
      ctx.font = `italic 500 ${cfs}px 'Cormorant Garamond', serif`;
      ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
      ctx.fillStyle = "rgba(255,240,214,0.95)"; ctx.fillText(opts.childLine, W / 2, my + U * 0.01);
    }
    ctx.restore();
  }
  // Bottom tagline.
  if (opts.tagline) {
    ctx.save(); ctx.fillStyle = gold; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.font = `italic 500 ${Math.round(U * 0.03)}px 'Cormorant Garamond', serif`;
    ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    ctx.fillText(opts.tagline, W / 2, H - (m + bw) - U * 0.052);
    ctx.shadowColor = "transparent";
    coverFlourish(ctx, W / 2, H - (m + bw) - U * 0.03, U * 0.17, gold);
    ctx.restore();
  }
  ctx.direction = "ltr";
}

/** How the personalized story title reads on the cover (magenta line). Falls back
 *  to the child's name if no creative title was generated. Returns an optional
 *  small child line only when the child isn't already named in the title. */
function coverTitleParts(coverTitle: string | undefined, childName: string, parashaLabel = ""): { title: string; childLine?: string } {
  const t = (coverTitle || "").trim();
  const child = (childName || "").trim();
  // No creative title, or it just repeats the parsha (older/impersonal books):
  // use the child's name as the magenta line instead of duplicating the gold
  // parsha title above it.
  if (!t || t.toLowerCase() === parashaLabel.trim().toLowerCase()) return { title: child || t };
  const named = child && t.toLowerCase().includes(child.split(/[&,]/)[0].trim().toLowerCase());
  return { title: t, childLine: named || !child ? undefined : child };
}

async function renderCoverSpread(
  page: BookPage,
  childName: string,
  parashaLabel: string,
  scale = 1,
  bookFormat = "",
  previews: BackCoverPreview[] = [],
  lang: "en" | "he" | "yi" = "en",
): Promise<string> {
  await ensureCoverFonts();
  const canvas = document.createElement("canvas");
  canvas.width = SPREAD_W * scale; canvas.height = SPREAD_H * scale;
  const ctx = canvas.getContext("2d")!;
  if (scale !== 1) ctx.scale(scale, scale);
  // Hebrew/Yiddish cover text renders RTL; the site URL stays LTR (a domain).
  const rtl = lang !== "en";
  const rtlDir: CanvasDirection = rtl ? "rtl" : "ltr";
  drawPaperHalf(ctx, "left");

  // ── BACK COVER (left half): brand logo, a single row of 4 small "coming next"
  // story thumbnails, the subscribe invitation, and the site URL. ──
  const [icon, wordmark] = await Promise.all([safeLoad(torahTaleIcon), safeLoad(torahTaleWordmark)]);
  if (icon && wordmark) {
    const iconH = 240;
    const iconW = (icon.naturalWidth / icon.naturalHeight) * iconH;
    const wmH = 150;
    const wmW = (wordmark.naturalWidth / wordmark.naturalHeight) * wmH;
    const gap = 28;
    const groupW = iconW + gap + wmW;
    const startX = HALF_W / 2 - groupW / 2;
    const centerY = SPREAD_H * 0.22;
    ctx.drawImage(icon, startX, centerY - iconH / 2, iconW, iconH);
    ctx.drawImage(wordmark, startX + iconW + gap, centerY - wmH / 2, wmW, wmH);
  }

  // Row of 4 small "coming next" story thumbnails (empty box until generated).
  const previewImgs = await Promise.all(previews.slice(0, 4).map((p) => (p.url ? safeLoad(p.url) : Promise.resolve(null))));
  const thumb = 190, tgap = 28;
  const rowW = 4 * thumb + 3 * tgap;
  const rowX = HALF_W / 2 - rowW / 2;
  const rowY = SPREAD_H * 0.38;
  for (let i = 0; i < 4; i++) {
    const tx = rowX + i * (thumb + tgap);
    ctx.fillStyle = "#efe7d3";
    roundedRect(ctx, tx, rowY, thumb, thumb, 12); ctx.fill();
    const pimg = previewImgs[i];
    if (pimg) drawImageInRect(ctx, pimg, tx, rowY, thumb, thumb, 12);
    // Mini front-cover text (localized parsha name + kids), matching the
    // on-screen teaser — white Inter with a soft shadow over a top gradient.
    const pv = previews[i];
    if (pv?.label) {
      ctx.save();
      roundedRect(ctx, tx, rowY, thumb, thumb, 12); ctx.clip();
      const bandH = thumb * 0.44;
      const g = ctx.createLinearGradient(tx, rowY, tx, rowY + bandH);
      g.addColorStop(0, "rgba(0,0,0,0.62)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(tx, rowY, thumb, bandH);
      ctx.direction = rtlDir;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
      ctx.fillStyle = "#ffffff";
      ctx.font = `700 22px 'Inter', sans-serif`;
      const lbl = wrapLines(ctx, pv.label, thumb - 16).slice(0, 2);
      lbl.forEach((ln, li) => ctx.fillText(ln, tx + thumb / 2, rowY + 8 + li * 26));
      if (childName) {
        ctx.font = `500 16px 'Inter', sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText(childName, tx + thumb / 2, rowY + 10 + lbl.length * 26);
      }
      ctx.restore();
    }
    ctx.strokeStyle = "rgba(0,0,0,0.30)"; ctx.lineWidth = 2;
    roundedRect(ctx, tx, rowY, thumb, thumb, 12); ctx.stroke();
  }

  // Subscribe invitation (localized → RTL) + site URL (a domain → always LTR).
  ctx.fillStyle = "#5a4a32";
  ctx.direction = rtlDir;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tSize = 54;
  ctx.font = `italic ${tSize}px ${BOOK_TEXT_STYLE.fontFamily}`;
  const cy = SPREAD_H * 0.68;
  const taglineLines = page.backCoverText && page.backCoverText.trim()
    ? page.backCoverText.split("\n").map((l) => l.trim()).filter(Boolean)
    : getCoverTagline(lang);
  taglineLines.forEach((line, i) => {
    ctx.fillText(line, HALF_W / 2, cy + (i - (taglineLines.length - 1) / 2) * (tSize * 1.35));
  });
  ctx.direction = "ltr";
  ctx.fillStyle = "#b88a2a";
  ctx.font = `600 36px 'Inter', sans-serif`;
  ctx.fillText(COVER_URL.toUpperCase(), HALF_W / 2, SPREAD_H * 0.9);

  // ── FRONT COVER (right half): illustration + Parasha name + child. ──
  const img = await safeLoad(page.image);
  if (img) {
    drawHalfImage(ctx, img, HALF_W);
  } else {
    ctx.fillStyle = "#dcd2bd";
    ctx.fillRect(HALF_W, 0, HALF_W, SPREAD_H);
  }
  // Front cover chrome: navy filigree frame, "Torah Tale" brand, big engraved
  // gold PARSHA title, magenta personalized story title, and a bottom tagline —
  // drawn over the illustration (right half). Uses coverTitle as the personalized
  // magenta line (falls back to the child's name), the localized parasha as the
  // gold title.
  const { title: frontTitle, childLine } = coverTitleParts(page.coverTitle, childName, parashaLabel);
  ctx.save();
  ctx.translate(HALF_W, 0);
  drawCoverFurniture(ctx, HALF_W, SPREAD_H, {
    brand: "Torah Tale",
    parsha: parashaLabel,
    title: frontTitle,
    childLine,
    tagline: FRONT_TAGLINE,
    rtl,
  });
  ctx.restore();
  drawGutter(ctx, SPREAD_W, SPREAD_H);

  // ── SPINE — width tracks the physical book thickness so the fold lands right:
  // board books are thick, hardcover medium, softcover very thin. ──
  const spineFrac = bookFormat.startsWith("board") ? 0.045 : bookFormat.startsWith("hardcover") ? 0.025 : 0.012;
  const spineW = SPREAD_W * spineFrac;
  const spineX = HALF_W - spineW / 2;
  ctx.fillStyle = "#efe7d3";
  ctx.fillRect(spineX, 0, spineW, SPREAD_H);
  const spineShade = ctx.createLinearGradient(spineX, 0, spineX + spineW, 0);
  spineShade.addColorStop(0, "rgba(0,0,0,0.16)");
  spineShade.addColorStop(0.5, "rgba(0,0,0,0)");
  spineShade.addColorStop(1, "rgba(0,0,0,0.16)");
  ctx.fillStyle = spineShade;
  ctx.fillRect(spineX, 0, spineW, SPREAD_H);
  // Only letter the spine when it's physically wide enough to read.
  if (spineW >= 60) {
    const spineText = [parashaLabel, childName].filter(Boolean).join("  ·  ");
    ctx.save();
    ctx.translate(HALF_W, SPREAD_H / 2);
    ctx.rotate(Math.PI / 2);
    ctx.direction = rtlDir;
    ctx.fillStyle = "#2b2418";
    ctx.font = `600 ${Math.min(40, spineW * 0.5)}px 'Playfair Display', serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(spineText, 0, 0);
    ctx.restore();
  }

  return canvas.toDataURL("image/jpeg", 0.92);
}

/** Coloring-book cover: a single 8.5×11 PORTRAIT front cover — the line-art
 *  cover image full-bleed with the book name + kids in white over a dark top
 *  gradient. Coloring books aren't perfect-bound, so there's no wraparound
 *  back/spine like the 8×8 books. */
async function renderPortraitCover(
  page: BookPage,
  childName: string,
  parashaLabel: string,
  scale = 1,
  lang: "en" | "he" | "yi" = "en",
): Promise<string> {
  await ensureCoverFonts();
  const W = COLOR_W, H = COLOR_H;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale; canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  if (scale !== 1) ctx.scale(scale, scale);
  const rtl = lang !== "en";

  const img = await safeLoad(page.image);
  if (img) drawFullImage(ctx, img, W, H);
  else { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H); }

  // Same branded chrome as the bound books. Coloring covers show the localized
  // parasha name (gold) + the kids' names (magenta) rather than the story's
  // generated bilingual title.
  drawCoverFurniture(ctx, W, H, {
    brand: "Torah Tale",
    parsha: parashaLabel,
    title: childName,
    tagline: FRONT_TAGLINE,
    rtl,
  });
  return canvas.toDataURL("image/jpeg", 0.92);
}

/** Coloring books have no printed back cover, so the LAST page doubles as the
 *  back matter: the Torah Tale logo, up to 10 discussion questions, the
 *  subscribe invitation, and the 4 "coming next" teaser thumbnails — everything
 *  that would otherwise live on a back cover. 8.5×11 portrait. */
async function renderColoringBackMatter(
  page: BookPage,
  childName: string,
  previews: BackCoverPreview[],
  lang: "en" | "he" | "yi",
  scale = 1,
): Promise<string> {
  const W = COLOR_W, H = COLOR_H;
  const rtl = lang !== "en";
  const canvas = document.createElement("canvas");
  canvas.width = W * scale; canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  if (scale !== 1) ctx.scale(scale, scale);
  drawPaperFull(ctx, W, H);
  const padX = W * 0.08;
  let y = H * 0.035;

  // ── Logo (icon + wordmark), centered ──
  const [icon, wordmark] = await Promise.all([safeLoad(torahTaleIcon), safeLoad(torahTaleWordmark)]);
  if (icon && wordmark) {
    const iconH = 84, iconW = (icon.naturalWidth / icon.naturalHeight) * iconH;
    const wmH = 50, wmW = (wordmark.naturalWidth / wordmark.naturalHeight) * wmH;
    const gap = 16, groupW = iconW + gap + wmW, startX = W / 2 - groupW / 2;
    ctx.drawImage(icon, startX, y, iconW, iconH);
    ctx.drawImage(wordmark, startX + iconW + gap, y + (iconH - wmH) / 2, wmW, wmH);
    y += iconH + 28;
  }

  // ── Up to 10 discussion questions ──
  const allQ = (page.questions && page.questions.length)
    ? page.questions.map((q) => `${q.number}. ${q.question}`)
    : (page.text || "").split("\n").map((s) => s.trim()).filter(Boolean);
  const questions = allQ.slice(0, 10);
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = rtl ? "right" : "left";
  ctx.textBaseline = "top";
  const anchorX = rtl ? W - padX : padX;
  ctx.fillStyle = "#b88a2a";
  ctx.font = `bold 38px 'Playfair Display', serif`;
  ctx.fillText(rtl ? "פֿראגן צום רעדן" : "Questions to Talk About", anchorX, y);
  y += 54;
  ctx.fillStyle = "#2b2418";
  const qf = 27;
  ctx.font = `${qf}px ${BOOK_TEXT_STYLE.fontFamily}`;
  for (const q of questions) {
    for (const ln of wrapLines(ctx, q, W - padX * 2)) { ctx.fillText(ln, anchorX, y); y += qf * 1.32; }
    y += 5;
  }

  // ── Subscribe invitation (localized → RTL); URL stays LTR ──
  y = Math.max(y + 18, H * 0.66);
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = "center";
  ctx.fillStyle = "#5a4a32";
  const tSize = 32;
  ctx.font = `italic ${tSize}px ${BOOK_TEXT_STYLE.fontFamily}`;
  const taglineLines = page.backCoverText && page.backCoverText.trim()
    ? page.backCoverText.split("\n").map((l) => l.trim()).filter(Boolean)
    : getCoverTagline(lang);
  taglineLines.forEach((line, i) => ctx.fillText(line, W / 2, y + i * (tSize * 1.3)));
  y += taglineLines.length * (tSize * 1.3) + 22;

  // ── "Coming next" teaser thumbnails (mini front covers) ──
  const previewImgs = await Promise.all(previews.slice(0, 4).map((p) => (p.url ? safeLoad(p.url) : Promise.resolve(null))));
  const thumb = 235, tgap = 22;
  const rowW = 4 * thumb + 3 * tgap;
  const rowX = W / 2 - rowW / 2;
  for (let i = 0; i < 4; i++) {
    const tx = rowX + i * (thumb + tgap);
    ctx.fillStyle = "#efe7d3";
    roundedRect(ctx, tx, y, thumb, thumb, 12); ctx.fill();
    const pimg = previewImgs[i];
    if (pimg) drawImageInRect(ctx, pimg, tx, y, thumb, thumb, 12);
    const pv = previews[i];
    if (pv?.label) {
      ctx.save();
      roundedRect(ctx, tx, y, thumb, thumb, 12); ctx.clip();
      const bandH = thumb * 0.44;
      const g = ctx.createLinearGradient(tx, y, tx, y + bandH);
      g.addColorStop(0, "rgba(0,0,0,0.62)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(tx, y, thumb, bandH);
      ctx.direction = rtl ? "rtl" : "ltr";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
      ctx.fillStyle = "#ffffff";
      ctx.font = `700 24px 'Inter', sans-serif`;
      const lbl = wrapLines(ctx, pv.label, thumb - 18).slice(0, 2);
      lbl.forEach((ln, li) => ctx.fillText(ln, tx + thumb / 2, y + 9 + li * 28));
      if (childName) {
        ctx.font = `500 18px 'Inter', sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText(childName, tx + thumb / 2, y + 11 + lbl.length * 28);
      }
      ctx.restore();
    }
    ctx.strokeStyle = "rgba(0,0,0,0.28)"; ctx.lineWidth = 2;
    roundedRect(ctx, tx, y, thumb, thumb, 12); ctx.stroke();
  }
  y += thumb + 26;

  // ── Site URL ──
  ctx.direction = "ltr";
  ctx.textAlign = "center";
  ctx.fillStyle = "#b88a2a";
  ctx.font = `600 26px 'Inter', sans-serif`;
  ctx.fillText(COVER_URL.toUpperCase(), W / 2, Math.min(y, H - 46));

  return canvas.toDataURL("image/jpeg", 0.92);
}

/**
 * Composite the print-ready images for Printify, in the exact order of the
 * blueprint's print placeholders: [cover-wrap, page_1, page_2, …]. These are
 * the SAME fully-rendered images the PDF/preview use — the cover is a 2:1
 * wraparound (back + spine + front, with the title baked on) and every interior
 * page has its caption text composited in. printify-submit uploads these instead
 * of the raw, text-free stored illustrations (which was why printed books came
 * out with no text and a mis-arranged cover).
 *
 * The discussion-questions page is rendered as its own clean page (matching the
 * on-screen PDF), filling the trailing interior slot — earlier it was composited
 * onto the last story illustration, which overlapped the art.
 */
/** Pull the back-cover teasers from the generated "preview" pages (each carries
 *  an upcoming `portion` + its generated cover `image`). Label is derived from
 *  the portion so it follows the book's language. */
function backCoverPreviews(pages: BookPage[], lang: "en" | "he" | "yi"): BackCoverPreview[] {
  return pages
    .filter((p) => p.type === "preview")
    .slice(0, 4)
    .map((p) => ({ label: getPortionDisplay(p.portion || "", lang) || p.portion || "", url: p.image }));
}

export async function renderPrintImages(
  pages: BookPage[],
  childName: string,
  torahPortion: string,
  rtl = false,
  bookFormat = "",
  lang: "en" | "he" | "yi" = "en",
): Promise<string[]> {
  const parashaLabel = getPortionDisplay(torahPortion, lang) || torahPortion || "Torah Tale";
  const mode = layoutMode(bookFormat, pages);
  // Render at 2× our 1200-based canvas so the output matches the Printify print
  // slots natively (pages 2400², cover ~4800×2400) instead of letting Printify
  // upscale a 1200px image — text and the cover wrap come out crisp (~300 DPI).
  const PRINT_SCALE = 2;
  const out: string[] = [];
  const cover = pages.find((p) => p.type === "cover");
  const previews = backCoverPreviews(pages, lang);
  if (cover) out.push(await (mode === "portrait"
    ? renderPortraitCover(cover, childName, parashaLabel, PRINT_SCALE, lang)
    : renderCoverSpread(cover, childName, parashaLabel, PRINT_SCALE, bookFormat, previews, lang)));

  const questionsPage = pages.find((p) => p.type === "questions");
  const stories = pages.filter((p) => p.type === "story" || !p.type);
  for (let i = 0; i < stories.length; i++) {
    out.push(await renderStorySpread(stories[i], i, rtl, mode, PRINT_SCALE));
  }
  // The discussion questions get their OWN page — matching the on-screen PDF.
  // Bound 8×8/board books have a trailing interior page slot for it (Printify was
  // leaving that page blank while the questions were composited onto the last
  // story illustration, overlapping the art). Coloring books get a dedicated
  // back-matter page instead (they have no back cover for the teasers).
  if (questionsPage) {
    out.push(mode === "portrait"
      ? await renderColoringBackMatter(questionsPage, childName, previews, lang, PRINT_SCALE)
      : await renderQuestionsSpread(questionsPage, rtl, mode, PRINT_SCALE));
  }
  return out;
}

export async function generateBookPdf(
  pages: BookPage[],
  childName: string,
  torahPortion: string,
  rtl = false,
  bookFormat = "",
  lang: "en" | "he" | "yi" = "en",
): Promise<Blob> {
  // Cover text: Parasha name is the hero (big), kids are the co-stars (small),
  // mirroring the on-screen BookViewer.
  const parashaLabel = getPortionDisplay(torahPortion, lang) || torahPortion || "Torah Tale";
  // Board (6×6) → wide 2:1 spreads. Softcover/Hardcover (8×8) → square pages.
  // Coloring (8.5×11) → tall portrait line-art pages with a portrait front cover.
  const mode = layoutMode(bookFormat, pages);
  const pdfPreviews = backCoverPreviews(pages, lang);
  const renderable = pages.filter((p) => p.type !== "back-cover" && p.type !== "preview");
  const WIDE: [number, number] = [356, 178]; // mm — 2:1 cover/spread
  const SQUARE: [number, number] = [178, 178]; // mm — single 8×8 page
  const LETTER: [number, number] = [215.9, 279.4]; // mm — 8.5×11 portrait coloring page
  const interior: [number, number] = mode === "spread" ? WIDE : mode === "portrait" ? LETTER : SQUARE;
  // Bound 8×8/board books have a wide wraparound cover; the coloring book has a
  // single portrait front cover the same size as its pages.
  const coverFmt: [number, number] = mode === "portrait" ? LETTER : WIDE;

  const pdf = new jsPDF({
    orientation: coverFmt[0] >= coverFmt[1] ? "landscape" : "portrait",
    unit: "mm",
    format: coverFmt,
  });

  let storyIdx = 0;
  for (let i = 0; i < renderable.length; i++) {
    const page = renderable[i];
    const fmt: [number, number] = page.type === "cover" ? coverFmt : interior;
    if (i > 0) pdf.addPage(fmt, fmt[0] >= fmt[1] ? "landscape" : "portrait");
    let dataUrl: string;
    if (page.type === "cover") {
      dataUrl = mode === "portrait"
        ? await renderPortraitCover(page, childName, parashaLabel, 1, lang)
        : await renderCoverSpread(page, childName, parashaLabel, 1, bookFormat, pdfPreviews, lang);
    } else if (page.type === "questions") {
      // Coloring books have no back cover — the questions page becomes the back
      // matter (logo + up to 10 questions + subscribe + teaser thumbnails).
      dataUrl = mode === "portrait"
        ? await renderColoringBackMatter(page, childName, pdfPreviews, lang)
        : await renderQuestionsSpread(page, rtl, mode);
    } else {
      dataUrl = await renderStorySpread(page, storyIdx, rtl, mode);
      storyIdx += 1;
    }
    try {
      pdf.addImage(dataUrl, "JPEG", 0, 0, fmt[0], fmt[1]);
    } catch {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(0, 0, fmt[0], fmt[1], "F");
    }
  }
  // expose default for any callers that need it
  void DEFAULT_TEXT_LAYOUT;
  return pdf.output("blob");
}
