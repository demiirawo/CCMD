-- Add unique constraint to care_plan_analytics table for meeting_id and company_id
ALTER TABLE public.care_plan_analytics 
ADD CONSTRAINT care_plan_analytics_meeting_company_unique 
UNIQUE (meeting_id, company_id);