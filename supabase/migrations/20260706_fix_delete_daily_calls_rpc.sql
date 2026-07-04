-- Migration: 20260706_fix_delete_daily_calls_rpc.sql
-- Fixes the returning error in delete_daily_calls RPC.

CREATE OR REPLACE FUNCTION public.delete_daily_calls(
    p_expert_id UUID,
    p_jalali_date TEXT
)
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

    -- Delete call attempts where jalali_date_time starts with p_jalali_date (e.g. "1405/04/13")
    DELETE FROM public.call_attempts
    WHERE expert_id = p_expert_id
      AND jalali_date_time LIKE p_jalali_date || '%';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;
