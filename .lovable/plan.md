# Dashboard refresh + wizard admin editor

Four coordinated changes. All visuals match the new `.wizard-glass` Apple liquid-glass look (graphite ink accents, frosted surfaces, no gold).

## 1. Dashboard kid card

Remove the "Create new book" button and the duplicate avatar/icon row. Replace with a clean liquid-glass card showing:

- Child photo + name + age (header)
- Countdown chip "Next book in 4 days" (uses existing `CountdownTimer`)
- Four equal quick-action tiles in a 2x2 grid:
  - **View books** — opens that child's library
  - **Edit child** — opens settings popup
  - **Manage subscription** — opens subscription dialog
  - **Pause / Resume** — quick toggle without opening dialog

Status pill in the corner (Active / Paused / No subscription).

## 2. Child settings popup (edit-child dialog)

Restyle to match wizard:
- `wizard-glass` scope wrapper, frosted background, ambient orbs
- Photo upload becomes a large rounded liquid-glass tile with hover lift
- Field rows on individual translucent cards
- Section headers in Playfair Display
- Primary action: dark ink pill button (no gold)
- Section icons swapped from gold to graphite

## 3. Regenerate wizard + edit-child icons

Replace the colored Lucide icons currently shown in both flows with a unified set of monochrome graphite line icons rendered inside small frosted-glass tiles. Approach:

- Keep the existing Lucide icon imports (Users, BookOpen, Palette, Package, etc.)
- Wrap them in a shared `<GlassIconTile />` component: 48px rounded square, white/8 background, `backdrop-blur`, 1px inner highlight, ink-colored icon
- Apply to: wizard top-bar step icon, each wizard step's hero icon, dashboard quick-action tiles, child settings section headers
- No new image generation needed — the unified tile + ink color is what makes them feel consistent

## 4. Admin editor for wizard steps

New "Wizard Steps" panel in `AdminCMS`. Persists to existing `site_settings` table under category `wizard` so no migration needed.

Per step (8 steps): title, subtitle, helper text, icon image override, visible toggle, order index.

Storage keys:
- `wizard.step.{N}.title`, `.subtitle`, `.helper`, `.icon_url`, `.visible`, `.order`

Wizard reads these via `useSiteSettings("wizard")` with fallbacks to the current hard-coded English/Hebrew copy.

Reorder + show/hide handled via simple up/down arrows and a switch in the admin list (drag-and-drop deferred).

## Technical details

- New file `src/components/dashboard/KidCard.tsx` extracted from Dashboard.tsx for the redesigned card
- New file `src/components/ui/glass-icon-tile.tsx` for the shared icon tile
- `DashboardSettings.tsx` restructured into glass sections
- `AdminCMS.tsx` gets a new `WizardStepsEditor` section component
- `CreationWizard.tsx` step copy/icon reads layered on top of existing `t.wizard.*` strings using `getSetting("wizard", ...)`; English fallbacks preserved
- Icon image override: when admin uploads an image, the wizard renders `<img>` instead of the Lucide icon
- No DB schema changes; uses existing `site_settings` + `site-images` bucket
- Bilingual: admin can save EN and HE separately via `wizard.step.{N}.title.en` / `.he` key suffixes

## Out of scope (call out)

- AI regeneration of wizard imagery — answered question said icons, not photos. If you want new AI-generated photo illustrations as well, say the word and I'll add that pass after.
- Drag-and-drop reordering — arrows for now; can upgrade later.

Approve and I'll build all four in one pass.
