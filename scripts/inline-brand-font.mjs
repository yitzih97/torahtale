// Regenerates src/styles/brand-font.css from public/fonts/TorahTale-Regular.woff2.
// Run after replacing the font file:  node scripts/inline-brand-font.mjs
import { readFileSync, writeFileSync } from "node:fs";

const b64 = readFileSync("public/fonts/TorahTale-Regular.woff2").toString("base64");
const src = readFileSync("src/styles/brand-font.css", "utf8");
const header = src.slice(0, src.indexOf("@font-face {"));
const rule = (weight) =>
  `@font-face {\n  font-family: "TorahTaleTitle";\n  src: url("data:font/woff2;base64,${b64}") format("woff2");\n  font-weight: ${weight};\n  font-style: normal;\n  font-display: block;\n}\n`;
writeFileSync("src/styles/brand-font.css", header + rule(400) + rule(700));
console.log("brand-font.css regenerated");
