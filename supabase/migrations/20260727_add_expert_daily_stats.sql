-- Migration: 20260727_add_expert_daily_stats.sql
-- Description: Create a table to track daily call stats per expert and RPCs for easy upsert and read.

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.expert_daily_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expert_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    jalali_date TEXT NOT NULL,
    call_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(expert_id, jalali_date)
);

-- 2. Enable RLS
ALTER TABLE public.expert_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily stats"
    ON public.expert_daily_stats FOR SELECT
    USING (auth.uid() = expert_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Users can insert their own daily stats"
    ON public.expert_daily_stats FOR INSERT
    WITH CHECK (auth.uid() = expert_id);

CREATE POLICY "Users can update their own daily stats"
    ON public.expert_daily_stats FOR UPDATE
    USING (auth.uid() = expert_id);

CREATE POLICY "Users can delete their own daily stats"
    ON public.expert_daily_stats FOR DELETE
    USING (auth.uid() = expert_id);

-- 3. RPC to Upsert Daily Stat
CREATE OR REPLACE FUNCTION public.upsert_daily_call_stat(
    p_jalali_date TEXT,
    p_count INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID;
    v_stat public.expert_daily_stats;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Upsert the stat for the current user and date
    INSERT INTO public.expert_daily_stats (expert_id, jalali_date, call_count, updated_at)
    VALUES (v_uid, p_jalali_date, p_count, now())
    ON CONFLICT (expert_id, jalali_date)
    DO UPDATE SET
        call_count = EXCLUDED.call_count,
        updated_at = EXCLUDED.updated_at
    RETURNING * INTO v_stat;

    RETURN to_jsonb(v_stat);
END;
$$;

-- Secure Permissions for RPC
REVOKE ALL ON FUNCTION public.upsert_daily_call_stat FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_daily_call_stat TO authenticated;

-- 4. RPC to Get Daily Stats
CREATE OR REPLACE FUNCTION public.get_my_daily_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID;
    v_result JSONB;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_result
    FROM (
        SELECT jalali_date, call_count
        FROM public.expert_daily_stats
        WHERE expert_id = v_uid
        ORDER BY created_at ASC
    ) t;

    RETURN v_result;
END;
$$;

-- Secure Permissions for RPC
REVOKE ALL ON FUNCTION public.get_my_daily_stats FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_daily_stats TO authenticated;
