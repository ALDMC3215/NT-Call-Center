-- Migration: 20260706_add_delete_by_ids_rpc.sql
-- Adds RPC to precisely delete call attempts by their IDs

CREATE OR REPLACE FUNCTION public.delete_call_attempts_by_ids(p_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID;
    v_deleted_count INTEGER;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    DELETE FROM public.call_attempts
    WHERE id = ANY(p_ids);
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;
