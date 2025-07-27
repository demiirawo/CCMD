-- Remove the foreign key constraint to allow temporary meeting IDs
ALTER TABLE public.resourcing_analytics 
DROP CONSTRAINT IF EXISTS resourcing_analytics_meeting_id_fkey;

-- Make meeting_id nullable to allow saving analytics data without a meeting
ALTER TABLE public.resourcing_analytics 
ALTER COLUMN meeting_id DROP NOT NULL;