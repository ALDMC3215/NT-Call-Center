-- Migration: 20260706_add_daily_scores_and_delete_rpc.sql
-- Adds daily expert scores and RPC to delete daily call attempts.

CREATE TABLE public.expert_daily_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expert_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    jalali_date TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Unique index so an expert can only have one score per day
CREATE UNIQUE INDEX idx_expert_daily_scores_unique ON public.expert_daily_scores(expert_id, jalali_date);

ALTER TABLE public.expert_daily_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expert_daily_scores_select" ON public.expert_daily_scores
    FOR SELECT USING (
        (auth.uid() = expert_id) OR public.is_admin()
    );

CREATE POLICY "expert_daily_scores_all" ON public.expert_daily_scores
    FOR ALL USING (
        public.is_admin()
    );

-- RPC for inserting or updating a score
CREATE OR REPLACE FUNCTION public.set_expert_daily_score(
    p_expert_id UUID,
    p_jalali_date TEXT,
    p_score INTEGER,
    p_notes TEXT DEFAULT NULL
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
    IF v_uid IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    INSERT INTO public.expert_daily_scores (expert_id, manager_id, jalali_date, score, notes)
    VALUES (p_expert_id, v_uid, p_jalali_date, p_score, p_notes)
    ON CONFLICT (expert_id, jalali_date) DO UPDATE
    SET score = p_score, manager_id = v_uid, notes = p_notes, updated_at = now();
END;
$$;

-- RPC for fetching a score
CREATE OR REPLACE FUNCTION public.get_expert_daily_score(
    p_expert_id UUID,
    p_jalali_date TEXT
)
RETURNS TABLE (score INTEGER, notes TEXT, manager_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Both admins and the expert themselves can view
    IF NOT public.is_admin() AND auth.uid() != p_expert_id THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT s.score, s.notes, p.full_name
    FROM public.expert_daily_scores s
    JOIN public.profiles p ON p.id = s.manager_id
    WHERE s.expert_id = p_expert_id AND s.jalali_date = p_jalali_date;
END;
$$;

-- RPC for deleting daily call attempts
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
      AND jalali_date_time LIKE p_jalali_date || '%'
    RETURNING id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;

-- Expose to authenticated
GRANT SELECT ON TABLE public.expert_daily_scores TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_expert_daily_score TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expert_daily_score TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_daily_calls TO authenticated;
