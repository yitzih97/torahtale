-- Book images move OUT of the database and into object storage.
-- Page/cover/character-sheet images were stored as base64 data URLs inside
-- books.pages_data / story_data / cover_image_url (~15 MB per book), which bloated
-- Postgres and wedged the instance. Going forward the image generators upload to
-- this bucket and store only the public URL. Public read so the preview and the
-- Printify ZIP can load images directly; writes happen from edge functions using
-- the service-role key (which bypasses storage RLS).
insert into storage.buckets (id, name, public)
values ('book-images', 'book-images', true)
on conflict (id) do update set public = true;

-- Explicit public read policy for the bucket (public buckets serve objects, but
-- keep an explicit SELECT policy so behavior is deterministic across projects).
drop policy if exists "Public read book-images" on storage.objects;
create policy "Public read book-images"
  on storage.objects for select
  using (bucket_id = 'book-images');
