-- Migration: 20260703_add_contact_tasks.sql
-- Description: Foundation for scheduled date-based contact tasks.

-- 1. Create table
CREATE TABLE public.contact_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.expert_contacts(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE NO ACTION,
    source_attempt_id UUID REFERENCES public.call_attempts(id) ON DELETE SET NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('daily_activity', 'retry_call', 'consultation_reminder')),
    scheduled_date DATE NOT NULL,
    scheduled_time TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    CONSTRAINT check_completed_date CHECK ((status = 'completed') = (completed_at IS NOT NULL)),
    CONSTRAINT check_cancelled_date CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL))
);

-- 2. Indexes
CREATE INDEX idx_contact_tasks_expert_date_status ON public.contact_tasks(expert_id, scheduled_date, status);
CREATE INDEX idx_contact_tasks_contact_id ON public.contact_tasks(contact_id);

-- 3. RLS Policies
ALTER TABLE public.contact_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON public.contact_tasks
    FOR SELECT USING (
        (auth.uid() = expert_id)
        OR public.is_admin()
    );

-- 4. RPC Functions

-- 4.1. create_contact_task
CREATE OR REPLACE FUNCTION public.create_contact_task(
    p_contact_id UUID,
    p_task_type TEXT,
    p_scheduled_date DATE,
    p_scheduled_time TEXT DEFAULT NULL,
    p_source_attempt_id UUID DEFAULT NULL
) RETURNS public.contact_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_account_status TEXT;
    v_role TEXT;
    v_expert_id UUID;
    v_attempt_contact_id UUID;
    v_attempt_expert_id UUID;
    v_new_task public.contact_tasks;
    v_tehran_today DATE;
    v_deleted_at TIMESTAMPTZ;
BEGIN
    -- Auth check
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Agent check
    SELECT account_status, role INTO v_account_status, v_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_account_status != 'active' OR v_role != 'agent' THEN
        RAISE EXCEPTION 'Not an active agent';
    END IF;

    -- Contact ownership check
    SELECT expert_id, deleted_at INTO v_expert_id, v_deleted_at
    FROM public.expert_contacts
    WHERE id = p_contact_id;

    IF v_expert_id IS NULL THEN
        RAISE EXCEPTION 'Contact not found';
    END IF;

    IF v_deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Contact is deleted';
    END IF;

    IF v_expert_id != auth.uid() THEN
        RAISE EXCEPTION 'Contact does not belong to the current agent';
    END IF;

    -- Source attempt check if provided
    IF p_source_attempt_id IS NOT NULL THEN
        SELECT contact_id, expert_id INTO v_attempt_contact_id, v_attempt_expert_id
        FROM public.call_attempts
        WHERE id = p_source_attempt_id;

        IF v_attempt_contact_id IS NULL THEN
            RAISE EXCEPTION 'Source attempt not found';
        END IF;

        IF v_attempt_contact_id != p_contact_id THEN
            RAISE EXCEPTION 'Source attempt does not belong to this contact';
        END IF;

        IF v_attempt_expert_id != auth.uid() THEN
            RAISE EXCEPTION 'Source attempt does not belong to the current agent';
        END IF;
    END IF;

    -- Validation
    IF p_task_type NOT IN ('daily_activity', 'retry_call', 'consultation_reminder') THEN
        RAISE EXCEPTION 'Invalid task_type';
    END IF;

    v_tehran_today := (now() AT TIME ZONE 'Asia/Tehran')::date;
    IF p_scheduled_date < v_tehran_today THEN
        RAISE EXCEPTION 'Cannot schedule tasks in the past in Tehran timezone';
    END IF;

    -- Insert
    INSERT INTO public.contact_tasks (
        contact_id,
        expert_id,
        source_attempt_id,
        task_type,
        scheduled_date,
        scheduled_time,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_contact_id,
        auth.uid(),
        p_source_attempt_id,
        p_task_type,
        p_scheduled_date,
        p_scheduled_time,
        'pending',
        now(),
        now()
    ) RETURNING * INTO v_new_task;

    RETURN v_new_task;
END;
$$;

-- 4.2. reschedule_contact_task
CREATE OR REPLACE FUNCTION public.reschedule_contact_task(
    p_task_id UUID,
    p_new_date DATE,
    p_new_time TEXT DEFAULT NULL
) RETURNS public.contact_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_account_status TEXT;
    v_role TEXT;
    v_task public.contact_tasks;
    v_tehran_today DATE;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Agent check
    SELECT account_status, role INTO v_account_status, v_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_account_status != 'active' OR v_role != 'agent' THEN
        RAISE EXCEPTION 'Not an active agent';
    END IF;

    SELECT * INTO v_task FROM public.contact_tasks WHERE id = p_task_id;
    IF v_task.id IS NULL THEN RAISE EXCEPTION 'Task not found'; END IF;
    IF v_task.expert_id != auth.uid() THEN RAISE EXCEPTION 'Task does not belong to current agent'; END IF;
    IF v_task.status != 'pending' THEN RAISE EXCEPTION 'Only pending tasks can be rescheduled'; END IF;

    v_tehran_today := (now() AT TIME ZONE 'Asia/Tehran')::date;
    IF p_new_date < v_tehran_today THEN
        RAISE EXCEPTION 'Cannot reschedule tasks in the past in Tehran timezone';
    END IF;

    UPDATE public.contact_tasks
    SET scheduled_date = p_new_date,
        scheduled_time = p_new_time,
        updated_at = now()
    WHERE id = p_task_id
    RETURNING * INTO v_task;

    RETURN v_task;
END;
$$;

-- 4.3. complete_contact_task
CREATE OR REPLACE FUNCTION public.complete_contact_task(
    p_task_id UUID
) RETURNS public.contact_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_account_status TEXT;
    v_role TEXT;
    v_task public.contact_tasks;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Agent check
    SELECT account_status, role INTO v_account_status, v_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_account_status != 'active' OR v_role != 'agent' THEN
        RAISE EXCEPTION 'Not an active agent';
    END IF;

    SELECT * INTO v_task FROM public.contact_tasks WHERE id = p_task_id;
    IF v_task.id IS NULL THEN RAISE EXCEPTION 'Task not found'; END IF;
    IF v_task.expert_id != auth.uid() THEN RAISE EXCEPTION 'Task does not belong to current agent'; END IF;
    IF v_task.status != 'pending' THEN RAISE EXCEPTION 'Only pending tasks can be completed'; END IF;

    UPDATE public.contact_tasks
    SET status = 'completed',
        completed_at = now(),
        updated_at = now()
    WHERE id = p_task_id
    RETURNING * INTO v_task;

    RETURN v_task;
END;
$$;

-- 4.4. cancel_contact_task
CREATE OR REPLACE FUNCTION public.cancel_contact_task(
    p_task_id UUID
) RETURNS public.contact_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_account_status TEXT;
    v_role TEXT;
    v_task public.contact_tasks;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Agent check
    SELECT account_status, role INTO v_account_status, v_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_account_status != 'active' OR v_role != 'agent' THEN
        RAISE EXCEPTION 'Not an active agent';
    END IF;

    SELECT * INTO v_task FROM public.contact_tasks WHERE id = p_task_id;
    IF v_task.id IS NULL THEN RAISE EXCEPTION 'Task not found'; END IF;
    IF v_task.expert_id != auth.uid() THEN RAISE EXCEPTION 'Task does not belong to current agent'; END IF;
    IF v_task.status != 'pending' THEN RAISE EXCEPTION 'Only pending tasks can be cancelled'; END IF;

    UPDATE public.contact_tasks
    SET status = 'cancelled',
        cancelled_at = now(),
        updated_at = now()
    WHERE id = p_task_id
    RETURNING * INTO v_task;

    RETURN v_task;
END;
$$;

-- 4.5. get_my_contact_task_summary
CREATE OR REPLACE FUNCTION public.get_my_contact_task_summary(
    p_target_date DATE DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_target DATE;
    v_daily_activity INT;
    v_retry_call INT;
    v_consultation_reminder INT;
    v_overdue INT;
    v_result jsonb;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    v_target := COALESCE(p_target_date, (now() AT TIME ZONE 'Asia/Tehran')::date);

    SELECT
        COUNT(*) FILTER (WHERE task_type = 'daily_activity' AND scheduled_date = v_target),
        COUNT(*) FILTER (WHERE task_type = 'retry_call' AND scheduled_date = v_target),
        COUNT(*) FILTER (WHERE task_type = 'consultation_reminder' AND scheduled_date = v_target),
        COUNT(*) FILTER (WHERE scheduled_date < v_target)
    INTO
        v_daily_activity, v_retry_call, v_consultation_reminder, v_overdue
    FROM public.contact_tasks
    WHERE expert_id = auth.uid()
      AND status = 'pending';

    v_result := jsonb_build_object(
        'target_date', v_target,
        'daily_activity', v_daily_activity,
        'retry_call', v_retry_call,
        'consultation_reminder', v_consultation_reminder,
        'overdue', v_overdue
    );

    RETURN v_result;
END;
$$;

-- 5. Revoke/Grant Execution
REVOKE ALL ON TABLE public.contact_tasks FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.contact_tasks TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_contact_task(UUID, TEXT, DATE, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_contact_task(UUID, TEXT, DATE, TEXT, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reschedule_contact_task(UUID, DATE, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reschedule_contact_task(UUID, DATE, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.complete_contact_task(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_contact_task(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.cancel_contact_task(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_contact_task(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_contact_task_summary(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_contact_task_summary(DATE) TO authenticated;
