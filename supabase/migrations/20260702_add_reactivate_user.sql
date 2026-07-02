-- 1. Create secure RPC for reactivating disabled users
CREATE OR REPLACE FUNCTION public.reactivate_user(target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_target_status text;
BEGIN
  -- Check if caller is active admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not an active admin';
  END IF;

  -- Prevent self-reactivation
  IF auth.uid() = target_id THEN
    RAISE EXCEPTION 'cannot reactivate your own account';
  END IF;

  -- Lock and fetch target user's current status
  SELECT account_status
  INTO v_target_status
  FROM public.profiles
  WHERE id = target_id
  FOR UPDATE;

  -- Check if target exists and is disabled
  IF NOT FOUND OR v_target_status != 'disabled' THEN
    RAISE EXCEPTION 'not found or already active';
  END IF;

  -- Update target status to active, preserving all other fields
  UPDATE public.profiles
  SET
    account_status = 'active',
    approved_by = auth.uid(),
    approved_at = now()
  WHERE id = target_id;

END;
$$;

-- 2. Revoke from public, grant only to authenticated
REVOKE EXECUTE ON FUNCTION public.reactivate_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reactivate_user(uuid) TO authenticated;
