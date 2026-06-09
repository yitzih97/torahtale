
-- Tighten child-photos storage policies: path-scoped ownership
DROP POLICY IF EXISTS "Public read child photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload child photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own child photos" ON storage.objects;

CREATE POLICY "Users read own child photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'child-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins read all child photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'child-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Users upload own child photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'child-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users update own child photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'child-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'child-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users delete own child photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'child-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Restrict has_role execution: anon never needs it; authenticated needs it for RLS policy evaluation
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
