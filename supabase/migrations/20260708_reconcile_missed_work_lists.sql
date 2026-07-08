-- Migration: Reconcile missed work_lists due to previous RPC bug
-- Date: 2026-07-08
-- Description: Updates work_list for contacts that have pending tasks or specific call statuses but their work_list wasn't updated because of the RPC bug.

-- 1. Contacts with 'daily_activity' pending tasks should be in 'today' work_list
UPDATE public.expert_contacts c
SET work_list = 'today',
    work_list_updated_at = now(),
    work_list_date = (now() AT TIME ZONE 'Asia/Tehran')::date
FROM public.contact_tasks t
WHERE t.contact_id = c.id
  AND t.status = 'pending'
  AND t.task_type = 'daily_activity'
  AND c.work_list != 'today';

-- 2. Contacts with follow-up pending tasks should be in 'followup' work_list
UPDATE public.expert_contacts c
SET work_list = 'followup',
    work_list_updated_at = now(),
    work_list_date = NULL
FROM public.contact_tasks t
WHERE t.contact_id = c.id
  AND t.status = 'pending'
  AND t.task_type IN ('retry_call', 'consultation_reminder', 'other_followup')
  AND c.work_list != 'followup';

-- 3. Contacts marked as 'عدم تمایل' should be in 'today' work_list (as per frontend logic)
UPDATE public.expert_contacts
SET work_list = 'today',
    work_list_updated_at = now(),
    work_list_date = (now() AT TIME ZONE 'Asia/Tehran')::date
WHERE call_status = 'عدم تمایل'
  AND work_list != 'today';
