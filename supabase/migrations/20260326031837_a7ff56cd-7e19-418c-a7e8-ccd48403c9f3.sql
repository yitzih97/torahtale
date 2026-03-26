
-- Add description column to children table
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS description text;

-- Create storage bucket for child photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('child-photos', 'child-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to child-photos bucket
CREATE POLICY "Users can upload child photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'child-photos');

-- Allow public read access
CREATE POLICY "Public read child photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'child-photos');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own child photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'child-photos');
