#!/usr/bin/env node
/**
 * Refreshes the real screenshots used by the blog's step-by-step guide
 * (/blog/how-to-create-a-personalized-torah-storybook).
 *
 * The wizard changes often, and a how-to illustrated with last quarter's UI is
 * worse than no screenshots at all — so this drives the actual wizard in a real
 * browser and writes what it sees to public/blog/wizard/. Run it after any
 * change to the creation flow:
 *
 *   npm run dev                                  # in one terminal
 *   node scripts/capture-wizard-shots.mjs        # English
 *   node scripts/capture-wizard-shots.mjs --lang he
 *
 * It relies on the dev-only `?shots` gate in src/pages/Create.tsx to walk the
 * wizard without signing in; nothing here works against production.
 */

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "blog", "wizard");
const PHOTO = join(__dirname, "..", "src", "assets", "gallery", "kid-rivka.jpg");

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const LANG = arg("lang", "en");
const BASE = arg("base", "http://localhost:8080");
const SUFFIX = LANG === "en" ? "" : `-${LANG}`;
const isHe = LANG !== "en";

const T = {
  en: {
    girl: "Girl",
    continue: "Continue",
    usePhoto: "Use Photo",
    language: "English",
    softcover: "Softcover Photo Book",
    upcomingParsha: "Next Week's Parsha",
    differentStory: "Choose a different story",
    back: "Back",
  },
  he: {
    girl: "בת",
    continue: "המשך",
    usePhoto: "שימוש בתמונה",
    language: "עברית",
    softcover: "ספר בכריכה רכה",
    upcomingParsha: "פרשת השבוע הבא",
    differentStory: "בחרו סיפור אחר",
    back: "חזרה",
  },
}[isHe ? "he" : "en"];

mkdirSync(OUT, { recursive: true });

const run = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 820, height: 700 },
    deviceScaleFactor: 2, // retina-crisp, matching the existing 1600px-wide shots
    locale: isHe ? "he-IL" : "en-US",
  });
  const page = await context.newPage();
  await page.addInitScript(
    ([lang]) => localStorage.setItem("torahtale_lang", lang),
    [LANG]
  );

  const settle = async (ms = 1100) => page.waitForTimeout(ms);
  const shot = async (name) => {
    await settle();
    const file = join(OUT, `${name}${SUFFIX}.jpg`);
    await page.screenshot({ path: file, type: "jpeg", quality: 88 });
    console.log(`captured ${file.replace(process.cwd() + "/", "")}`);
  };
  // Exact, or "Is Adina a boy or girl?" matches before the Girl tile does.
  const clickText = async (text) => {
    await page.getByText(text, { exact: true }).first().click();
    await settle(700);
  };
  const clickContinue = async () => {
    await page.getByRole("button", { name: T.continue }).first().click();
    await settle(700);
  };

  await page.goto(`${BASE}/create?shots`, { waitUntil: "networkidle" });
  await page.waitForSelector("input");

  // 1 — the child's name
  await page.locator("input").first().fill("Adina");
  await shot("step-1-name");
  await clickContinue();

  // 2 — boy or girl
  await shot("step-2-gender");
  await clickText(T.girl);

  // 3 — age (the stepper starts empty; tap up to a realistic age first)
  const older = page.getByRole("button", { name: "Increase age" });
  for (let i = 0; i < 5; i++) {
    await older.click();
    await page.waitForTimeout(120);
  }
  await shot("step-3-age");
  await clickContinue();

  // 4 — the photo, empty (the guidance panel is the point of this one)
  await shot("step-4-photo");
  // Uploading opens the built-in crop tool — worth a shot of its own.
  const input = page.locator('input[type="file"]').first();
  await input.setInputFiles(PHOTO);
  await settle(1800);
  await shot("step-4-crop");
  await page.getByRole("button", { name: T.usePhoto }).first().click();
  await settle(1400);
  await clickContinue();

  // 5 — add another child?
  await shot("step-7-add-child");
  await clickContinue();

  // 6 — the story: the suggested parsha, then the full browse view behind it
  await shot("step-5-story");
  await clickText(T.differentStory);
  await shot("step-5-browse");
  await page.getByRole("button", { name: T.back }).first().click();
  await settle(900);
  await page.getByText(T.upcomingParsha, { exact: true }).first().click();
  await settle(900);

  // 7 — the language (the site's current language comes pre-selected)
  await shot("step-6-language");
  await clickContinue();

  // 8 — choosing the printed format (this now comes before generating)
  await shot("step-9-format");

  // Everything past this point (sign-in, shipping, payment) needs a real
  // account, so the guide picks the story up from the public pricing page.
  await page.goto(`${BASE}/pricing`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 620));
  await shot("pricing-plans");

  await browser.close();
};

run().catch((err) => {
  console.error(`capture-wizard-shots: ${err.message}`);
  process.exit(1);
});
