-- Fix: 20260618200221_security_hardening_2.sql revoked EXECUTE on has_role() from
-- anon/authenticated/public. But has_role() is invoked *inside* RLS policy
-- expressions (USING (public.has_role(auth.uid(), 'admin'))), which are evaluated
-- as the calling role. Without EXECUTE, every has_role-gated policy throws
-- "permission denied for function has_role" for logged-in users, which silently
-- breaks reads/writes (e.g. inserting children, whose RETURNING passes through an
-- admin SELECT policy). Re-grant EXECUTE so the policies work. The function is
-- SECURITY DEFINER, so granting EXECUTE does not widen what data it can read.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
