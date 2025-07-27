-- Create a unique constraint on meeting_id and month to ensure proper upserts
ALTER TABLE public.resourcing_analytics 
ADD CONSTRAINT resourcing_analytics_meeting_id_month_unique 
UNIQUE (meeting_id, month);