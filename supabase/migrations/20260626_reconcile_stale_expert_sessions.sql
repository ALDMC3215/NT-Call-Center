-- Migration: 20260626_reconcile_stale_expert_sessions.sql

-- 1. Preconditions: Verify pg_cron exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        RAISE EXCEPTION 'pg_cron extension must be enabled before running this migration. / افزونه pg_cron باید قبل از اجرای این میگریشن فعال شود.';
    END IF;
END $$;

-- 2. Timeout reconciliation function
CREATE OR REPLACE FUNCTION public.reconcile_stale_expert_sessions() 
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_closed_count integer := 0;
BEGIN
    -- 3. Race-condition safety using CTE with FOR UPDATE SKIP LOCKED
    WITH stale_sessions AS (
        SELECT id
        FROM public.expert_sessions
        WHERE logout_time IS NULL
          AND last_seen_time < now() - interval '3 minutes'
        FOR UPDATE SKIP LOCKED
    ),
    closed_sessions AS (
        UPDATE public.expert_sessions
        SET 
            logout_time = now(),
            end_reason = 'timeout'
        WHERE id IN (SELECT id FROM stale_sessions)
          AND logout_time IS NULL -- Re-check inside final UPDATE
          AND last_seen_time < now() - interval '3 minutes'
        RETURNING id
    ),
    -- 4. Idle alert cleanup for same sessions
    resolved_alerts AS (
        UPDATE public.manager_alerts
        SET resolved_at = now()
        WHERE session_id IN (SELECT id FROM closed_sessions)
          AND resolved_at IS NULL
        RETURNING id
    )
    SELECT count(*) INTO v_closed_count FROM closed_sessions;

    RETURN v_closed_count;
END;
$$;

-- 5. Browser/API security
REVOKE ALL ON FUNCTION public.reconcile_stale_expert_sessions() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reconcile_stale_expert_sessions() FROM anon;
REVOKE ALL ON FUNCTION public.reconcile_stale_expert_sessions() FROM authenticated;

-- 6. Cron job duplicate safety and creation
DO $$
BEGIN
    -- Remove if exists
    IF EXISTS (
        SELECT 1 FROM cron.job WHERE jobname = 'reconcile-stale-expert-sessions'
    ) THEN
        PERFORM cron.unschedule('reconcile-stale-expert-sessions');
    END IF;

    -- Create new cron job
    PERFORM cron.schedule(
        'reconcile-stale-expert-sessions',
        '* * * * *',
        'SELECT public.reconcile_stale_expert_sessions();'
    );
END $$;
