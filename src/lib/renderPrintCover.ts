/**
 * Bake the front-cover text (Parasha name big, kids' names small) onto the
 * cover illustration, matching the on-screen BookViewer cover. Returns a JPEG
 * data URL. Used at approval time so the image sent to Printify's cover slot
 * carries the title — the stored cover image itself stays text-free (the viewer
 * overlays text with live HTML).
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderPrintCoverFront(
  imageUrl: string,
  parashaName: string,
  kids: string,
): Promise<string> {
  const img = await loadImage(imageUrl);
  const W = img.naturalWidth || 1024;
  const H = img.naturalHeight || 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, W, H);

  // Soft white band at the top so the title reads over any illustration.
  const bandH = H * 0.3;
  const grad = ctx.createLinearGradient(0, 0, 0, bandH);
  grad.addColorStop(0, "rgba(255,255,255,0.92)");
  grad.addColorStop(0.6, "rgba(255,255,255,0.6)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, bandH);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Parasha name — big, bold serif, dark.
  const titleSize = Math.round(W * 0.075);
  ctx.font = `bold ${titleSize}px 'Playfair Display', Georgia, serif`;
  ctx.fillStyle = "#2b2418";
  const titleLines = wrapLines(ctx, parashaName || "Torah Tale", W * 0.86);
  const top = H * 0.045;
  titleLines.forEach((line, i) => ctx.fillText(line, W / 2, top + i * titleSize * 1.12));

  // Kids — small, italic, gold.
  if (kids) {
    const subSize = Math.round(W * 0.04);
    ctx.font = `italic ${subSize}px Georgia, serif`;
    ctx.fillStyle = "#b88a2a";
    ctx.fillText(kids, W / 2, top + titleLines.length * titleSize * 1.12 + subSize * 0.4);
  }

  return canvas.toDataURL("image/jpeg", 0.95);
}
