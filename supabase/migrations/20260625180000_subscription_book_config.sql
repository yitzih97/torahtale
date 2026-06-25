-- Give subscriptions a child + book "recipe" so recurring books keep the child's
-- likeness/config, not just the name. The shopify-webhook copies child_id and
-- book_config onto every book it mints, so the admin generation flow can pull the
-- child's photo (via child_id) and run the character-sheet phase (via the stored
-- childDescriptions) exactly like the first, wizard-made book.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS book_config jsonb;

-- child_id already exists on the table (FK to public.children); nothing to add there.
