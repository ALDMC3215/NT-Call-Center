-- Migration: Fix set_contact_work_list RPC
-- Date: 2026-07-08
-- Description: Fixes typo in column name (assigned_to -> expert_id)

CREATE OR REPLACE FUNCTION set_contact_work_list(p_contact_id UUID, p_work_list TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_expert_id UUID;
  v_account_status TEXT;
  v_role TEXT;
BEGIN
  -- Validate input
  IF p_work_list NOT IN ('none', 'today', 'followup') THEN
    RAISE EXCEPTION 'Invalid work_list value';
  END IF;

  -- Ensure caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user profile to check if they are an active agent
  SELECT account_status, role INTO v_account_status, v_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_account_status != 'active' OR v_role != 'agent' THEN
    RAISE EXCEPTION 'Not an active agent';
  END IF;

  -- Verify the contact belongs to the agent
  SELECT expert_id INTO v_expert_id
  FROM public.expert_contacts
  WHERE id = p_contact_id;

  IF v_expert_id != auth.uid() THEN
    RAISE EXCEPTION 'Contact does not belong to the current agent';
  END IF;

  -- Update the contact
  IF p_work_list = 'today' THEN
    UPDATE public.expert_contacts
    SET work_list = 'today',
        work_list_date = (now() AT TIME ZONE 'Asia/Tehran')::date,
        work_list_updated_at = now()
    WHERE id = p_contact_id;
  ELSIF p_work_list = 'followup' THEN
    UPDATE public.expert_contacts
    SET work_list = 'followup',
        work_list_date = NULL,
        work_list_updated_at = now()
    WHERE id = p_contact_id;
  ELSE
    UPDATE public.expert_contacts
    SET work_list = 'none',
        work_list_date = NULL,
        work_list_updated_at = now()
    WHERE id = p_contact_id;
  END IF;
END;
$$;

-- Ensure permissions
REVOKE EXECUTE ON FUNCTION set_contact_work_list(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_contact_work_list(UUID, TEXT) TO authenticated;
