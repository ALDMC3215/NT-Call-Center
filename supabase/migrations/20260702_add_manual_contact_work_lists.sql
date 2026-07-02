-- Migration: Add manual work lists
-- Date: 2026-07-02

-- 1. Add fields to expert_contacts
ALTER TABLE public.expert_contacts
ADD COLUMN work_list text DEFAULT 'none' CHECK (work_list IN ('none', 'today', 'followup')),
ADD COLUMN work_list_date date,
ADD COLUMN work_list_updated_at timestamptz;

-- 2. Add indices for performance
CREATE INDEX IF NOT EXISTS idx_expert_contacts_work_list ON public.expert_contacts (work_list);
CREATE INDEX IF NOT EXISTS idx_expert_contacts_work_list_date ON public.expert_contacts (work_list_date);

-- 3. Create the secure RPC
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
  ELSE
    UPDATE public.expert_contacts
    SET work_list = 'none',
        work_list_date = NULL,
        work_list_updated_at = now()
    WHERE id = p_contact_id;
  END IF;
END;
$$;

-- 4. Revoke public execution, grant only to authenticated users
REVOKE EXECUTE ON FUNCTION set_contact_work_list(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_contact_work_list(UUID, TEXT) TO authenticated;
