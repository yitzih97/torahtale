

## Hero Section Updates

### 1. Button Text Change
Change "Create Your Sefer" to **"Begin the Journey"** (line ~164).

### 2. Replace "Your Child" with Random Kid Names
Update `HERO_SLIDES` (lines 14-25) to use actual children's names instead of "Your Child":

| Story | New Name |
|-------|----------|
| Bereishis | "Rivka" |
| Noach | "Ari" |
| Tower | "Yehuda" |
| Avraham | "Shira" |
| Yosef | "Moshe" |
| Nile | "Devorah" |
| Yam | "Eli" |
| Sinai | "Chana" |
| Dovid | "Shmuel" |
| Yonah | "Leah" |

Also update corresponding descriptions to use the same names.

### 3. Dark Mode Gradient Fix
Update the overlay divs (~lines 99-100) to use dark-mode-aware classes:
- Right 50% of screen: nearly fully transparent (show background image clearly)
- Left ~30%: gradient for text readability
- Replace the current gradient with something like:
  ```
  from-background/95 via-background/60 to-transparent
  ```
  ...but in dark mode override to:
  ```
  dark:from-background/85 dark:via-background/30 dark:to-transparent
  ```
  And the vertical gradient in dark mode should be much lighter too.

### File
`src/components/HeroSection.tsx` — all changes in this single file.

