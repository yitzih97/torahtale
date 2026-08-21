-- An employee login for the book queue: review, edit, regenerate, approve and
-- send to print - and nothing else. No billing, no customers, no deleting.
--
-- Postgres will not let a new enum value be USED in the same transaction that
-- adds it, and every migration file here runs in its own transaction. So the
-- value lands alone in this file and everything that references it lands in
-- 20260821120100_staff_role_permissions.sql.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
