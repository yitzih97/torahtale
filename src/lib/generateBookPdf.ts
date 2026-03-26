import jsPDF from "jspdf";
import type { BookPage } from "@/components/wizard/BookViewer";

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
 * Uses landscape A4 with 4:3 image area + text section below.
 */
export async function generateBookPdf(
  pages: BookPage[],
  childName: string,
  torahPortion: string
): Promise<Blob> {
  // Landscape A4
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = 297;
  const pageH = 210;
  const margin = 10;
  const imgW = pageW - margin * 2;
  const imgH = imgW * (3 / 4); // 4:3 ratio
  const textY = margin + imgH + 5;
  const textW = imgW;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (i > 0) pdf.addPage();

    // Draw image
    if (page.image) {
      const base64 = await imageUrlToBase64(page.image);
      if (base64) {
        try {
          pdf.addImage(base64, "JPEG", margin, margin, imgW, imgH);
        } catch {
          // Draw placeholder rect
          pdf.setFillColor(240, 240, 240);
          pdf.rect(margin, margin, imgW, imgH, "F");
        }
      }
    } else {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, margin, imgW, imgH, "F");
    }

    // Draw text section
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
    } else {
      // Story page
      pdf.setFontSize(12);
      pdf.setTextColor(40, 40, 40);
      const lines = pdf.splitTextToSize(page.text || "", textW - 10);
      pdf.text(lines, pageW / 2, textY + 5, { align: "center" });
    }

    // Page number (skip cover)
    if (page.type !== "cover") {
      pdf.setFontSize(8);
      pdf.setTextColor(180, 180, 180);
      pdf.text(`${i + 1}`, pageW / 2, pageH - 5, { align: "center" });
    }
  }

  return pdf.output("blob");
}
