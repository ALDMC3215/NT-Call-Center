-- Migration: 20260626_add_telephony_tables.sql
-- Phase 1A: Minimal, secure presence-and-idle migration only.

-- ---------------------------------------------------------------------------
-- 1. Table: expert_sessions
-- ---------------------------------------------------------------------------
CREATE TABLE public.expert_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expert_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    login_time TIMESTAMPTZ DEFAULT NOW(),
    last_seen_time TIMESTAMPTZ DEFAULT NOW(),
    last_activity_time TIMESTAMPTZ DEFAULT NOW(),
    idle_start_time TIMESTAMPTZ,
    logout_time TIMESTAMPTZ,
    end_reason VARCHAR(50) -- 'explicit_logout', 'timeout', 'replaced', 'disabled'
);

CREATE INDEX idx_sessions_expert_id ON public.expert_sessions(expert_id);

-- Enforce exactly one active session per expert
CREATE UNIQUE INDEX idx_sessions_active_unique 
    ON public.expert_sessions(expert_id) 
    WHERE logout_time IS NULL;

CREATE INDEX idx_sessions_last_seen ON public.expert_sessions(last_seen_time);
CREATE INDEX idx_sessions_last_activity ON public.expert_sessions(last_activity_time);

ALTER TABLE public.expert_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_expert_select" ON public.expert_sessions
    FOR SELECT USING (auth.uid() = expert_id);

CREATE POLICY "sessions_admin_select" ON public.expert_sessions
    FOR SELECT USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Table: manager_alerts
-- ---------------------------------------------------------------------------
CREATE TABLE public.manager_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expert_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.expert_sessions(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- e.g. 'idle_10m'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_alerts_expert_id ON public.manager_alerts(expert_id);
CREATE INDEX idx_alerts_session_id ON public.manager_alerts(session_id);

-- Enforce exactly one open alert per type per session
CREATE UNIQUE INDEX idx_alerts_session_unique_unresolved
    ON public.manager_alerts(session_id, alert_type)
    WHERE resolved_at IS NULL;

ALTER TABLE public.manager_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_admin_select" ON public.manager_alerts
    FOR SELECT USING (public.is_admin());

-- No direct client inserts/updates for sessions and alerts.

-- ---------------------------------------------------------------------------
-- 3. Utility Function: is_active_agent
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_active_agent()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    is_active BOOLEAN;
BEGIN
    SELECT (role = 'agent' AND account_status = 'active') INTO is_active
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(is_active, false);
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. RPC: start_session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_session()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    caller_id UUID := auth.uid();
    new_session_id UUID;
    locked_profile_id UUID;
    old_session_id UUID;
BEGIN
    IF caller_id IS NULL OR NOT public.is_active_agent() THEN
        RAISE EXCEPTION 'Forbidden: not an active agent';
    END IF;

    -- Lock the profile row to prevent concurrent session starts
    SELECT id INTO locked_profile_id 
    FROM public.profiles 
    WHERE id = caller_id 
    FOR UPDATE;

    -- Close existing open session for this expert
    UPDATE public.expert_sessions
    SET logout_time = NOW(),
        end_reason = 'replaced'
    WHERE expert_id = caller_id AND logout_time IS NULL
    RETURNING id INTO old_session_id;

    -- Resolve any open alerts bound to the replaced session
    IF old_session_id IS NOT NULL THEN
        UPDATE public.manager_alerts
        SET resolved_at = NOW()
        WHERE session_id = old_session_id AND resolved_at IS NULL;
    END IF;

    -- Create new session
    INSERT INTO public.expert_sessions (expert_id, login_time, last_seen_time, last_activity_time)
    VALUES (caller_id, NOW(), NOW(), NOW())
    RETURNING id INTO new_session_id;

    RETURN new_session_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. RPC: heartbeat_session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.heartbeat_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    caller_id UUID := auth.uid();
    current_activity_time TIMESTAMPTZ;
BEGIN
    IF caller_id IS NULL OR NOT public.is_active_agent() THEN
        RAISE EXCEPTION 'Forbidden: not an active agent';
    END IF;

    -- Update last_seen_time only if the exact session belongs to caller and is open
    UPDATE public.expert_sessions
    SET last_seen_time = NOW()
    WHERE id = p_session_id AND expert_id = caller_id AND logout_time IS NULL
    RETURNING last_activity_time INTO current_activity_time;

    -- If no row was updated, it's invalid, belongs to someone else, or already closed.
    IF current_activity_time IS NULL THEN
        RAISE EXCEPTION 'Invalid session: session % does not exist, is not yours, or is already closed', p_session_id;
    END IF;

    -- Check if idle for more than 10 minutes
    IF NOW() - current_activity_time > INTERVAL '10 minutes' THEN
        -- Mark session as idle
        UPDATE public.expert_sessions
        SET idle_start_time = COALESCE(idle_start_time, NOW())
        WHERE id = p_session_id;

        -- Create idle alert if one doesn't exist for THIS session
        INSERT INTO public.manager_alerts (expert_id, session_id, alert_type, created_at)
        VALUES (caller_id, p_session_id, 'idle_10m', NOW())
        ON CONFLICT (session_id, alert_type) WHERE resolved_at IS NULL DO NOTHING;
    END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. RPC: record_activity
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_activity(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    caller_id UUID := auth.uid();
    updated_id UUID;
BEGIN
    IF caller_id IS NULL OR NOT public.is_active_agent() THEN
        RAISE EXCEPTION 'Forbidden: not an active agent';
    END IF;

    -- Update session activity and clear idle state
    UPDATE public.expert_sessions
    SET last_activity_time = NOW(),
        idle_start_time = NULL,
        last_seen_time = NOW()
    WHERE id = p_session_id AND expert_id = caller_id AND logout_time IS NULL
    RETURNING id INTO updated_id;

    IF updated_id IS NULL THEN
        RAISE EXCEPTION 'Invalid session: session % does not exist, is not yours, or is already closed', p_session_id;
    END IF;

    -- Resolve any open idle alerts for THIS exact session
    UPDATE public.manager_alerts
    SET resolved_at = NOW()
    WHERE session_id = p_session_id AND resolved_at IS NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. RPC: end_session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.end_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    caller_id UUID := auth.uid();
    updated_id UUID;
BEGIN
    IF caller_id IS NULL OR NOT public.is_active_agent() THEN
        RAISE EXCEPTION 'Forbidden: not an active agent';
    END IF;

    -- Update session
    UPDATE public.expert_sessions
    SET logout_time = NOW(),
        end_reason = 'explicit_logout'
    WHERE id = p_session_id AND expert_id = caller_id AND logout_time IS NULL
    RETURNING id INTO updated_id;

    IF updated_id IS NULL THEN
        RAISE EXCEPTION 'Invalid session: session % does not exist, is not yours, or is already closed', p_session_id;
    END IF;

    -- Resolve any open idle alerts for THIS session
    UPDATE public.manager_alerts
    SET resolved_at = NOW()
    WHERE session_id = p_session_id AND resolved_at IS NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. RPC: get_presence_summary
-- ---------------------------------------------------------------------------
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
        p.full_name,
        p.role,
        CASE
            WHEN s.login_time IS NULL THEN 'offline'::VARCHAR
            WHEN s.logout_time IS NOT NULL THEN 'offline'::VARCHAR
            WHEN s.last_seen_time < NOW() - INTERVAL '2 minutes' THEN 'offline'::VARCHAR
            WHEN s.last_activity_time < NOW() - INTERVAL '10 minutes' THEN 'idle'::VARCHAR
            ELSE 'online'::VARCHAR
        END AS status,
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

-- ---------------------------------------------------------------------------
-- 9. Privilege Hardening
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.is_active_agent() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.start_session() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.heartbeat_session(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_activity(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.end_session(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_presence_summary() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_active_agent() TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.heartbeat_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_activity(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_presence_summary() TO authenticated;
