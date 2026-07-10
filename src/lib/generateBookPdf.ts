import jsPDF from "jspdf";
import { BOOK_TEXT_STYLE, COVER_TAGLINE, COVER_URL, type BookPage } from "@/components/wizard/BookViewer";
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

async function renderStorySpread(page: BookPage, _storyIdx: number, rtl: boolean, spreadBased: boolean, scale = 1, questionsText?: string): Promise<string> {
  // Board: one illustration fills the 2:1 spread. 8×8: one square page image.
  const W = spreadBased ? SPREAD_W : SPREAD_H; // square page = SPREAD_H × SPREAD_H
  const H = SPREAD_H;

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

  if (spreadBased) drawGutter(ctx, W, H);
  drawTextOverlay(ctx, page.text || "", layout, W, H);

  // The discussion questions ride at the bottom of the LAST story page (this
  // print blueprint has no spare interior slot / inside-cover for them).
  if (questionsText && questionsText.trim()) {
    const panelH = H * 0.4;
    const py = H - panelH;
    ctx.save();
    ctx.fillStyle = "rgba(250,245,232,0.94)";
    ctx.fillRect(0, py, W, panelH);
    ctx.strokeStyle = "rgba(0,0,0,0.14)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, py + 1); ctx.lineTo(W, py + 1); ctx.stroke();
    const padX = W * 0.06;
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillStyle = "#b88a2a";
    const hs = Math.round(W * 0.034);
    ctx.font = `bold ${hs}px 'Playfair Display', serif`;
    ctx.fillText("Questions to Talk About", padX, py + H * 0.035);
    ctx.fillStyle = "#2b2418";
    const fs = Math.round(W * 0.026);
    ctx.font = `${fs}px ${BOOK_TEXT_STYLE.fontFamily}`;
    const lines = wrapLines(ctx, questionsText, W - padX * 2);
    let qy = py + H * 0.035 + hs + Math.round(H * 0.02);
    const lh = fs * 1.42;
    for (const ln of lines) {
      if (qy > H - fs) break;
      ctx.fillText(ln, padX, qy);
      qy += lh;
    }
    ctx.restore();
  }
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function renderQuestionsSpread(page: BookPage, rtl: boolean, spreadBased: boolean, scale = 1): Promise<string> {
  // The questions page sits on a clean, empty parchment page (no illustration)
  // so the discussion text is always easy to read.
  const layout = migrateLayout(page.textLayout) || makeQuestionsLayout(rtl);
  const W = spreadBased ? SPREAD_W : SPREAD_H;
  const H = SPREAD_H;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale; canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  if (scale !== 1) ctx.scale(scale, scale);
  drawPaperFull(ctx, W, H);
  if (spreadBased) drawGutter(ctx, W, H);
  const questions = page.questions || [];
  const formatted = page.text || questions.map((q) => `${q.number}. ${q.question}`).join("\n\n");
  drawTextOverlay(ctx, formatted, layout, W, H);
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

async function renderCoverSpread(
  page: BookPage,
  childName: string,
  parashaLabel: string,
  scale = 1,
  bookFormat = "",
  previews: BackCoverPreview[] = [],
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = SPREAD_W * scale; canvas.height = SPREAD_H * scale;
  const ctx = canvas.getContext("2d")!;
  if (scale !== 1) ctx.scale(scale, scale);
  drawPaperHalf(ctx, "left");

  // ── BACK COVER (left half): book name + child + a 2×2 "coming next" grid of
  // upcoming-story teasers, to drive subscriptions. Small brand logo + URL. ──
  const [icon, wordmark] = await Promise.all([safeLoad(torahTaleIcon), safeLoad(torahTaleWordmark)]);
  if (icon && wordmark) {
    const iconH = 96;
    const iconW = (icon.naturalWidth / icon.naturalHeight) * iconH;
    const wmH = 60;
    const wmW = (wordmark.naturalWidth / wordmark.naturalHeight) * wmH;
    const gap = 16;
    const groupW = iconW + gap + wmW;
    const startX = HALF_W / 2 - groupW / 2;
    const cY = 92;
    ctx.drawImage(icon, startX, cY - iconH / 2, iconW, iconH);
    ctx.drawImage(wordmark, startX + iconW + gap, cY - wmH / 2, wmW, wmH);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  // Book name (parasha) + child name.
  ctx.fillStyle = "#2b2418";
  ctx.font = `bold 58px 'Playfair Display', serif`;
  const backTitleLines = wrapLines(ctx, parashaLabel, HALF_W - 160);
  let ty = 168;
  backTitleLines.forEach((line) => { ctx.fillText(line, HALF_W / 2, ty); ty += 66; });
  if (childName) {
    ctx.fillStyle = "#b88a2a";
    ctx.font = `italic 40px ${BOOK_TEXT_STYLE.fontFamily}`;
    ctx.fillText(childName, HALF_W / 2, ty + 2);
    ty += 58;
  }

  // "Coming up next" teaser heading.
  ctx.fillStyle = "#5a4a32";
  ctx.font = `600 30px 'Inter', sans-serif`;
  const headingY = ty + 20;
  ctx.fillText("MORE STORIES EVERY WEEK", HALF_W / 2, headingY);

  // 2×2 grid of preview images (fall back to a name card when an image is missing).
  const previewImgs = await Promise.all(previews.slice(0, 4).map((p) => (p.url ? safeLoad(p.url) : Promise.resolve(null))));
  const gridTop = headingY + 54;
  const gridBottom = SPREAD_H - 96;
  const margin = 80;
  const gapG = 34;
  const cellW = (HALF_W - margin * 2 - gapG) / 2;
  const cellH = (gridBottom - gridTop - gapG) / 2;
  for (let i = 0; i < 4; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const cx = margin + col * (cellW + gapG);
    const cyy = gridTop + row * (cellH + gapG);
    const item = previews[i];
    const pimg = previewImgs[i];
    // Card background.
    ctx.fillStyle = "#efe7d3";
    roundedRect(ctx, cx, cyy, cellW, cellH, 18); ctx.fill();
    if (pimg) {
      drawImageInRect(ctx, pimg, cx, cyy, cellW, cellH, 18);
    }
    // Label band at the bottom of the cell.
    if (item?.label) {
      ctx.save();
      roundedRect(ctx, cx, cyy, cellW, cellH, 18); ctx.clip();
      const bandH2 = 62;
      ctx.fillStyle = pimg ? "rgba(20,16,10,0.66)" : "rgba(184,138,42,0.16)";
      ctx.fillRect(cx, cyy + cellH - bandH2, cellW, bandH2);
      ctx.fillStyle = pimg ? "#ffffff" : "#5a4a32";
      ctx.font = `600 26px 'Inter', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lbl = item.label.length > 22 ? item.label.slice(0, 21) + "…" : item.label;
      ctx.fillText(lbl, cx + cellW / 2, cyy + cellH - bandH2 / 2);
      ctx.restore();
    }
    // Thin card border.
    ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth = 2;
    roundedRect(ctx, cx, cyy, cellW, cellH, 18); ctx.stroke();
  }

  // Subscription URL footer.
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#b88a2a";
  ctx.font = `700 30px 'Inter', sans-serif`;
  ctx.fillText(`SUBSCRIBE AT ${COVER_URL.toUpperCase()}`, HALF_W / 2, SPREAD_H - 52);

  // ── FRONT COVER (right half): illustration + Parasha name + child. ──
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

  ctx.fillStyle = "#2b2418";
  ctx.font = `bold 82px 'Playfair Display', serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const titleLines = wrapLines(ctx, parashaLabel, HALF_W - 120);
  titleLines.forEach((line, i) => ctx.fillText(line, HALF_W + HALF_W / 2, 70 + i * 92));
  if (childName) {
    ctx.fillStyle = "#b88a2a";
    ctx.font = `italic 46px ${BOOK_TEXT_STYLE.fontFamily}`;
    ctx.fillText(childName, HALF_W + HALF_W / 2, 70 + titleLines.length * 92 + 22);
  }
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
    ctx.fillStyle = "#2b2418";
    ctx.font = `600 ${Math.min(40, spineW * 0.5)}px 'Playfair Display', serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(spineText, 0, 0);
    ctx.restore();
  }

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
 * Note: these blueprints have no slot for the discussion-questions page, so it
 * is intentionally omitted here (it never had a print image anyway).
 */
export async function renderPrintImages(
  pages: BookPage[],
  childName: string,
  torahPortion: string,
  rtl = false,
  bookFormat = "",
  lang: "en" | "he" | "yi" = "en",
  previews: BackCoverPreview[] = [],
): Promise<string[]> {
  const parashaLabel = getPortionDisplay(torahPortion, lang) || torahPortion || "Torah Tale";
  const spreadBased = bookFormat.startsWith("board");
  // Render at 2× our 1200-based canvas so the output matches the Printify print
  // slots natively (pages 2400², cover ~4800×2400) instead of letting Printify
  // upscale a 1200px image — text and the cover wrap come out crisp (~300 DPI).
  const PRINT_SCALE = 2;
  const out: string[] = [];
  const cover = pages.find((p) => p.type === "cover");
  if (cover) out.push(await renderCoverSpread(cover, childName, parashaLabel, PRINT_SCALE, bookFormat, previews));

  // The questions page has no print slot on these blueprints, so its content is
  // composited onto the bottom of the last story page instead of being dropped.
  const questionsPage = pages.find((p) => p.type === "questions");
  const questionsText = questionsPage
    ? (questionsPage.text || (questionsPage.questions || []).map((q) => `${q.number}. ${q.question}`).join("\n\n"))
    : "";
  const stories = pages.filter((p) => p.type !== "cover" && p.type !== "back-cover" && p.type !== "questions");
  for (let i = 0; i < stories.length; i++) {
    const isLast = i === stories.length - 1;
    out.push(await renderStorySpread(stories[i], i, rtl, spreadBased, PRINT_SCALE, isLast ? questionsText : undefined));
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
      dataUrl = await renderCoverSpread(page, childName, parashaLabel, 1, bookFormat, []);
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
