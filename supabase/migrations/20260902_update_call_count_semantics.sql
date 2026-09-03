-- Migration: 20260902_update_call_count_semantics.sql
-- Description: Updates get_my_today_call_count to count ALL call_attempt rows to match the daily summary definition.

CREATE OR REPLACE FUNCTION public.get_my_today_call_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid uuid;
    v_count integer;
    v_today date;
    v_day_start timestamptz;
    v_day_end timestamptz;
BEGIN
    v_uid := auth.uid();

    IF v_uid IS NULL OR NOT public.is_active_agent() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Canonical Call Semantics: One persisted call_attempt row = One call
    -- This matches the AFTER INSERT trigger logic for expert_daily_stats.

    v_today := (now() AT TIME ZONE 'Asia/Tehran')::date;

    v_day_start :=
        v_today::timestamp AT TIME ZONE 'Asia/Tehran';

    v_day_end :=
        (v_today + 1)::timestamp AT TIME ZONE 'Asia/Tehran';

    SELECT count(*)::integer
    INTO v_count
    FROM public.call_attempts
    WHERE expert_id = v_uid
      AND created_at >= v_day_start
      AND created_at < v_day_end;

    RETURN COALESCE(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_today_call_count() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_today_call_count() TO authenticated;
COMMENT ON FUNCTION public.get_my_today_call_count() IS 'Returns the total number of call attempts made by the current expert today based on Tehran timezone, aligning with canonical ONE attempt = ONE call semantics.';
