// Regenerates src/styles/brand-font.css from public/fonts/TorahTale-Regular.woff2.
// Run after replacing the font file:  node scripts/inline-brand-font.mjs
import { readFileSync, writeFileSync } from "node:fs";

const b64 = readFileSync("public/fonts/TorahTale-Regular.woff2").toString("base64");
const existing = readFileSync("src/styles/brand-font.css", "utf8");
const header = existing.split("@font-face")[0];
writeFileSync(
  "src/styles/brand-font.css",
  `${header}@font-face {
  font-family: "TorahTaleTitle";
  src: url("data:font/woff2;base64,${b64}") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: block;
  size-adjust: 108%;
}
`,
);
console.log("brand-font.css regenerated");
