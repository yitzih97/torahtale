-- Per-language child names, so a child can be shown as "Ari" / "ארי" / a Yiddish
-- spelling depending on the reader's language. `name` stays the required base /
-- default; name_he and name_yi are optional overrides used when the UI (or a
-- book) is in Hebrew / Yiddish, falling back to `name` when blank.
alter table public.children
  add column if not exists name_he text,
  add column if not exists name_yi text;
