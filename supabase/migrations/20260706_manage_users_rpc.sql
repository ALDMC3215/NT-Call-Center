-- Migration: Add RPCs for Managers to Delete and Update Users

-- 1. update_user_by_admin
CREATE OR REPLACE FUNCTION public.update_user_by_admin(target_id uuid, new_full_name text, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_id uuid;
BEGIN
  caller_id := auth.uid();

  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: caller is not an active admin';
  END IF;

  IF length(trim(new_full_name)) = 0 THEN
    RAISE EXCEPTION 'Validation: full_name cannot be empty';
  END IF;

  UPDATE public.profiles
  SET
    full_name = trim(new_full_name),
    role = new_role,
    updated_at = NOW()
  WHERE id = target_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target profile not found';
  END IF;
END;
$$;


-- 2. delete_user_by_admin
-- Note: This deletes the row in auth.users, which will CASCADE to public.profiles
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_id uuid;
BEGIN
  caller_id := auth.uid();

  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: caller is not an active admin';
  END IF;

  IF caller_id = target_id THEN
    RAISE EXCEPTION 'Forbidden: cannot delete your own account';
  END IF;

  -- Delete the user from the auth system completely
  DELETE FROM auth.users WHERE id = target_id;
END;
$$;
