## Goal

Make the parsha-picking step in the creation wizard dramatically simpler and more intuitive, and standardize all names in proper frum English ("Sefer Bereishis", "Parshas Noach") and Hebrew ("ספר בראשית", "פרשת נח").

## 1. Naming convention update (`src/components/wizard/TorahPortions.ts`)

Rewrite every label in `TORAH_PORTIONS`:

- **English (`label`)**: change "Parshas X" → **"Parshas X"** for every Torah portion. Use the frum Ashkenazi spelling consistently (Bereishis, Shemos, Vayikra, Bamidbar, Devarim, Noach, Lech Lecha, Vayeira, Chayei Sarah, Toldos, Vayeitzei, Vayishlach, Vayeishev, Mikeitz, Vayigash, Vayechi, Va'eira, Beshalach, Yisro, Mishpatim, Terumah, Tetzaveh, Ki Sisa, Vayakhel, Pekudei, Tzav, Shemini, Tazria, Metzora, Acharei Mos, Kedoshim, Emor, Behar, Bechukosai, Naso, Beha'aloscha, Shelach, Korach, Chukas, Balak, Pinchas, Matos, Masei, Va'eschanan, Eikev, Re'eh, Shoftim, Ki Seitzei, Ki Savo, Nitzavim, Vayeilech, Ha'azinu, V'Zos Habracha).
- For Nevi'im/Ketuvim/Megillos use **"Sefer X"** form: "Sefer Yehoshua – Crossing the Yarden", "Sefer Shmuel – Dovid & Golias", "Megillas Esther", "Megillas Rus", etc.
- **Hebrew (`sub`)**: keep the `פרשת X` / `ספר X` / `מגילת X` form already used (already correct, just audit spellings).
- Add a new helper section: rename the `TORAH_BOOKS` display so the picker shows **"Sefer Bereishis / ספר בראשית"** (currently hard-codes English transliterations). Introduce `TORAH_BOOK_LABELS: Record<string,{en:string;he:string}>` mapping `Bereishit→{Sefer Bereishis, ספר בראשית}`, `Shemot→{Sefer Shemos, ספר שמות}`, `Vayikra→{Sefer Vayikra, ספר ויקרא}`, `Bamidbar→{Sefer Bamidbar, ספר במדבר}`, `Devarim→{Sefer Devarim, ספר דברים}`.
- Update `getPortionLabel` + `getPortionDisplay` to use the new strings unchanged.
- Update CheckoutStep / dashboard / admin consumers — they all call `getPortionLabel`, so no further edits needed.

## 2. Redesigned selection flow (`src/components/CreationWizard.tsx` step 6)

Replace the current step 6 UI with a single, calm, two-level browser. Remove the "Weekly Parsha / Parsha+Holidays / Choose Manually" mode-picker entirely — it duplicates intent and confuses users.

New layout (one screen, no mode toggling):

```text
            ┌────────────────────────────────────────────┐
            │  Choose your story                          │
            │  [ This week's Parsha → Parshas Noach ]  │  ← primary suggested card
            └────────────────────────────────────────────┘

   [ Torah ] [ Nevi'im ] [ Ketuvim ] [ Megillos ] [ Yamim Tovim ]   ← single pill row
   ┌──────────────────────────────────────────────────────────────┐
   │ 🔍 Search parsha or story…                                 │
   └──────────────────────────────────────────────────────────────┘

   Sefer Bereishis / ספר בראשית            ▾
     Parshas Bereishis   Parshas Noach   Parshas Lech Lecha …
   Sefer Shemos / ספר שמות                 ▸
   Sefer Vayikra / ספר ויקרא               ▸
```

Concrete changes:

- **Remove** `portionMode` state and all three mode cards (`weeklyParsha`, `parshaAndHolidays`, `chooseManually`).
- **Always show** the manual browser; planType no longer gates UI.
- **Top "This week's Parsha" hero card**: always rendered above the pills, showing the upcoming parshah from `getUpcomingParsha()` with its proper "Parshas X / פרשת X" label and a single tap selects it + auto-advances. Replaces the current weekly card duplication.
- **Category pills**: simplified to 5 (Torah, Nevi'im, Ketuvim, Megillos, Yamim Tovim) — drop the "All" pill (defaults to Torah which is what 95% pick).
- **Sefer accordion headers**: render each Torah book using the bilingual label (`Sefer Bereishis / ספר בראשית`). Only one sefer is open at a time; opening another collapses the previous. Default-open the sefer that contains `data.torahPortion` if set, otherwise Bereishis.
- **Parsha tiles**: keep the existing card style but show the new "Parshas X" label and the Hebrew sub. Selection still triggers `autoAdvance()`.
- **Search**: unchanged behavior, but searches both English and Hebrew (already does); when search is active hide the sefer accordions and show a flat list.
- **Nevi'im / Ketuvim / Megillos / Yamim Tovim**: when the corresponding pill is active, show a flat grid (no accordion) since there are fewer items.
- **RTL**: keep `text-start` / `ps-*` logical classes; pills wrap.

## 3. i18n (`src/i18n/en.ts`, `he.ts`, `yi.ts`)

- Add/update strings: `thisWeekParshah` ("This week's Parsha" / "פרשת השבוע" / "די וואכעדיגע פרשה"), `seferTorah` etc only as needed.
- Remove now-unused keys: `weeklyParsha`, `weeklyParshaDesc`, `parshaAndHolidays`, `parshaAndHolidaysDesc`, `chooseManually`, `chooseManuallyDesc`, `backToOptions`, `storyStartTitleSingle`, `storyStartTitleSubscription`, `all`, `sefer` (replaced by inline bilingual labels).
- Keep `chooseParsha` as the section heading for all plans.
- Rename `t.wizard.sefer` usages to the new `TORAH_BOOK_LABELS` map.

## 4. Persistence / wizard state

- Remove `portionMode` from the persisted `torahtale_wizard_state` object and from restore logic.
- The early-return in `next()` that branched on `step === 6 && portionMode === "manual"` is removed; step 6 → step 7 always.

## Out of scope

- No DB or edge-function changes. Stored `torah_portion` slugs stay identical — only display labels change, so existing books in `books.pages_data` keep rendering correctly via `getPortionLabel`.
- No changes to the generation prompt (it already uses the slug + label).
- No changes to subscription/single plan logic, checkout, or Printify.

## Files to edit

- `src/components/wizard/TorahPortions.ts` — rename labels, add `TORAH_BOOK_LABELS`.
- `src/components/CreationWizard.tsx` — rewrite step 6 JSX, remove `portionMode` state and persistence keys, update `next()`.
- `src/i18n/en.ts`, `src/i18n/he.ts`, `src/i18n/yi.ts` — add `thisWeekParshah`, prune unused keys.
- `.lovable/memory/features/creation-wizard.md` — note the new single-screen parsha picker.
