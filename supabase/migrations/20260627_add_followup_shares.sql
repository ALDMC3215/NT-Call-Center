-- 1. Table
CREATE TABLE public.followup_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_expert_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    receiver_manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    payload_json JSONB NOT NULL,
    item_count INTEGER NOT NULL CHECK (item_count >= 0),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT enforce_payload_array_count CHECK (
        CASE 
            WHEN jsonb_typeof(payload_json) = 'array' THEN item_count = jsonb_array_length(payload_json)
            ELSE false 
        END
    )
);

-- 2. Strict table permissions
ALTER TABLE public.followup_shares ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.followup_shares FROM PUBLIC;
REVOKE ALL ON TABLE public.followup_shares FROM anon;
REVOKE ALL ON TABLE public.followup_shares FROM authenticated;

GRANT SELECT ON TABLE public.followup_shares TO authenticated;

-- 3. Read policy
CREATE POLICY "Users can read relevant shares"
    ON public.followup_shares
    FOR SELECT
    TO authenticated
    USING (
        (auth.uid() = sender_expert_id AND public.is_active_agent())
        OR 
        (auth.uid() = receiver_manager_id AND public.is_admin())
    );

-- 4. Secure create RPC
CREATE OR REPLACE FUNCTION public.create_followup_share(
    p_receiver_manager_id UUID,
    p_payload_json JSONB,
    p_item_count INTEGER
)
RETURNS TABLE (id UUID, sent_at TIMESTAMPTZ, item_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_sender_id UUID := auth.uid();
    v_receiver_active BOOLEAN;
    v_inserted_id UUID;
    v_sent_at TIMESTAMPTZ;
BEGIN
    -- Sender validation
    IF v_sender_id IS NULL OR NOT public.is_active_agent() THEN
        RAISE EXCEPTION 'Forbidden: only active experts can send follow-up shares.';
    END IF;

    -- Receiver validation
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = p_receiver_manager_id 
          AND public.profiles.role = 'admin' 
          AND public.profiles.account_status = 'active'
    ) INTO v_receiver_active;

    IF NOT v_receiver_active THEN
        RAISE EXCEPTION 'Validation: receiver must be an active admin.';
    END IF;

    -- Payload validation
    IF jsonb_typeof(p_payload_json) != 'array' THEN
        RAISE EXCEPTION 'Validation: payload_json must be a JSON array.';
    END IF;

    -- Count validation
    IF p_item_count < 0 THEN
        RAISE EXCEPTION 'Validation: item_count must be non-negative.';
    END IF;

    IF p_item_count != jsonb_array_length(p_payload_json) THEN
        RAISE EXCEPTION 'Validation: item_count must match the array length.';
    END IF;

    -- Insert
    INSERT INTO public.followup_shares (
        sender_expert_id, receiver_manager_id, payload_json, item_count
    ) VALUES (
        v_sender_id, p_receiver_manager_id, p_payload_json, p_item_count
    ) RETURNING public.followup_shares.id, public.followup_shares.sent_at INTO v_inserted_id, v_sent_at;

    RETURN QUERY SELECT v_inserted_id, v_sent_at, p_item_count;
END;
$$;

REVOKE ALL ON FUNCTION public.create_followup_share(UUID, JSONB, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_followup_share(UUID, JSONB, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.create_followup_share(UUID, JSONB, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_followup_share(UUID, JSONB, INTEGER) TO authenticated;

-- 5. Safe manager-directory RPC
CREATE OR REPLACE FUNCTION public.get_active_managers()
RETURNS TABLE (id UUID, full_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_active_agent() THEN
        RAISE EXCEPTION 'Forbidden: only active experts can view managers.';
    END IF;

    RETURN QUERY
    SELECT p.id, p.full_name
    FROM public.profiles p
    WHERE p.role = 'admin' AND p.account_status = 'active'
    ORDER BY p.full_name ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_active_managers() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_active_managers() FROM anon;
REVOKE ALL ON FUNCTION public.get_active_managers() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_managers() TO authenticated;
