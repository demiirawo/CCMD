UPDATE public.meeting_email_tracking
SET follow_up_sent_at = now()
WHERE id = '1c9fd0fc-fcf7-4310-9065-50b0843854f1'
  AND company_id = 'd5c88ffb-ade8-4e5f-a738-c2eb5bd4b222'
  AND follow_up_sent_at IS NULL;