import JSZip from "jszip";

/**
 * Convert a base64 data-URL or remote URL to a Blob (JPEG).
 */
async function imageToBlob(src: string): Promise<Blob> {
  if (src.startsWith("data:")) {
    const res = await fetch(src);
    return res.blob();
  }
  const res = await fetch(src);
  return res.blob();
}

export interface BookPage {
  type?: string;
  image?: string | null;
  text?: string;
}

/**
 * Generate a ZIP file containing all book page images as JPEGs,
 * named sequentially: cover-front.jpg, page-01.jpg, …, cover-back.jpg
 */
export async function generateBookZip(
  pages: BookPage[],
  childName: string,
  orderNumber?: string
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder(
    `${orderNumber || "book"}-${childName || "images"}`.replace(/\s+/g, "-").toLowerCase()
  )!;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (!page.image) continue;

    let filename: string;
    if (i === 0) {
      filename = "cover-front.jpg";
    } else if (i === pages.length - 1) {
      filename = "cover-back.jpg";
    } else {
      filename = `page-${String(i).padStart(2, "0")}.jpg`;
    }

    try {
      const blob = await imageToBlob(page.image);
      folder.file(filename, blob);
    } catch (err) {
      console.error(`Failed to add ${filename} to zip:`, err);
    }
  }

  return zip.generateAsync({ type: "blob" });
}
