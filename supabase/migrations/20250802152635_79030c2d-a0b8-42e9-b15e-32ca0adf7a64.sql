-- Add unique constraint to feedback_analytics table for proper upserts
ALTER TABLE public.feedback_analytics 
ADD CONSTRAINT feedback_analytics_company_meeting_unique 
UNIQUE (company_id, meeting_id);