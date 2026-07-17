-- Migration: 20260717_add_hard_delete_contact.sql
-- Description: RPC to hard delete a contact from the database permanently

CREATE OR REPLACE FUNCTION public.hard_delete_contact(p_id UUID)
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

    -- Delete from call_attempts
    DELETE FROM public.call_attempts
    WHERE contact_id = p_id;

    -- Delete from contact_tasks
    DELETE FROM public.contact_tasks
    WHERE contact_id = p_id;

    -- Hard delete the contact
    DELETE FROM public.expert_contacts
    WHERE id = p_id
      AND expert_id = v_uid;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contact not found or access denied';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hard_delete_contact(UUID) TO authenticated;
COMMENT ON FUNCTION public.hard_delete_contact(UUID) IS 'Hard deletes an expert contact permanently.';
