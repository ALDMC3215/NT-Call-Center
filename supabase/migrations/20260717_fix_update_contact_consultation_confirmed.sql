-- Migration: 20260717_fix_update_contact_consultation_confirmed.sql
-- Description: Update update_contact RPC to handle consultation_confirmed.

DROP FUNCTION IF EXISTS public.update_contact(uuid, text, text, text[], text, text, text, text, text, integer);
DROP FUNCTION IF EXISTS public.update_contact(uuid, text, text, text[], text, text, text, text, text, integer, boolean);

CREATE OR REPLACE FUNCTION public.update_contact(
    p_id UUID,
    p_full_name TEXT,
    p_call_status TEXT,
    p_courses TEXT[],
    p_advisory TEXT,
    p_advisory_date TEXT,
    p_advisory_time TEXT,
    p_registered TEXT,
    p_notes TEXT,
    p_queue_order INTEGER,
    p_consultation_confirmed BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL OR NOT public.is_active_agent() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    UPDATE public.expert_contacts
    SET
        full_name = p_full_name,
        call_status = p_call_status,
        courses = p_courses,
        advisory = p_advisory,
        advisory_date = p_advisory_date,
        advisory_time = p_advisory_time,
        registered = p_registered,
        notes = p_notes,
        queue_order = p_queue_order,
        consultation_confirmed = p_consultation_confirmed,
        updated_at = now()
    WHERE id = p_id
      AND expert_id = v_uid
      AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contact not found or access denied';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_contact(uuid, text, text, text[], text, text, text, text, text, integer, boolean) TO authenticated;
COMMENT ON FUNCTION public.update_contact(uuid, text, text, text[], text, text, text, text, text, integer, boolean) IS 'Updates an expert contact securely (including consultation_confirmed).';
