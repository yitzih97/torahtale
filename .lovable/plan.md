

## Plan: Redesign Creation Wizard — Sleek, Clean, Animated

### Design Direction

Inspired by modern onboarding flows (like Nookly): minimal chrome, generous whitespace, full-width steps with smooth spring-based transitions, floating glass-morphism elements, and micro-interactions on every selection.

### Key Design Changes

**1. Dialog Shell**
- Remove the grouped stepper bar at the top — replace with a thin, elegant progress line spanning the full width (no labels, no icons)
- Add a subtle step counter in the top-right corner: "2 of 8"
- Softer background: `bg-background/80 backdrop-blur-xl` on the dialog
- More padding, more breathing room

**2. Transition Animations**
- Replace current slide variants (60px x-translate) with smoother spring-based transitions:
  - Enter: `y: 30, opacity: 0, scale: 0.97` → `y: 0, opacity: 1, scale: 1`
  - Exit: `y: -20, opacity: 0, scale: 0.98`
  - Spring config: `type: "spring", stiffness: 300, damping: 30`
- Add `layout` prop to motion containers for smooth size changes between steps
- Stagger child elements within each step (title, then content cards with 50ms delay each)

**3. Step Headings**
- Center all headings
- Larger, bolder display font
- Icon above the heading in a soft gradient circle instead of inline
- Subtle fade-up entrance animation per step

**4. Selection Cards (Gender, Art Style, Language, Torah)**
- Glassmorphism style: `bg-white/60 backdrop-blur-sm border-white/20`
- On hover: lift with `translateY(-4px)` and soft shadow bloom
- On select: accent ring glow animation + scale pulse (1.0 → 1.03 → 1.0)
- Checkmark appears with a spring pop animation

**5. Input Fields (Name, Age)**
- Larger, centered input with bottom-border-only style for a minimal look
- Soft focus glow ring animation
- Age input: large centered number with subtle bounce on value change

**6. Character Preview (Steps 2-5)**
- Float it as an overlay badge in the top-right corner instead of side-by-side layout
- Rounded with a subtle glow border
- Smooth morph when the image changes

**7. Navigation Buttons**
- Back button: text-only with arrow, no background
- Continue button: pill-shaped with gradient background and subtle shimmer animation
- Both fade in from below on step load

**8. Multi-child Selector**
- Horizontal scrollable pills with avatar — more compact, pill-shaped chips

**9. Generation Animation (Step 9)**
- Pulsing concentric rings behind the icon
- Smoother phase transitions with crossfade

**10. Mobile Polish**
- Full-screen dialog on mobile (no rounded corners, `h-[100dvh]`)
- Touch-friendly tap targets (min 48px)
- Bottom-anchored nav buttons

### Files Changed

| File | Change |
|------|--------|
| `src/components/CreationWizard.tsx` | Full UI redesign: new transitions, glassmorphism cards, centered layout, floating character preview, staggered animations, minimal progress bar, pill navigation |

### Technical Notes
- All changes are CSS/layout/animation only — no logic or data flow changes
- Uses existing framer-motion, just different variant configs
- No new dependencies needed

