-- Migration: Create RPC for daily stats export
-- Date: 2026-07-25

CREATE OR REPLACE FUNCTION get_experts_daily_stats_export(target_date TEXT)
RETURNS TABLE (
    expert_id UUID,
    full_name TEXT,
    total_calls BIGINT,
    registered_count BIGINT,
    followup_count BIGINT,
    consultation_count BIGINT,
    activity_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Verify the caller is a manager
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'manager'
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    WITH DateFilter AS (
        SELECT target_date::DATE AS d
    ),
    AttemptStats AS (
        SELECT 
            ca.expert_id,
            COUNT(ca.id) as daily_calls
        FROM public.call_attempts ca
        CROSS JOIN DateFilter df
        WHERE (ca.created_at AT TIME ZONE 'Asia/Tehran')::DATE = df.d
        GROUP BY ca.expert_id
    ),
    ContactStats AS (
        SELECT 
            ec.assigned_to,
            COUNT(CASE WHEN ec.registered = 'ثبت نام کرد' THEN 1 END) as reg_count,
            COUNT(CASE WHEN ec.is_follow_up = true THEN 1 END) as fu_count,
            COUNT(CASE WHEN ec.advisory = 'حضوری' OR ec.advisory = 'تلفنی' THEN 1 END) as cons_count,
            COUNT(CASE WHEN ec.work_list = 'today' THEN 1 END) as act_count
        FROM public.expert_contacts ec
        GROUP BY ec.assigned_to
    )
    SELECT 
        p.id AS expert_id,
        p.full_name,
        COALESCE(ast.daily_calls, 0) AS total_calls,
        COALESCE(cs.reg_count, 0) AS registered_count,
        COALESCE(cs.fu_count, 0) AS followup_count,
        COALESCE(cs.cons_count, 0) AS consultation_count,
        COALESCE(cs.act_count, 0) AS activity_count
    FROM public.profiles p
    LEFT JOIN AttemptStats ast ON p.id = ast.expert_id
    LEFT JOIN ContactStats cs ON p.id = cs.assigned_to
    WHERE p.role = 'agent';
END;
$$;
