-- Fix unique constraints to properly handle null meeting_id values

-- Drop existing constraints that don't handle nulls properly
ALTER TABLE public.resourcing_overview DROP CONSTRAINT IF EXISTS resourcing_overview_company_id_meeting_id_key;
ALTER TABLE public.service_user_document_analytics DROP CONSTRAINT IF EXISTS service_user_document_analytics_company_id_meeting_id_key;

-- Create partial unique indexes that handle null meeting_id properly
-- For company-wide data (meeting_id is null)
CREATE UNIQUE INDEX IF NOT EXISTS resourcing_overview_company_null_unique 
ON public.resourcing_overview (company_id) 
WHERE meeting_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS service_user_document_analytics_company_null_unique 
ON public.service_user_document_analytics (company_id) 
WHERE meeting_id IS NULL;

-- For meeting-specific data (meeting_id is not null)
CREATE UNIQUE INDEX IF NOT EXISTS resourcing_overview_company_meeting_unique 
ON public.resourcing_overview (company_id, meeting_id) 
WHERE meeting_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS service_user_document_analytics_company_meeting_unique 
ON public.service_user_document_analytics (company_id, meeting_id) 
WHERE meeting_id IS NOT NULL;

-- Also fix the other analytics tables that might have the same issue
-- Check if feedback_analytics and incidents_analytics need similar fixes

-- For feedback_analytics
DROP INDEX IF EXISTS feedback_analytics_company_id_meeting_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS feedback_analytics_company_null_unique 
ON public.feedback_analytics (company_id) 
WHERE meeting_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS feedback_analytics_company_meeting_unique 
ON public.feedback_analytics (company_id, meeting_id) 
WHERE meeting_id IS NOT NULL;

-- For incidents_analytics  
DROP INDEX IF EXISTS incidents_analytics_company_id_meeting_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS incidents_analytics_company_null_unique 
ON public.incidents_analytics (company_id) 
WHERE meeting_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS incidents_analytics_company_meeting_unique 
ON public.incidents_analytics (company_id, meeting_id) 
WHERE meeting_id IS NOT NULL;

-- For supervision_analytics
DROP INDEX IF EXISTS supervision_analytics_company_id_meeting_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS supervision_analytics_company_null_unique 
ON public.supervision_analytics (company_id) 
WHERE meeting_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS supervision_analytics_company_meeting_unique 
ON public.supervision_analytics (company_id, meeting_id) 
WHERE meeting_id IS NOT NULL;

-- For spot_check_analytics
DROP INDEX IF EXISTS spot_check_analytics_company_id_meeting_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS spot_check_analytics_company_null_unique 
ON public.spot_check_analytics (company_id) 
WHERE meeting_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS spot_check_analytics_company_meeting_unique 
ON public.spot_check_analytics (company_id, meeting_id) 
WHERE meeting_id IS NOT NULL;