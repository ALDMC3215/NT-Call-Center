-- Migration: Add new work lists and stats
-- Date: 2026-07-25

-- 1. Modify constraint on work_list
ALTER TABLE public.expert_contacts DROP CONSTRAINT IF EXISTS expert_contacts_work_list_check;

ALTER TABLE public.expert_contacts 
ADD CONSTRAINT expert_contacts_work_list_check 
CHECK (work_list IN ('none', 'today', 'followup', 'call_again', 'registered'));

-- 2. Update the set_contact_work_list RPC
CREATE OR REPLACE FUNCTION set_contact_work_list(p_contact_id UUID, p_work_list TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_assigned_to UUID;
  v_account_status TEXT;
  v_role TEXT;
BEGIN
  -- Validate input
  IF p_work_list NOT IN ('none', 'today', 'followup', 'call_again', 'registered') THEN
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
  SELECT assigned_to INTO v_assigned_to
  FROM public.expert_contacts
  WHERE id = p_contact_id;

  IF v_assigned_to != auth.uid() THEN
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
  ELSIF p_work_list = 'call_again' THEN
    UPDATE public.expert_contacts
    SET work_list = 'call_again',
        work_list_date = NULL,
        work_list_updated_at = now()
    WHERE id = p_contact_id;
  ELSIF p_work_list = 'registered' THEN
    UPDATE public.expert_contacts
    SET work_list = 'registered',
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
