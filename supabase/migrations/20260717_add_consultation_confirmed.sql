-- Migration: 20260717_add_consultation_confirmed.sql
-- Description: Add consultation_confirmed field to expert_contacts and call_attempts.
-- Updates RPCs to handle this new field.

-- 1. Add columns
ALTER TABLE public.expert_contacts ADD COLUMN IF NOT EXISTS consultation_confirmed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.call_attempts ADD COLUMN IF NOT EXISTS consultation_confirmed BOOLEAN NOT NULL DEFAULT false;

-- Clean up any mistakenly created overloaded functions
DROP FUNCTION IF EXISTS public.create_contact(text, text, text, text[], text, text, text, text, text, integer, boolean);
DROP FUNCTION IF EXISTS public.update_contact(uuid, text, text, text[], text, text, text, text, text, integer, boolean);
DROP FUNCTION IF EXISTS public.record_call_attempt_with_task(uuid, text, text, text, text[], text, text, text, text, text, text, date, text, text, boolean);

-- Drop old versions that will be replaced with new signatures
DROP FUNCTION IF EXISTS public.create_call_attempt(uuid, text, text, text, text[], text, text, text, text, text);
DROP FUNCTION IF EXISTS public.create_call_attempt(uuid, text, text, text, text[], text, text, text, text, text, boolean);

-- 2. Update create_contact (keep exact signature)
DROP FUNCTION IF EXISTS public.create_contact(text, text, text, text[], text, text, text, text, text, integer);

CREATE OR REPLACE FUNCTION public.create_contact(
    p_phone TEXT,
    p_full_name TEXT,
    p_call_status TEXT,
    p_courses TEXT[],
    p_advisory TEXT,
    p_advisory_date TEXT,
    p_advisory_time TEXT,
    p_registered TEXT,
    p_notes TEXT,
    p_queue_order INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID;
    v_contact_id UUID;
    v_norm_phone TEXT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL OR NOT public.is_active_agent() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    v_norm_phone := public.normalize_phone(p_phone);

    INSERT INTO public.expert_contacts (
        expert_id, phone, phone_normalized, full_name, call_status, courses,
        advisory, advisory_date, advisory_time, registered, notes, queue_order, consultation_confirmed
    ) VALUES (
        v_uid, p_phone, v_norm_phone, p_full_name, p_call_status, p_courses,
        p_advisory, p_advisory_date, p_advisory_time, p_registered, p_notes, p_queue_order, false
    )
    RETURNING id INTO v_contact_id;

    RETURN v_contact_id;
END;
$$;

-- 3. Update update_contact (keep exact signature)
DROP FUNCTION IF EXISTS public.update_contact(uuid, text, text, text[], text, text, text, text, text, integer);

CREATE OR REPLACE FUNCTION public.update_contact(
    p_id UUID,
    p_full_name TEXT,
    p_call_status TEXT,
    p_courses TEXT[],
    p_advisory TEXT,
    p_advisory_date TEXT,
    p_advisory_time TEXT,
    p_registered TEXT,
    p_notes TEXT,
    p_queue_order INTEGER
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
    IF v_uid IS NULL OR NOT public.is_active_agent() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    UPDATE public.expert_contacts
    SET
        full_name = p_full_name,
        call_status = p_call_status,
        courses = p_courses,
        advisory = p_advisory,
        advisory_date = p_advisory_date,
        advisory_time = p_advisory_time,
        registered = p_registered,
        notes = p_notes,
        queue_order = p_queue_order,
        updated_at = now()
    WHERE id = p_id
      AND expert_id = v_uid
      AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contact not found or access denied';
    END IF;
END;
$$;

-- 4. Update create_call_attempt (new signature with boolean)
CREATE OR REPLACE FUNCTION public.create_call_attempt(
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
    p_consultation_confirmed BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID;
    v_attempt_id UUID;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL OR NOT public.is_active_agent() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    PERFORM id
    FROM public.expert_contacts
    WHERE id = p_contact_id
      AND expert_id = v_uid
      AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contact not found or access denied';
    END IF;

    INSERT INTO public.call_attempts (
        contact_id, expert_id, jalali_date_time, full_name, call_status, courses,
        advisory, advisory_date, advisory_time, registered, notes, consultation_confirmed
    ) VALUES (
        p_contact_id, v_uid, p_jalali_date_time, p_full_name, p_call_status, p_courses,
        p_advisory, p_advisory_date, p_advisory_time, p_registered, p_notes, p_consultation_confirmed
    )
    RETURNING id INTO v_attempt_id;

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
        consultation_confirmed = COALESCE(p_consultation_confirmed, consultation_confirmed),
        updated_at = now()
    WHERE id = p_contact_id;

    RETURN v_attempt_id;
END;
$$;

-- 5. Update record_call_attempt_with_task (keep exact signature)
DROP FUNCTION IF EXISTS public.record_call_attempt_with_task(uuid, text, text, text, text[], text, text, text, text, text, text, date, text, text);

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

    IF p_task_type NOT IN ('daily_activity', 'retry_call', 'consultation_reminder', 'other_followup') THEN
        RAISE EXCEPTION 'Invalid task_type';
    END IF;

    v_tehran_today := (now() AT TIME ZONE 'Asia/Tehran')::date;

    IF p_task_type = 'daily_activity' THEN
        p_scheduled_date := v_tehran_today;
        p_scheduled_time := NULL;
        p_followup_note := NULL;
    ELSE
        IF p_scheduled_date IS NULL THEN
            RAISE EXCEPTION 'scheduled_date is required for follow-up tasks';
        END IF;
        IF p_scheduled_date < v_tehran_today THEN
            RAISE EXCEPTION 'Cannot schedule tasks in the past in Tehran timezone';
        END IF;
    END IF;

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

    PERFORM id
    FROM public.expert_contacts
    WHERE id = p_contact_id
      AND expert_id = v_uid
      AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contact not found or access denied';
    END IF;

    -- Update the contact directly via attempt update logic
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

    INSERT INTO public.call_attempts (
        contact_id, expert_id, jalali_date_time, full_name, call_status, courses,
        advisory, advisory_date, advisory_time, registered, notes
    ) VALUES (
        p_contact_id, v_uid, p_jalali_date_time, p_full_name, p_call_status, p_courses,
        p_advisory, p_advisory_date, p_advisory_time, p_registered, p_notes
    )
    RETURNING * INTO v_attempt;

    INSERT INTO public.contact_tasks (
        contact_id, expert_id, task_type, scheduled_date, scheduled_time, notes, call_attempt_id, status
    ) VALUES (
        p_contact_id, v_uid, p_task_type, p_scheduled_date, p_scheduled_time, v_clean_note, v_attempt.id, 'pending'
    )
    RETURNING * INTO v_task;

    RETURN jsonb_build_object(
        'attempt', to_jsonb(v_attempt),
        'task', to_jsonb(v_task)
    );
END;
$$;

-- 6. Permissions and Comments (using exact signatures)
GRANT EXECUTE ON FUNCTION public.create_contact(text, text, text, text[], text, text, text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_contact(uuid, text, text, text[], text, text, text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_call_attempt(uuid, text, text, text, text[], text, text, text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_call_attempt_with_task(uuid, text, text, text, text[], text, text, text, text, text, text, date, text, text) TO authenticated;

COMMENT ON FUNCTION public.create_contact(text, text, text, text[], text, text, text, text, text, integer) IS 'Creates a new expert contact securely (exact signature).';
COMMENT ON FUNCTION public.update_contact(uuid, text, text, text[], text, text, text, text, text, integer) IS 'Updates an expert contact securely (exact signature).';
COMMENT ON FUNCTION public.create_call_attempt(uuid, text, text, text, text[], text, text, text, text, text, boolean) IS 'Creates a call attempt securely and updates contact fields including consultation_confirmed.';
COMMENT ON FUNCTION public.record_call_attempt_with_task(uuid, text, text, text, text[], text, text, text, text, text, text, date, text, text) IS 'Records a call attempt and creates a task atomically (exact signature).';
