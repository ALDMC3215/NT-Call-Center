-- Migration: 20260706_grant_delete_by_ids_rpc.sql
-- Grants execute permission to authenticated users for delete_call_attempts_by_ids

GRANT EXECUTE ON FUNCTION public.delete_call_attempts_by_ids TO authenticated;
