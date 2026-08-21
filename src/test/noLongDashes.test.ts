import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

/**
 * Torah Tale writes with a plain hyphen. No em dash, no en dash - not in the
 * site copy, not in the blog, not in an email template, and not in the prompts
 * that write the books. The generators normalize what a model hands back
 * (generate-story's flattenText, blog-agent's plainDashes, wrapText for text
 * already sitting in a saved book); this guards the source itself, which is the
 * one place a long dash can be typed back in by hand.
 *
 * The characters are written as escapes on purpose - the rule applies to this
 * file too.
 */
const LONG_DASH = /[\u2014\u2013]/;

const ROOTS = ["src", "supabase/functions", "supabase/templates", "scripts", "public"];
const SKIP_DIRS = new Set(["node_modules", "dist", ".git"]);
const TEXT_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".html", ".json", ".txt", ".md", ".sql", ".py",
]);

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (TEXT_EXT.has(extname(name))) out.push(p);
  }
  return out;
}

describe("no long dashes", () => {
  it("finds none in the site, the book pipeline, or the copy that feeds them", () => {
    const offenders: string[] = [];
    for (const root of ROOTS) {
      for (const file of walk(root)) {
        const lines = readFileSync(file, "utf8").split("\n");
        lines.forEach((line, i) => {
          if (LONG_DASH.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim().slice(0, 120)}`);
        });
      }
    }
    expect(offenders).toEqual([]);
  });
});
