-- Add unique constraint on meeting_id for spot_check_analytics
ALTER TABLE public.spot_check_analytics 
ADD CONSTRAINT spot_check_analytics_meeting_id_unique UNIQUE (meeting_id);