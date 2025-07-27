-- Add unique constraints to analytics tables for proper upsert functionality
ALTER TABLE public.feedback_analytics ADD CONSTRAINT feedback_analytics_meeting_company_unique UNIQUE (meeting_id, company_id);
ALTER TABLE public.medication_analytics ADD CONSTRAINT medication_analytics_meeting_company_unique UNIQUE (meeting_id, company_id);
ALTER TABLE public.care_notes_analytics ADD CONSTRAINT care_notes_analytics_meeting_company_unique UNIQUE (meeting_id, company_id);
ALTER TABLE public.incidents_analytics ADD CONSTRAINT incidents_analytics_meeting_company_unique UNIQUE (meeting_id, company_id);