-- Migration: 20260705_record_call_attempt_with_task.sql
-- Description: Create atomic RPC to record a call attempt and a scheduled task together

CREATE OR REPLACE FUNCTION public.record_call_attempt_with_task(
    p_contact_id UUID,
    p_jalali_date_time TEXT,
    p_full_name TEXT,
    p_call_status TEXT,
    p_courses TEXT[],
    p_advisory TEXT,
    p_advisory_date TEXT,
    p_advisory_time TEXT,
    p_registered TEXT,
    p_notes TEXT,
    p_task_type TEXT,
    p_scheduled_date DATE DEFAULT NULL,
    p_scheduled_time TEXT DEFAULT NULL,
    p_followup_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID;
    v_attempt public.call_attempts;
    v_task public.contact_tasks;
    v_tehran_today DATE;
    v_clean_note TEXT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL OR NOT public.is_active_agent() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Task type validation early
    IF p_task_type NOT IN ('daily_activity', 'retry_call', 'consultation_reminder', 'other_followup') THEN
        RAISE EXCEPTION 'Invalid task_type';
    END IF;

    v_tehran_today := (now() AT TIME ZONE 'Asia/Tehran')::date;

    -- Date checks
    IF p_task_type = 'daily_activity' THEN
        -- Force daily activity to be scheduled for today
        p_scheduled_date := v_tehran_today;
        p_scheduled_time := NULL;
        p_followup_note := NULL;
    ELSE
        -- follow-up types require a date
        IF p_scheduled_date IS NULL THEN
            RAISE EXCEPTION 'scheduled_date is required for follow-up tasks';
        END IF;
        IF p_scheduled_date < v_tehran_today THEN
            RAISE EXCEPTION 'Cannot schedule tasks in the past in Tehran timezone';
        END IF;
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

    -- Ownership and active validation
    PERFORM id
    FROM public.expert_contacts
    WHERE id = p_contact_id
      AND expert_id = v_uid
      AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contact not found or access denied';
    END IF;

    -- 1. Insert Call Attempt
    INSERT INTO public.call_attempts (
        contact_id, expert_id, jalali_date_time, full_name, call_status, courses,
        advisory, advisory_date, advisory_time, registered, notes
    ) VALUES (
        p_contact_id, v_uid, p_jalali_date_time, p_full_name, p_call_status, p_courses,
        p_advisory, p_advisory_date, p_advisory_time, p_registered, p_notes
    ) RETURNING * INTO v_attempt;

    -- 2. Update Expert Contact
    UPDATE public.expert_contacts
    SET
        full_name = COALESCE(p_full_name, full_name),
        call_status = COALESCE(p_call_status, call_status),
        courses = COALESCE(p_courses, courses),
        advisory = COALESCE(p_advisory, advisory),
        advisory_date = COALESCE(p_advisory_date, advisory_date),
        advisory_time = COALESCE(p_advisory_time, advisory_time),
        registered = COALESCE(p_registered, registered),
        notes = COALESCE(p_notes, notes),
        updated_at = now()
    WHERE id = p_contact_id;

    -- 3. Insert Contact Task
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
        v_uid,
        v_attempt.id,
        p_task_type,
        p_scheduled_date,
        p_scheduled_time,
        v_clean_note,
        'pending',
        now(),
        now()
    ) RETURNING * INTO v_task;

    RETURN jsonb_build_object(
        'attempt', to_jsonb(v_attempt),
        'task', to_jsonb(v_task)
    );
END;
$$;

-- Secure Permissions
REVOKE ALL ON FUNCTION public.record_call_attempt_with_task FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_call_attempt_with_task TO authenticated;
