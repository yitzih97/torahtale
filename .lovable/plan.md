# Half-page illustrations + draggable text editor

## 1. Layout change — image on one half, text on the other

Each story/questions spread becomes a true two-page composition with no overlap by default:

- LEFT (or RIGHT, alternating) half: the 1:1 illustration rendered at full half-page size (`object-cover`, square, fills the half edge-to-edge).
- The opposite half: a clean cream "paper" background that holds the text block.
- Cover spread is unchanged.

Image generation stays at `1024x1024` in `supabase/functions/generate-image/index.ts` — no model/size change needed.

```text
┌──────────────┬──────────────┐
│              │   Once upon  │
│  [1:1 art]   │   a time…    │
│              │              │
└──────────────┴──────────────┘
   image half      text half
```

## 2. Draggable + editable text overlay (per page)

Replace the static text block with a Canva-style draggable text component on every story page (and the discussion-questions page):

- **Drag** anywhere within the spread (snaps to bounds, can sit fully on the text half OR cross over onto the illustration if the user prefers).
- **Resize** via a corner handle (changes the text box width; height grows with content).
- **Inline edit** by double-clicking — opens in-place editable text.
- **Floating toolbar** appears when the text box is selected:
  - Font family (Cormorant Garamond, Playfair Display, Inter, Frank Ruhl Libre for HE, plus 1–2 display fonts)
  - Font size (slider 12–48)
  - Color picker (preset swatches: ink, gold, white, cream + custom)
  - Text align (left / center / right)
  - **Background toggle** (on/off — removes the cream card)
  - **Border toggle** (on/off)
  - Bold / italic
- Position, size, and style are stored per page on `BookPage.textLayout` (x, y, width, font, size, color, align, bg on/off, border on/off, bold, italic) and persisted with the book through the existing `pages_data` JSON — no schema migration needed.
- A **"Reset to default"** button restores the shared default style + auto-side position.

Default layout: text box pre-positioned on the empty (non-image) half so users don't have to move it unless they want to.

## 3. PDF export bakes the exact on-screen layout

`src/lib/generateBookPdf.ts` is updated so every page renders the illustration on its half and composites each page's text overlay using that page's saved `textLayout` (position, size, font, color, background/border toggles). The output mirrors the viewer 1:1.

The same composite is used by `src/lib/generateBookZip.ts` (JPEG/PNG export).

## 4. Auto-save

The wizard already writes `pages_data` to the `books` row. The new `textLayout` field rides along automatically — no extra wiring beyond making sure `onPagesChange` is called whenever a text box is moved, resized, or restyled.

## Technical notes

- New file `src/components/wizard/EditableTextBox.tsx` — handles drag (pointer events), resize, inline edit, and renders the floating toolbar (shadcn `Popover` + `Slider` + color swatches).
- New shape on `BookPage`:
  ```ts
  textLayout?: {
    x: number; y: number;       // % of spread (0–100)
    width: number;              // % of spread width
    fontFamily?: string;
    fontSize?: number;          // px at 1024 reference
    color?: string;
    align?: "left" | "center" | "right";
    bold?: boolean; italic?: boolean;
    background?: boolean;       // default true
    border?: boolean;           // default false
  }
  ```
- `BookViewer.tsx` renders `EditableTextBox` instead of the current static div. Default `textLayout` computed from existing alternating-side logic so old books still look right.
- `generateBookPdf.ts` `drawTextPanel` is rewritten to accept a `textLayout` and draw at the saved x/y/width with the saved font/size/color and conditional background/border. Coordinates scale from % → canvas px.
- Fonts used in the toolbar are already loaded by `index.css`; add any new display fonts there.
- RTL: when book language is Hebrew/Yiddish, default `align` is `right` and default x flips to the opposite half.

## Files touched

- `src/components/wizard/BookViewer.tsx` — half/half layout, drop in `EditableTextBox`, default-layout helper.
- `src/components/wizard/EditableTextBox.tsx` — new component (drag/resize/edit/toolbar).
- `src/lib/generateBookPdf.ts` — new half-image layout + per-page text composite from `textLayout`.
- `src/lib/generateBookZip.ts` — same composite logic for JPEG/PNG export.
- `src/components/wizard/BookViewerModal.tsx` — minor sizing if needed.
- `src/index.css` — extra font imports if a new display font is added.

## Out of scope

- No change to image generation size (stays 1024×1024 as you confirmed).
- No change to cover spread layout.
- No DB schema migration (`textLayout` lives inside existing `pages_data` JSON).
