-- Migration: 20260902_sync_expert_daily_stats_from_call_attempts.sql
-- Purpose: Create a database-level trigger to automatically sync call_attempts into expert_daily_stats.

-- call_attempts is the source event
-- expert_daily_stats is the manager reporting summary

CREATE OR REPLACE FUNCTION public.sync_expert_daily_stat_on_call_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_jalali_date text;
BEGIN
    -- null expert_id safety
    IF NEW.expert_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Extract date part from jalali_date_time (e.g. "1405/05/31 14:25" -> "1405/05/31")
    IF NEW.jalali_date_time IS NOT NULL THEN
        v_jalali_date := split_part(NEW.jalali_date_time, ' ', 1);
    ELSE
        RETURN NEW;
    END IF;

    -- invalid legacy jalali_date_time rows are ignored
    IF v_jalali_date !~ '^[0-9]{4}/[0-9]{2}/[0-9]{2}$' THEN
        RETURN NEW;
    END IF;

    -- atomic expert_daily_stats UPSERT
    -- existing summary values are incremented rather than recalculated
    INSERT INTO public.expert_daily_stats (expert_id, jalali_date, call_count, created_at, updated_at)
    VALUES (NEW.expert_id, v_jalali_date, 1, now(), now())
    ON CONFLICT (expert_id, jalali_date)
    DO UPDATE SET 
        call_count = public.expert_daily_stats.call_count + 1,
        updated_at = now();

    RETURN NEW;
END;
$$;

-- Secure Permissions for Function
REVOKE ALL ON FUNCTION public.sync_expert_daily_stat_on_call_attempt FROM PUBLIC, anon, authenticated;

-- Ensure idempotency for trigger
DROP TRIGGER IF EXISTS trg_sync_expert_daily_stat_after_attempt ON public.call_attempts;

CREATE TRIGGER trg_sync_expert_daily_stat_after_attempt
AFTER INSERT ON public.call_attempts
FOR EACH ROW
EXECUTE FUNCTION public.sync_expert_daily_stat_on_call_attempt();
