-- Migration: 20260706_add_delete_followup_share_rpc.sql
-- Adds RPC to delete a followup share.

CREATE OR REPLACE FUNCTION public.delete_followup_share(p_share_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    DELETE FROM public.followup_shares
    WHERE id = p_share_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_followup_share TO authenticated;
