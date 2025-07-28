-- Add unique constraints for all analytics tables to enable proper upsert functionality

-- Add unique constraint for feedback_analytics
ALTER TABLE public.feedback_analytics 
ADD CONSTRAINT feedback_analytics_meeting_company_unique 
UNIQUE (meeting_id, company_id);

-- Add unique constraint for incidents_analytics
ALTER TABLE public.incidents_analytics 
ADD CONSTRAINT incidents_analytics_meeting_company_unique 
UNIQUE (meeting_id, company_id);

-- Add unique constraint for medication_analytics
ALTER TABLE public.medication_analytics 
ADD CONSTRAINT medication_analytics_meeting_company_unique 
UNIQUE (meeting_id, company_id);

-- Add unique constraint for care_notes_analytics
ALTER TABLE public.care_notes_analytics 
ADD CONSTRAINT care_notes_analytics_meeting_company_unique 
UNIQUE (meeting_id, company_id);

-- Add unique constraint for staff_training_analytics
ALTER TABLE public.staff_training_analytics 
ADD CONSTRAINT staff_training_analytics_meeting_company_unique 
UNIQUE (meeting_id, company_id);

-- Add unique constraint for staff_documents_analytics
ALTER TABLE public.staff_documents_analytics 
ADD CONSTRAINT staff_documents_analytics_meeting_company_unique 
UNIQUE (meeting_id, company_id);

-- Add unique constraint for spot_check_analytics
ALTER TABLE public.spot_check_analytics 
ADD CONSTRAINT spot_check_analytics_meeting_company_unique 
UNIQUE (meeting_id, company_id);

-- Add unique constraint for supervision_analytics
ALTER TABLE public.supervision_analytics 
ADD CONSTRAINT supervision_analytics_meeting_company_unique 
UNIQUE (meeting_id, company_id);

-- Add unique constraint for resourcing_analytics (uses month instead of meeting_id)
ALTER TABLE public.resourcing_analytics 
ADD CONSTRAINT resourcing_analytics_month_company_unique 
UNIQUE (month, company_id);