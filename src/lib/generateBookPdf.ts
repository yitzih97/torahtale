import jsPDF from "jspdf";
import { BOOK_TEXT_STYLE, COVER_TAGLINE, COVER_URL, type BookPage } from "@/components/wizard/BookViewer";
import { DEFAULT_TEXT_LAYOUT, makeDefaultLayout, makeQuestionsLayout, type TextLayout } from "@/components/wizard/EditableTextBox";
import { computeAutoTextLayout } from "@/lib/analyzeImageLayout";
import torahTaleIcon from "@/assets/brand/torah-tale-icon.png";
import torahTaleWordmark from "@/assets/brand/torah-tale-text-gold.png";

/* Spread = 2:1 landscape sheet. Image fills one half, text composited
   per page from BookPage.textLayout. */

const SPREAD_W = 2400;
const SPREAD_H = 1200;
const HALF_W = SPREAD_W / 2;

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
function drawTextOverlay(ctx: CanvasRenderingContext2D, text: string, layout: TextLayout, W: number, H: number) {
  if (!text) return;
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
  const lineHeight = fontSize * 1.5;
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
    ctx.strokeStyle = "rgba(0,0,0,0.28)";
    ctx.lineWidth = 2;
    roundedRect(ctx, boxX, boxY, boxW, boxH, 18);
    ctx.stroke();
  }

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
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  for (let i = 0; i < lines.length; i++) {
    const ly = boxY + padY + i * lineHeight;
    if (outline) {
      ctx.strokeStyle = "#ffffff";
      // Scale the ref-space width to canvas pixels the same way the font is scaled.
      ctx.lineWidth = Math.max(1, outlineWidthRef * (fontSize / layout.fontSize));
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

async function renderStorySpread(page: BookPage, _storyIdx: number, rtl: boolean, spreadBased: boolean): Promise<string> {
  // Board: one illustration fills the 2:1 spread. 8×8: one square page image.
  const W = spreadBased ? SPREAD_W : SPREAD_H; // square page = SPREAD_H × SPREAD_H
  const H = SPREAD_H;

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const img = await safeLoad(page.image);
  // Layout precedence: an admin-adjusted layout wins; otherwise auto-place the
  // text over the illustration's calmest area; otherwise the static default.
  let layout = page.textLayout;
  if (img) {
    drawFullImage(ctx, img, W, H);
    if (!layout) layout = computeAutoTextLayout(img, rtl, page.text) || undefined;
  } else {
    ctx.fillStyle = "#dcd2bd";
    ctx.fillRect(0, 0, W, H);
  }
  if (!layout) layout = makeDefaultLayout(rtl ? "right" : "left", rtl);

  if (spreadBased) drawGutter(ctx, W, H);
  drawTextOverlay(ctx, page.text || "", layout, W, H);
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function renderQuestionsSpread(page: BookPage, rtl: boolean, spreadBased: boolean): Promise<string> {
  // The questions page sits on a clean, empty parchment page (no illustration)
  // so the discussion text is always easy to read.
  const layout = page.textLayout || makeQuestionsLayout(rtl);
  const W = spreadBased ? SPREAD_W : SPREAD_H;
  const H = SPREAD_H;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  drawPaperFull(ctx, W, H);
  if (spreadBased) drawGutter(ctx, W, H);
  const questions = page.questions || [];
  const formatted = page.text || questions.map((q) => `${q.number}. ${q.question}`).join("\n\n");
  drawTextOverlay(ctx, formatted, layout, W, H);
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function renderCoverSpread(page: BookPage, childName: string): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = SPREAD_W; canvas.height = SPREAD_H;
  const ctx = canvas.getContext("2d")!;
  drawPaperHalf(ctx, "left");

  // Render the icon + wordmark as ONE horizontal logo lockup (the real brand
  // logo), bigger and centered — not two separate stacked components.
  const [icon, wordmark] = await Promise.all([safeLoad(torahTaleIcon), safeLoad(torahTaleWordmark)]);
  if (icon && wordmark) {
    const iconH = 240;
    const iconW = (icon.naturalWidth / icon.naturalHeight) * iconH;
    const wmH = 150;
    const wmW = (wordmark.naturalWidth / wordmark.naturalHeight) * wmH;
    const gap = 28;
    const groupW = iconW + gap + wmW;
    const startX = HALF_W / 2 - groupW / 2;
    const centerY = SPREAD_H * 0.26;
    ctx.drawImage(icon, startX, centerY - iconH / 2, iconW, iconH);
    ctx.drawImage(wordmark, startX + iconW + gap, centerY - wmH / 2, wmW, wmH);
  }
  ctx.fillStyle = "#5a4a32";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tSize = 56;
  ctx.font = `italic ${tSize}px ${BOOK_TEXT_STYLE.fontFamily}`;
  const cy = SPREAD_H * 0.62;
  const taglineLines = page.backCoverText && page.backCoverText.trim()
    ? page.backCoverText.split("\n").map((l) => l.trim()).filter(Boolean)
    : COVER_TAGLINE;
  taglineLines.forEach((line, i) => {
    ctx.fillText(line, HALF_W / 2, cy + (i - (taglineLines.length - 1) / 2) * (tSize * 1.35));
  });
  ctx.fillStyle = "#b88a2a";
  ctx.font = `600 36px 'Inter', sans-serif`;
  ctx.fillText(COVER_URL.toUpperCase(), HALF_W / 2, SPREAD_H * 0.9);

  const img = await safeLoad(page.image);
  if (img) {
    drawHalfImage(ctx, img, HALF_W);
  } else {
    ctx.fillStyle = "#dcd2bd";
    ctx.fillRect(HALF_W, 0, HALF_W, SPREAD_H);
  }
  const bandH = SPREAD_H * 0.28;
  const bandGrad = ctx.createLinearGradient(HALF_W, 0, HALF_W, bandH);
  bandGrad.addColorStop(0, "rgba(255,255,255,0.94)");
  bandGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = bandGrad;
  ctx.fillRect(HALF_W, 0, HALF_W, bandH);

  const title = page.coverTitle || `${childName}'s Torah Tale`;
  ctx.fillStyle = "#2b2418";
  ctx.font = `bold 78px 'Playfair Display', serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const titleLines = wrapLines(ctx, title, HALF_W - 120);
  titleLines.forEach((line, i) => ctx.fillText(line, HALF_W + HALF_W / 2, 70 + i * 90));
  if (page.coverSubtitle) {
    ctx.fillStyle = "#b88a2a";
    ctx.font = `italic 42px ${BOOK_TEXT_STYLE.fontFamily}`;
    ctx.fillText(page.coverSubtitle, HALF_W + HALF_W / 2, 70 + titleLines.length * 90 + 18);
  }
  drawGutter(ctx, SPREAD_W, SPREAD_H);

  // Spine — story title + kids' names down the center fold (mirrors the cover).
  const spineW = SPREAD_W * 0.05;
  const spineX = HALF_W - spineW / 2;
  ctx.fillStyle = "#efe7d3";
  ctx.fillRect(spineX, 0, spineW, SPREAD_H);
  const spineShade = ctx.createLinearGradient(spineX, 0, spineX + spineW, 0);
  spineShade.addColorStop(0, "rgba(0,0,0,0.16)");
  spineShade.addColorStop(0.5, "rgba(0,0,0,0)");
  spineShade.addColorStop(1, "rgba(0,0,0,0.16)");
  ctx.fillStyle = spineShade;
  ctx.fillRect(spineX, 0, spineW, SPREAD_H);
  const spineText = [page.coverTitle?.trim(), page.coverSubtitle?.trim()].filter(Boolean).join("  ")
    || `${childName}'s Torah Tale`;
  ctx.save();
  ctx.translate(HALF_W, SPREAD_H / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = "#2b2418";
  ctx.font = `600 40px 'Playfair Display', serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(spineText, 0, 0);
  ctx.restore();

  return canvas.toDataURL("image/jpeg", 0.92);
}

export async function generateBookPdf(
  pages: BookPage[],
  childName: string,
  _torahPortion: string,
  rtl = false,
  bookFormat = "",
): Promise<Blob> {
  // Board (6×6) is spread-based → wide 2:1 interior pages. Softcover/Hardcover
  // (8×8) are page-based → square interior pages. The cover wrap is always wide.
  const spreadBased = bookFormat.startsWith("board");
  const renderable = pages.filter((p) => p.type !== "back-cover");
  const WIDE: [number, number] = [356, 178]; // mm — 2:1 cover/spread
  const SQUARE: [number, number] = [178, 178]; // mm — single 8×8 page
  const interior: [number, number] = spreadBased ? WIDE : SQUARE;

  // First page (cover) is always wide; initialise the doc to it.
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: WIDE });

  let storyIdx = 0;
  for (let i = 0; i < renderable.length; i++) {
    const page = renderable[i];
    const fmt: [number, number] = page.type === "cover" ? WIDE : interior;
    if (i > 0) pdf.addPage(fmt, fmt[0] >= fmt[1] ? "landscape" : "portrait");
    let dataUrl: string;
    if (page.type === "cover") {
      dataUrl = await renderCoverSpread(page, childName);
    } else if (page.type === "questions") {
      dataUrl = await renderQuestionsSpread(page, rtl, spreadBased);
    } else {
      dataUrl = await renderStorySpread(page, storyIdx, rtl, spreadBased);
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
