-- Migration: 20260626_fix_presence_summary_return_types.sql
-- Fixes type mismatch by explicitly casting TEXT to VARCHAR in get_presence_summary

CREATE OR REPLACE FUNCTION public.get_presence_summary()
RETURNS TABLE (
    expert_id UUID,
    full_name VARCHAR,
    role VARCHAR,
    status VARCHAR,
    login_time TIMESTAMPTZ,
    last_seen_time TIMESTAMPTZ,
    last_activity_time TIMESTAMPTZ,
    has_active_alert BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Only allow active admins
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: not an active admin';
    END IF;

    RETURN QUERY
    SELECT 
        p.id AS expert_id,
        p.full_name::VARCHAR,
        p.role::VARCHAR,
        (CASE
            WHEN s.login_time IS NULL THEN 'offline'
            WHEN s.logout_time IS NOT NULL THEN 'offline'
            WHEN s.last_seen_time < NOW() - INTERVAL '2 minutes' THEN 'offline'
            WHEN s.last_activity_time < NOW() - INTERVAL '10 minutes' THEN 'idle'
            ELSE 'online'
        END)::VARCHAR AS status,
        s.login_time,
        s.last_seen_time,
        s.last_activity_time,
        COALESCE(a.id IS NOT NULL, false) AS has_active_alert
    FROM public.profiles p
    LEFT JOIN (
        -- Get the current open session
        SELECT 
            es.id AS session_id,
            es.expert_id, 
            es.login_time, 
            es.last_seen_time, 
            es.last_activity_time, 
            es.logout_time
        FROM public.expert_sessions es
        WHERE es.logout_time IS NULL
    ) s ON p.id = s.expert_id
    LEFT JOIN public.manager_alerts a 
        ON s.session_id = a.session_id AND a.resolved_at IS NULL AND a.alert_type = 'idle_10m'
    WHERE p.role = 'agent' AND p.account_status = 'active';
END;
$$;

REVOKE ALL ON FUNCTION public.get_presence_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_presence_summary() TO authenticated;
