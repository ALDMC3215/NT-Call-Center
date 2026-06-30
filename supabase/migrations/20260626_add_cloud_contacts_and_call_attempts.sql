-- Migration: 20260626_add_cloud_contacts_and_call_attempts.sql
-- Phase 2A: Secure persistence for Cloud contacts and immutable call attempts.

-- ---------------------------------------------------------------------------
-- 1. Helper Function: Normalize Phone Numbers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_phone(phone_number TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    clean_num TEXT;
BEGIN
    IF phone_number IS NULL THEN
        RAISE EXCEPTION 'Phone number cannot be null';
    END IF;
    
    -- Convert Persian and Arabic digits to English digits
    clean_num := translate(phone_number, '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789');
    
    -- Remove all non-digits
    clean_num := regexp_replace(clean_num, '\D', '', 'g');
    
    -- Normalize Iranian prefixes
    IF clean_num LIKE '98%' AND length(clean_num) > 10 THEN
        clean_num := '0' || substr(clean_num, 3);
    ELSIF clean_num LIKE '9%' AND length(clean_num) = 10 THEN
        clean_num := '0' || clean_num;
    END IF;
    
    -- Final validation
    IF NOT (clean_num ~ '^09[0-9]{9}$') THEN
        RAISE EXCEPTION 'Invalid phone number format: must be an 11-digit Iranian mobile number starting with 09';
    END IF;
    
    RETURN clean_num;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Table: expert_contacts
-- ---------------------------------------------------------------------------
CREATE TABLE public.expert_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expert_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE NO ACTION,
    phone TEXT NOT NULL,
    phone_normalized TEXT NOT NULL CHECK (phone_normalized ~ '^09[0-9]{9}$'),
    full_name TEXT,
    call_status TEXT,
    courses TEXT[],
    advisory TEXT,
    advisory_date TEXT,
    advisory_time TEXT,
    registered TEXT,
    notes TEXT,
    queue_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Unique index to prevent duplicate active contacts for the same expert
CREATE UNIQUE INDEX idx_expert_contacts_phone_expert_unique 
    ON public.expert_contacts(expert_id, phone_normalized) 
    WHERE deleted_at IS NULL;

-- Indexes for performance
CREATE INDEX idx_expert_contacts_expert_id ON public.expert_contacts(expert_id);
CREATE INDEX idx_expert_contacts_normalized_phone ON public.expert_contacts(phone_normalized);
CREATE INDEX idx_expert_contacts_deleted_at ON public.expert_contacts(deleted_at);

-- RLS
ALTER TABLE public.expert_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_select" ON public.expert_contacts
    FOR SELECT USING (
        (auth.uid() = expert_id AND deleted_at IS NULL)
        OR public.is_admin()
    );

-- ---------------------------------------------------------------------------
-- 3. Table: call_attempts
-- ---------------------------------------------------------------------------
CREATE TABLE public.call_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.expert_contacts(id) ON DELETE NO ACTION,
    expert_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE NO ACTION,
    jalali_date_time TEXT,
    full_name TEXT,
    call_status TEXT,
    courses TEXT[],
    advisory TEXT,
    advisory_date TEXT,
    advisory_time TEXT,
    registered TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_call_attempts_contact_created ON public.call_attempts(contact_id, created_at);
CREATE INDEX idx_call_attempts_expert_created ON public.call_attempts(expert_id, created_at);

-- RLS
ALTER TABLE public.call_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "call_attempts_select" ON public.call_attempts
    FOR SELECT USING (
        (auth.uid() = expert_id)
        OR public.is_admin()
    );

-- ---------------------------------------------------------------------------
-- 4. RPCs: Secure Mutations
-- ---------------------------------------------------------------------------

-- 4.1. create_contact
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
        advisory, advisory_date, advisory_time, registered, notes, queue_order
    ) VALUES (
        v_uid, p_phone, v_norm_phone, p_full_name, p_call_status, p_courses,
        p_advisory, p_advisory_date, p_advisory_time, p_registered, p_notes, p_queue_order
    )
    RETURNING id INTO v_contact_id;
    
    RETURN v_contact_id;
END;
$$;

-- 4.2. update_contact
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

-- 4.3. delete_contact (soft delete)
CREATE OR REPLACE FUNCTION public.delete_contact(p_id UUID)
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
    SET deleted_at = now(), updated_at = now()
    WHERE id = p_id
      AND expert_id = v_uid
      AND deleted_at IS NULL;
      
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contact not found or access denied';
    END IF;
END;
$$;

-- 4.4. bulk_create_contacts
CREATE OR REPLACE FUNCTION public.bulk_create_contacts(p_contacts JSONB)
RETURNS TABLE (
    inserted_count INTEGER,
    skipped_duplicate_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID;
    v_contact JSONB;
    v_norm_phone TEXT;
    v_inserted INTEGER := 0;
    v_skipped INTEGER := 0;
    v_row_count INTEGER;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL OR NOT public.is_active_agent() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    FOR v_contact IN SELECT * FROM pg_catalog.jsonb_array_elements(p_contacts)
    LOOP
        v_norm_phone := public.normalize_phone(v_contact->>'phone');
        
        INSERT INTO public.expert_contacts (
            expert_id, phone, phone_normalized, full_name, call_status, courses,
            advisory, advisory_date, advisory_time, registered, notes, queue_order
        ) VALUES (
            v_uid, 
            v_contact->>'phone', 
            v_norm_phone, 
            v_contact->>'full_name', 
            v_contact->>'call_status', 
            ARRAY(SELECT pg_catalog.jsonb_array_elements_text(COALESCE(v_contact->'courses', '[]'::jsonb))),
            v_contact->>'advisory', 
            v_contact->>'advisory_date', 
            v_contact->>'advisory_time', 
            v_contact->>'registered', 
            v_contact->>'notes', 
            (v_contact->>'queue_order')::INTEGER
        )
        ON CONFLICT (expert_id, phone_normalized) WHERE deleted_at IS NULL 
        DO NOTHING;
        
        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        IF v_row_count > 0 THEN
            v_inserted := v_inserted + 1;
        ELSE
            v_skipped := v_skipped + 1;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT v_inserted, v_skipped;
END;
$$;

-- 4.5. create_call_attempt
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
    p_notes TEXT
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
    
    -- Validate ownership, active state, and lock to prevent race condition
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
        advisory, advisory_date, advisory_time, registered, notes
    ) VALUES (
        p_contact_id, v_uid, p_jalali_date_time, p_full_name, p_call_status, p_courses,
        p_advisory, p_advisory_date, p_advisory_time, p_registered, p_notes
    )
    RETURNING id INTO v_attempt_id;
    
    -- Also update the main contact record with the latest info
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
    
    RETURN v_attempt_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Revoke PUBLIC privileges and Grant securely
-- ---------------------------------------------------------------------------

-- 5.1. Table Privileges
REVOKE ALL ON TABLE public.expert_contacts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.call_attempts FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.expert_contacts TO authenticated;
GRANT SELECT ON TABLE public.call_attempts TO authenticated;

-- 5.2. Function Privileges
REVOKE ALL ON FUNCTION public.normalize_phone FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_contact FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_contact FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_contact FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bulk_create_contacts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_call_attempt FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_contact TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_contact TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_contact TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_create_contacts TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_call_attempt TO authenticated;
