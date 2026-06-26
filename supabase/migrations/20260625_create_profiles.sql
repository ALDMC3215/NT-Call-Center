-- =============================================================================
-- Migration: public.profiles — v3 hardened
-- File: supabase/migrations/20260625_create_profiles.sql
-- Status: NOT YET EXECUTED — run in Supabase SQL Editor before using the app
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email          TEXT        NOT NULL,
  full_name      TEXT        NOT NULL,
  role           TEXT        NOT NULL DEFAULT 'agent'
                             CHECK (role IN ('agent', 'admin')),
  account_status TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (account_status IN ('pending', 'active', 'disabled')),
  duty_group     TEXT                 CHECK (duty_group IS NULL OR duty_group IN ('early_week', 'late_week')),
  approved_by    UUID                 REFERENCES public.profiles (id) ON DELETE SET NULL,
  approved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. set_updated_at — trigger helper
--    SECURITY DEFINER + empty search_path prevents search_path injection.
--    All objects are fully qualified.
--    NOT callable by any browser role — revoked below.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. handle_new_user — auto-create profile on auth.users INSERT
--    email is read from NEW.email (auth.users), never from client payload.
--    full_name from raw_user_meta_data (signUp options.data.full_name).
--    role is hard-coded 'agent'. account_status is hard-coded 'pending'.
--    NOT callable by any browser role — revoked below.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, account_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'agent',
    'pending'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. is_admin() — checks whether the current authenticated caller is an
--    active admin. Used by RLS policies and other RPCs.
--    SECURITY DEFINER with empty search_path prevents RLS recursion and
--    search_path injection. All references fully qualified.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id             = auth.uid()
      AND role           = 'admin'
      AND account_status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies (safe idempotent run)
DROP POLICY IF EXISTS "profiles_own_read"        ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_read"      ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_name_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_no_insert"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_no_delete"       ON public.profiles;

-- 5a. Authenticated user reads their own profile row
CREATE POLICY "profiles_own_read"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 5b. Active admin reads all profile rows
CREATE POLICY "profiles_admin_read"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());

-- NOTE: No INSERT policy  → client INSERT blocked; trigger handles it.
-- NOTE: No UPDATE policy  → direct client UPDATE blocked for all users.
--       Profile mutations go through narrow, audited RPCs only.
-- NOTE: No DELETE policy  → client DELETE blocked for all users.

-- ---------------------------------------------------------------------------
-- 6. update_own_full_name(new_name) — narrow RPC for profile name editing
--    Only updates full_name on the caller's own row.
--    Cannot touch role, account_status, duty_group, approved_by, approved_at.
--    Any attempt to change other columns is simply not exposed.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_own_full_name(new_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id UUID := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Forbidden: unauthenticated';
  END IF;

  IF length(trim(new_name)) = 0 THEN
    RAISE EXCEPTION 'Validation: full_name cannot be empty';
  END IF;

  UPDATE public.profiles
  SET full_name = trim(new_name)
  WHERE id = caller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. approve_agent(target_id) — admin-only RPC
--    Guards:
--      • caller must be an active admin (checked from DB, not from JWT)
--      • target must be a different user (no self-approval)
--      • target must have role = 'agent' AND account_status = 'pending'
--    Sets account_status → 'active', approved_by → caller, approved_at → NOW()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_agent(target_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: caller is not an active admin';
  END IF;

  IF caller_id = target_id THEN
    RAISE EXCEPTION 'Forbidden: cannot approve your own account';
  END IF;

  UPDATE public.profiles
  SET
    account_status = 'active',
    approved_by    = caller_id,
    approved_at    = NOW()
  WHERE id             = target_id
    AND role           = 'agent'    -- only agents can be approved this way
    AND account_status = 'pending'; -- only pending accounts

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target profile not found or not a pending agent';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. disable_agent(target_id) — admin-only RPC
--    Guards:
--      • caller must be an active admin
--      • target must be a different user (no self-disable)
--      • target must have role = 'agent' (cannot disable an admin via this RPC)
--    Sets account_status → 'disabled'
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.disable_agent(target_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: caller is not an active admin';
  END IF;

  IF caller_id = target_id THEN
    RAISE EXCEPTION 'Forbidden: cannot disable your own account';
  END IF;

  UPDATE public.profiles
  SET account_status = 'disabled'
  WHERE id   = target_id
    AND role = 'agent'; -- admins cannot be disabled via this RPC

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target agent profile not found or target is an admin';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 9. Privilege hardening
--    Step A: strip all PUBLIC default execute rights from every function.
--    Step B: grant minimum required rights.
--
--    set_updated_at  — trigger only, no browser role needs EXECUTE
--    handle_new_user — trigger only, no browser role needs EXECUTE
--    is_admin        — called by RLS and by admin RPCs; grant to authenticated
--    update_own_full_name — self-service; grant to authenticated
--    approve_agent   — admin action; grant to authenticated (RPC enforces admin check)
--    disable_agent   — admin action; grant to authenticated (RPC enforces admin check)
--
--    anon is never granted EXECUTE on any function.
-- ---------------------------------------------------------------------------

-- Step A — revoke from PUBLIC (which covers both anon and authenticated defaults)
REVOKE ALL ON FUNCTION public.set_updated_at()           FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user()          FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin()                 FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_own_full_name(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approve_agent(UUID)        FROM PUBLIC;
REVOKE ALL ON FUNCTION public.disable_agent(UUID)        FROM PUBLIC;

-- Step B — grant only what each role truly needs
GRANT EXECUTE ON FUNCTION public.is_admin()                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_own_full_name(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_agent(UUID)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_agent(UUID)        TO authenticated;

-- set_updated_at and handle_new_user are invoked only by trigger infrastructure
-- (postgres superuser context) — no browser role grant required.
