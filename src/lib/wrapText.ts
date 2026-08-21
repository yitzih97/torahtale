// Shared line-wrapping used by BOTH the caption renderer (generateBookPdf) and
// the auto font-fitter (analyzeImageLayout), so the font size that's chosen to
// fit a caption matches exactly how that caption is later drawn.
//
// Wrapping breaks at natural PHRASE boundaries so a rendered line ends where a
// phrase ends - never mid-thought. Explicit "\n" in the text are honored as hard
// breaks (the author's/AI's own phrase boundaries).

export type MeasureFn = (text: string) => number;

/**
 * Torah Tale text uses a plain hyphen, never a long dash. New books are written
 * that way, but books generated before that rule still hold em/en dashes in
 * their saved story_data, so every caption is normalized on the way to the page
 * - the print files and the PDF are rendered from that text on demand, so an
 * old book reprints correctly. Escapes, not the characters themselves: the long
 * dash is not allowed in this codebase either.
 */
export const plainDashes = (text: string): string => text.replace(/[\u2014\u2013]/g, "-");

// Split a paragraph into phrases at clause boundaries - after clause punctuation
// (, ; : . ! ?) and around dashes - keeping the mark attached to the phrase it
// closes.
export function splitIntoPhrases(para: string): string[] {
  const words = para.split(/\s+/).filter(Boolean);
  const phrases: string[] = [];
  let cur: string[] = [];
  const flush = () => { if (cur.length) { phrases.push(cur.join(" ")); cur = []; } };
  for (const w of words) {
    // A standalone dash is a pause: attach it to the phrase before it, then break.
    if (/^-+$/.test(w)) {
      if (cur.length) { cur.push(w); flush(); }
      else if (phrases.length) { phrases[phrases.length - 1] += ` ${w}`; }
      else cur.push(w);
      continue;
    }
    cur.push(w);
    if (/[,;:.!?]$/.test(w)) flush();
  }
  flush();
  return phrases;
}

// Greedily word-wrap a single phrase that is itself wider than one line.
function wordWrap(measure: MeasureFn, phrase: string, maxWidth: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of phrase.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (measure(test) > maxWidth && line) { out.push(line); line = word; }
    else line = test;
  }
  if (line) out.push(line);
  return out;
}

// Wrap text to lines that fit within maxWidth, preferring phrase boundaries.
export function wrapText(measure: MeasureFn, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of plainDashes(text || "").split("\n")) {
    if (!para.trim()) { lines.push(""); continue; }
    let line = "";
    for (const phrase of splitIntoPhrases(para)) {
      const test = line ? `${line} ${phrase}` : phrase;
      if (measure(test) > maxWidth && line) {
        // Won't fit on the current line - end the line at this phrase boundary.
        lines.push(line);
        line = phrase;
      } else {
        line = test;
      }
      // A single phrase longer than the line must fall back to word wrapping.
      if (line === phrase && measure(line) > maxWidth) {
        const wrapped = wordWrap(measure, phrase, maxWidth);
        for (let i = 0; i < wrapped.length - 1; i++) lines.push(wrapped[i]);
        line = wrapped[wrapped.length - 1] || "";
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}
