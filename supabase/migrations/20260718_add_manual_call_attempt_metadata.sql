-- Migration: 20260718_add_manual_call_attempt_metadata.sql
-- Description: Add attempt_source, manual_reason, source_task_id, metadata to call_attempts. Create log_manual_call_attempt RPC.

-- 1. Add new columns to call_attempts
ALTER TABLE public.call_attempts
ADD COLUMN IF NOT EXISTS attempt_source text NOT NULL DEFAULT 'result_submit';

ALTER TABLE public.call_attempts
ADD COLUMN IF NOT EXISTS manual_reason text;

ALTER TABLE public.call_attempts
ADD COLUMN IF NOT EXISTS source_task_id uuid REFERENCES public.contact_tasks(id) ON DELETE SET NULL;

ALTER TABLE public.call_attempts
ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Add check constraint for attempt_source
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'call_attempts_attempt_source_check'
    ) THEN
        ALTER TABLE public.call_attempts
        ADD CONSTRAINT call_attempts_attempt_source_check
        CHECK (attempt_source IN ('result_submit', 'manual_attempt', 'followup_attempt', 'task_result_submit', 'system'));
    END IF;
END $$;


-- 2. Update existing functions to set attempt_source correctly.

-- Re-create create_call_attempt
DROP FUNCTION IF EXISTS public.create_call_attempt(uuid, text, text, text, text[], text, text, text, text, text);
DROP FUNCTION IF EXISTS public.create_call_attempt(uuid, text, text, text, text[], text, text, text, text, text, boolean);

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

    PERFORM id FROM public.expert_contacts
    WHERE id = p_contact_id AND expert_id = v_uid AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contact not found or access denied';
    END IF;

    INSERT INTO public.call_attempts (
        contact_id, expert_id, jalali_date_time, full_name, call_status, courses,
        advisory, advisory_date, advisory_time, registered, notes, consultation_confirmed,
        attempt_source
    ) VALUES (
        p_contact_id, v_uid, p_jalali_date_time, p_full_name, p_call_status, p_courses,
        p_advisory, p_advisory_date, p_advisory_time, p_registered, p_notes, p_consultation_confirmed,
        'result_submit'
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
        consultation_confirmed = p_consultation_confirmed,
        updated_at = now()
    WHERE id = p_contact_id;

    RETURN v_attempt_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_call_attempt(uuid, text, text, text, text[], text, text, text, text, text, boolean) TO authenticated;
COMMENT ON FUNCTION public.create_call_attempt(uuid, text, text, text, text[], text, text, text, text, text, boolean) IS 'Creates a call attempt securely and updates contact fields including consultation_confirmed.';

-- Re-create record_call_attempt_with_task
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
    p_followup_note TEXT DEFAULT NULL,
    p_consultation_confirmed BOOLEAN DEFAULT NULL
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
    v_existing_contact public.expert_contacts;
    v_consultation_confirmed BOOLEAN;
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

    SELECT * INTO v_existing_contact
    FROM public.expert_contacts
    WHERE id = p_contact_id
      AND expert_id = v_uid
      AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contact not found or access denied';
    END IF;

    -- Resolve consultation_confirmed
    v_consultation_confirmed := COALESCE(
        p_consultation_confirmed,
        v_existing_contact.consultation_confirmed,
        false
    );

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
        consultation_confirmed = v_consultation_confirmed,
        updated_at = now()
    WHERE id = p_contact_id;

    INSERT INTO public.call_attempts (
        contact_id, expert_id, jalali_date_time, full_name, call_status, courses,
        advisory, advisory_date, advisory_time, registered, notes, consultation_confirmed, attempt_source
    ) VALUES (
        p_contact_id, v_uid, p_jalali_date_time, p_full_name, p_call_status, p_courses,
        p_advisory, p_advisory_date, p_advisory_time, p_registered, p_notes, v_consultation_confirmed, 'task_result_submit'
    )
    RETURNING * INTO v_attempt;

    INSERT INTO public.contact_tasks (
        contact_id, expert_id, task_type, scheduled_date, scheduled_time, followup_note, source_attempt_id, status, created_at, updated_at
    ) VALUES (
        p_contact_id, v_uid, p_task_type, p_scheduled_date, p_scheduled_time, v_clean_note, v_attempt.id, 'pending', now(), now()
    )
    RETURNING * INTO v_task;

    RETURN jsonb_build_object(
        'attempt', to_jsonb(v_attempt),
        'task', to_jsonb(v_task)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_call_attempt_with_task(uuid, text, text, text, text[], text, text, text, text, text, text, date, text, text, boolean) TO authenticated;
COMMENT ON FUNCTION public.record_call_attempt_with_task(uuid, text, text, text, text[], text, text, text, text, text, text, date, text, text, boolean) IS 'Records a call attempt and creates a task atomically. Supports optional consultation_confirmed.';


-- 3. Create the new RPC for controlled manual attempt logging
CREATE OR REPLACE FUNCTION public.log_manual_call_attempt(
    p_contact_id UUID,
    p_jalali_date_time TEXT,
    p_source_task_id UUID DEFAULT NULL,
    p_manual_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID;
    v_contact public.expert_contacts;
    v_attempt public.call_attempts;
    v_last_attempt_at TIMESTAMPTZ;
    v_today_attempt_count INT;
    v_total_attempt_count INT;
    v_attempt_source TEXT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL OR NOT public.is_active_agent() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Fetch and lock contact
    SELECT * INTO v_contact
    FROM public.expert_contacts
    WHERE id = p_contact_id AND expert_id = v_uid AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contact not found or access denied';
    END IF;

    -- Validate source task if provided
    IF p_source_task_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM public.contact_tasks
            WHERE id = p_source_task_id
              AND contact_id = p_contact_id
              AND expert_id = v_uid
              AND status NOT IN ('completed', 'deleted', 'canceled')
        ) THEN
            RAISE EXCEPTION 'پیگیری انتخاب‌شده معتبر نیست.';
        END IF;
        v_attempt_source := 'followup_attempt';
    ELSE
        v_attempt_source := 'manual_attempt';
    END IF;

    -- Anti-cheat: Check last attempt time
    SELECT max(created_at) INTO v_last_attempt_at
    FROM public.call_attempts
    WHERE contact_id = p_contact_id AND expert_id = v_uid;

    IF v_last_attempt_at IS NOT NULL AND v_last_attempt_at > (now() - interval '60 seconds') THEN
        RAISE EXCEPTION 'برای ثبت تلاش بعدی کمی صبر کنید.';
    END IF;

    -- Anti-cheat: Check today's attempt count
    SELECT count(*) INTO v_today_attempt_count
    FROM public.call_attempts
    WHERE contact_id = p_contact_id
      AND expert_id = v_uid
      AND created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Tehran');

    IF v_today_attempt_count >= 3 THEN
        IF p_manual_reason IS NULL OR trim(p_manual_reason) = '' THEN
            RAISE EXCEPTION 'برای تلاش‌های بیشتر، نوشتن دلیل الزامی است.';
        END IF;
    END IF;

    -- Insert new attempt as snapshot of current contact state
    INSERT INTO public.call_attempts (
        contact_id, expert_id, jalali_date_time, full_name, call_status, courses,
        advisory, advisory_date, advisory_time, registered, notes, consultation_confirmed,
        attempt_source, manual_reason, source_task_id
    ) VALUES (
        p_contact_id, v_uid, p_jalali_date_time, v_contact.full_name, v_contact.call_status, v_contact.courses,
        v_contact.advisory, v_contact.advisory_date, v_contact.advisory_time, v_contact.registered, v_contact.notes, v_contact.consultation_confirmed,
        v_attempt_source, trim(p_manual_reason), p_source_task_id
    ) RETURNING * INTO v_attempt;

    SELECT count(*) INTO v_total_attempt_count
    FROM public.call_attempts
    WHERE contact_id = p_contact_id AND expert_id = v_uid;

    RETURN jsonb_build_object(
        'attempt', to_jsonb(v_attempt),
        'attempt_count', v_total_attempt_count,
        'today_attempt_count', v_today_attempt_count + 1,
        'last_attempt_at', v_attempt.created_at
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_manual_call_attempt(uuid, text, uuid, text) TO authenticated;
COMMENT ON FUNCTION public.log_manual_call_attempt(uuid, text, uuid, text) IS 'Logs a manual call attempt with anti-cheat protection.';

-- 4. Add Performance Index
CREATE INDEX IF NOT EXISTS idx_call_attempts_expert_contact_created_at
ON public.call_attempts (expert_id, contact_id, created_at DESC);
