-- Migration: Update approve_agent RPC to allow reactivating disabled agents

CREATE OR REPLACE FUNCTION public.approve_agent(target_id uuid)
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
    RAISE EXCEPTION 'Forbidden: cannot approve your own account';
  END IF;

  UPDATE public.profiles
  SET
    account_status = 'active',
    approved_by    = caller_id,
    approved_at    = NOW()
  WHERE id             = target_id
    AND role           = 'agent'
    AND account_status IN ('pending', 'disabled');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target profile not found, not an agent, or not pending/disabled';
  END IF;
END;
$$;
