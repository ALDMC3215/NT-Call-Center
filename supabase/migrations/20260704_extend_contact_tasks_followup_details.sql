-- Migration: 20260704_extend_contact_tasks_followup_details.sql
-- Description: Extend contact_tasks for other_followup, short notes, and detailed editing.

-- 1. Extend task_type constraint safely
ALTER TABLE public.contact_tasks
DROP CONSTRAINT IF EXISTS contact_tasks_task_type_check;

ALTER TABLE public.contact_tasks
ADD CONSTRAINT contact_tasks_task_type_check 
CHECK (task_type IN ('daily_activity', 'retry_call', 'consultation_reminder', 'other_followup'));

-- 2. Add followup_note field
ALTER TABLE public.contact_tasks
ADD COLUMN followup_note TEXT;

-- 3. Add table-level constraints for followup_note
ALTER TABLE public.contact_tasks
ADD CONSTRAINT check_followup_note_length 
CHECK (followup_note IS NULL OR char_length(trim(followup_note)) <= 150);

ALTER TABLE public.contact_tasks
ADD CONSTRAINT check_followup_note_not_blank 
CHECK (followup_note IS NULL OR trim(followup_note) != '');

ALTER TABLE public.contact_tasks
ADD CONSTRAINT check_other_followup_note_required 
CHECK (task_type != 'other_followup' OR (followup_note IS NOT NULL AND trim(followup_note) != ''));

-- 4. New RPC: create_contact_task_with_details
CREATE OR REPLACE FUNCTION public.create_contact_task_with_details(
    p_contact_id UUID,
    p_task_type TEXT,
    p_scheduled_date DATE,
    p_scheduled_time TEXT DEFAULT NULL,
    p_source_attempt_id UUID DEFAULT NULL,
    p_followup_note TEXT DEFAULT NULL
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
    v_clean_note TEXT;
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
    IF p_task_type NOT IN ('daily_activity', 'retry_call', 'consultation_reminder', 'other_followup') THEN
        RAISE EXCEPTION 'Invalid task_type';
    END IF;

    v_tehran_today := (now() AT TIME ZONE 'Asia/Tehran')::date;
    IF p_scheduled_date < v_tehran_today THEN
        RAISE EXCEPTION 'Cannot schedule tasks in the past in Tehran timezone';
    END IF;

    -- Note normalization and validation
    IF p_followup_note IS NOT NULL THEN
        v_clean_note := trim(p_followup_note);
        IF v_clean_note = '' THEN
            IF p_task_type = 'other_followup' THEN
                RAISE EXCEPTION 'other_followup requires a valid note';
            ELSE
                v_clean_note := NULL;
            END IF;
        ELSE
            IF char_length(v_clean_note) > 150 THEN
                RAISE EXCEPTION 'Follow-up note cannot exceed 150 characters';
            END IF;
        END IF;
    ELSE
        IF p_task_type = 'other_followup' THEN
            RAISE EXCEPTION 'other_followup requires a note';
        END IF;
        v_clean_note := NULL;
    END IF;

    -- Insert
    INSERT INTO public.contact_tasks (
        contact_id,
        expert_id,
        source_attempt_id,
        task_type,
        scheduled_date,
        scheduled_time,
        followup_note,
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
        v_clean_note,
        'pending',
        now(),
        now()
    ) RETURNING * INTO v_new_task;

    RETURN v_new_task;
END;
$$;

-- 5. New RPC: update_contact_task_details
CREATE OR REPLACE FUNCTION public.update_contact_task_details(
    p_task_id UUID,
    p_task_type TEXT,
    p_scheduled_date DATE,
    p_scheduled_time TEXT DEFAULT NULL,
    p_followup_note TEXT DEFAULT NULL
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
    v_clean_note TEXT;
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
    IF v_task.status != 'pending' THEN RAISE EXCEPTION 'Only pending tasks can be edited'; END IF;

    IF p_task_type NOT IN ('daily_activity', 'retry_call', 'consultation_reminder', 'other_followup') THEN
        RAISE EXCEPTION 'Invalid task_type';
    END IF;

    v_tehran_today := (now() AT TIME ZONE 'Asia/Tehran')::date;
    IF p_scheduled_date < v_tehran_today THEN
        RAISE EXCEPTION 'Cannot reschedule tasks in the past in Tehran timezone';
    END IF;

    -- Note normalization and validation
    IF p_followup_note IS NOT NULL THEN
        v_clean_note := trim(p_followup_note);
        IF v_clean_note = '' THEN
            IF p_task_type = 'other_followup' THEN
                RAISE EXCEPTION 'other_followup requires a valid note';
            ELSE
                v_clean_note := NULL;
            END IF;
        ELSE
            IF char_length(v_clean_note) > 150 THEN
                RAISE EXCEPTION 'Follow-up note cannot exceed 150 characters';
            END IF;
        END IF;
    ELSE
        IF p_task_type = 'other_followup' THEN
            RAISE EXCEPTION 'other_followup requires a note';
        END IF;
        v_clean_note := NULL;
    END IF;

    UPDATE public.contact_tasks
    SET task_type = p_task_type,
        scheduled_date = p_scheduled_date,
        scheduled_time = p_scheduled_time,
        followup_note = v_clean_note,
        updated_at = now()
    WHERE id = p_task_id
    RETURNING * INTO v_task;

    RETURN v_task;
END;
$$;

-- 6. Revoke/Grant Permissions
REVOKE EXECUTE ON FUNCTION public.create_contact_task_with_details(UUID, TEXT, DATE, TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_contact_task_with_details(UUID, TEXT, DATE, TEXT, UUID, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_contact_task_details(UUID, TEXT, DATE, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_contact_task_details(UUID, TEXT, DATE, TEXT, TEXT) TO authenticated;
