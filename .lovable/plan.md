

## Plan: Fix Children Visibility + Revamp Torah Story Selection

### 1. Fix Children Query — Filter by User ID

**File:** `src/hooks/useChildren.ts`

The query currently relies solely on RLS to filter children. Add an explicit `.eq("user_id", user.id)` filter to the query as a defense-in-depth measure, ensuring each user only sees their own children regardless of RLS behavior.

### 2. Expand Torah Portions to Full Library

**File:** `src/components/wizard/TorahPortions.ts`

Replace the current ~30 entries with a comprehensive library organized into 4 categories:

| Category | Content |
|----------|---------|
| **Torah** (Chumash) | All 54 weekly parshiot across Bereishit, Shemot, Vayikra, Bamidbar, Devarim |
| **Nevi'im** (Prophets) | Key stories: Joshua crossing the Jordan, Deborah, Samson, David & Goliath, Elijah on Mt. Carmel, Jonah, etc. |
| **Ketuvim** (Writings) | Key stories: Psalms of David, Job's Faith, Daniel in the Lion's Den, Ruth's Loyalty, etc. |
| **Megillot** (Scrolls) | Esther (Purim), Ruth, Lamentations, Ecclesiastes, Song of Songs |

Update the `TorahOption` category type from `"torah" | "holiday"` to `"torah" | "neviim" | "ketuvim" | "megillot" | "holiday"`.

### 3. Redesign Torah Selection UI — Engaging Visual Cards

**File:** `src/components/CreationWizard.tsx` (Step 6)

Replace the current plain list with an engaging, visual selection experience:

- **Category tabs** at top: Torah · Nevi'im · Ketuvim · Megillot · Holidays (styled as pill buttons with icons: 📜 ⚔️ ✍️ 📖 🕯️)
- **Visual story cards** in a grid (2-3 columns) instead of plain text rows:
  - Each card has an emoji/icon representing the story (e.g., 🌊 for Parting the Sea, 🦁 for Daniel)
  - Story title in bold, portion/source name underneath
  - Subtle colored left-border or background tint per category
  - Hover animation with slight scale
- **Search/filter input** at the top to quickly find a portion by name
- **Sub-grouping within Torah**: collapsible sections by Chumash book (Bereishit, Shemot, Vayikra, Bamidbar, Devarim)
- Selected card gets accent border + checkmark badge

### 4. Keep Holiday Section

Holidays remain as a separate tab with the existing entries (Pesach, Purim, Chanukah, etc.).

---

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useChildren.ts` | Add `.eq("user_id", user.id)` to query |
| `src/components/wizard/TorahPortions.ts` | Expand to all 54 parshiot + Nevi'im/Ketuvim/Megillot stories, update category type |
| `src/components/CreationWizard.tsx` | Redesign step 6 with visual cards, category tabs, search, book sub-groups |

