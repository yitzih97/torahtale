

## Plan: Lock to Light Mode + Dark Hero Overlay

### 1. Remove Theme Toggle from Navbar
**File:** `src/components/Navbar.tsx`
- Remove the `useTheme` import and the `theme`/`toggleTheme` usage
- Remove the Sun/Moon toggle button entirely
- Remove unused `Sun`, `Moon` icon imports

### 2. Force Light Mode on Load
**File:** `src/main.tsx`
- Remove the localStorage theme check
- Always ensure `document.documentElement` does NOT have the `dark` class

### 3. Keep Dark Overlay on Hero Section Only
**File:** `src/components/HeroSection.tsx`
- Replace the `dark:` prefixed gradient classes with hardcoded dark-style gradients (the more transparent ones that showcase the image)
- Use the dark variant values directly: `from-[hsl(220,30%,8%)]/85 via-[hsl(220,30%,8%)]/30 to-transparent` so the hero always has a dark cinematic overlay regardless of light mode
- Also force light text colors in the hero section (white/light text) so it remains readable against the dark overlay

### 4. Cleanup
**File:** `src/hooks/use-theme.tsx`
- Can be left in place (unused code) or removed. Will remove it to keep things clean.

---

### Files Changed

| File | Change |
|------|--------|
| `src/main.tsx` | Remove theme logic, force light mode |
| `src/components/Navbar.tsx` | Remove toggle button |
| `src/components/HeroSection.tsx` | Hardcode dark overlay + light text |
| `src/hooks/use-theme.tsx` | Remove (unused) |

