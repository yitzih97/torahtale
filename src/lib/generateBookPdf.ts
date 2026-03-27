import jsPDF from "jspdf";
import type { BookPage } from "@/components/wizard/BookViewer";
import type { TextStyle } from "@/components/wizard/DraggableText";

/**
 * Load an image into an HTMLImageElement.
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

/**
 * Composite text overlay onto image using canvas, return as base64 JPEG.
 */
async function compositeWithText(
  imageSrc: string,
  text: string,
  style: TextStyle
): Promise<string> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  if (!text) return canvas.toDataURL("image/jpeg", 0.92);

  const displayWidth = 800;
  const scale = canvas.width / displayWidth;
  const x = (style.x / 100) * canvas.width;
  const y = (style.y / 100) * canvas.height;
  const boxWidth = (style.width / 100) * canvas.width;
  const fontSize = style.fontSize * scale;
  const fontFamily = style.fontFamily || "'Georgia', serif";

  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = style.textAlign || "center";
  ctx.textBaseline = "middle";

  const maxWidth = boxWidth - 20 * scale;
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    const words = para.split(" ");
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }

  const lineHeight = fontSize * 1.4;
  const totalH = lines.length * lineHeight;
  const padding = 12 * scale;

  if (style.bgOpacity > 0) {
    ctx.fillStyle = `rgba(0,0,0,${style.bgOpacity})`;
    const bgX = x - boxWidth / 2;
    const bgY = y - totalH / 2 - padding;
    ctx.beginPath();
    ctx.roundRect(bgX, bgY, boxWidth, totalH + padding * 2, 8 * scale);
    ctx.fill();
  }

  ctx.fillStyle = style.color || "#ffffff";
  let textX = x;
  if (style.textAlign === "left") textX = x - boxWidth / 2 + padding;
  else if (style.textAlign === "right") textX = x + boxWidth / 2 - padding;

  const startY = y - totalH / 2 + lineHeight / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], textX, startY + i * lineHeight);
  }

  return canvas.toDataURL("image/jpeg", 0.92);
}

/**
 * Fetches an image URL and returns it as a base64 data URL.
 */
async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Generates a printable PDF from book pages.
 * Story pages get text composited ON the image.
 */
export async function generateBookPdf(
  pages: BookPage[],
  childName: string,
  torahPortion: string
): Promise<Blob> {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = 297;
  const pageH = 210;
  const margin = 10;
  const imgW = pageW - margin * 2;
  const imgH = imgW * (3 / 4);
  const textY = margin + imgH + 5;
  const textW = imgW;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (i > 0) pdf.addPage();

    // For story pages with text overlay, composite text onto image
    if (page.type === "story" && page.image && page.text && page.textStyle) {
      try {
        const composited = await compositeWithText(page.image, page.text, page.textStyle);
        pdf.addImage(composited, "JPEG", margin, margin, imgW, imgH);
      } catch {
        // Fallback: draw image without text
        const base64 = await imageUrlToBase64(page.image);
        if (base64) {
          try { pdf.addImage(base64, "JPEG", margin, margin, imgW, imgH); } catch { /* placeholder */ }
        }
      }
    } else if (page.image) {
      const base64 = await imageUrlToBase64(page.image);
      if (base64) {
        try {
          pdf.addImage(base64, "JPEG", margin, margin, imgW, imgH);
        } catch {
          pdf.setFillColor(240, 240, 240);
          pdf.rect(margin, margin, imgW, imgH, "F");
        }
      }
    } else {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, margin, imgW, imgH, "F");
    }

    // Draw metadata below image for cover/back-cover
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);

    if (page.type === "cover") {
      pdf.setFontSize(20);
      pdf.setTextColor(30, 30, 30);
      const title = page.coverTitle || `${childName}'s Torah Adventure`;
      pdf.text(title, pageW / 2, textY + 5, { align: "center" });
      if (page.coverSubtitle) {
        pdf.setFontSize(12);
        pdf.setTextColor(100, 100, 100);
        pdf.text(page.coverSubtitle, pageW / 2, textY + 14, { align: "center" });
      }
    } else if (page.type === "back-cover") {
      if (page.synopsis) {
        pdf.setFontSize(11);
        pdf.setTextColor(50, 50, 50);
        const lines = pdf.splitTextToSize(page.synopsis, textW - 20);
        pdf.text(lines, pageW / 2, textY + 4, { align: "center" });
      }
      if (page.dedication) {
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);
        pdf.text(page.dedication, pageW / 2, textY + 20, { align: "center" });
      }
      if (page.questions && page.questions.length > 0) {
        pdf.setFontSize(9);
        pdf.setTextColor(60, 60, 60);
        let qY = textY + 28;
        pdf.setFontSize(10);
        pdf.text("Discussion Questions:", margin + 5, qY);
        qY += 5;
        pdf.setFontSize(8);
        for (const q of page.questions.slice(0, 10)) {
          const qLine = `${q.number}. ${q.question}`;
          const wrapped = pdf.splitTextToSize(qLine, textW / 2 - 10);
          if (qY + wrapped.length * 4 > pageH - 5) break;
          pdf.text(wrapped, margin + 5, qY);
          qY += wrapped.length * 4 + 1;
        }
      }
    }
    // Story pages: text is composited on the image, no separate text section needed

    // Page number (skip cover)
    if (page.type !== "cover") {
      pdf.setFontSize(8);
      pdf.setTextColor(180, 180, 180);
      pdf.text(`${i + 1}`, pageW / 2, pageH - 5, { align: "center" });
    }
  }

  return pdf.output("blob");
}
