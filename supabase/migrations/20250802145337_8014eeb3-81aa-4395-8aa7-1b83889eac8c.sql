-- Fix unique constraints to properly handle null meeting_id values
-- Drop existing constraints properly

-- Drop constraints from new tables
ALTER TABLE public.resourcing_overview DROP CONSTRAINT IF EXISTS resourcing_overview_company_id_meeting_id_key;
ALTER TABLE public.service_user_document_analytics DROP CONSTRAINT IF EXISTS service_user_document_analytics_company_id_meeting_id_key;

-- Drop constraints from existing analytics tables 
ALTER TABLE public.feedback_analytics DROP CONSTRAINT IF EXISTS feedback_analytics_company_id_meeting_id_key;
ALTER TABLE public.incidents_analytics DROP CONSTRAINT IF EXISTS incidents_analytics_company_id_meeting_id_key;
ALTER TABLE public.supervision_analytics DROP CONSTRAINT IF EXISTS supervision_analytics_company_id_meeting_id_key;
ALTER TABLE public.spot_check_analytics DROP CONSTRAINT IF EXISTS spot_check_analytics_company_id_meeting_id_key;

-- Create partial unique indexes that handle null meeting_id properly
-- For resourcing_overview
CREATE UNIQUE INDEX IF NOT EXISTS resourcing_overview_company_null_unique 
ON public.resourcing_overview (company_id) 
WHERE meeting_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS resourcing_overview_company_meeting_unique 
ON public.resourcing_overview (company_id, meeting_id) 
WHERE meeting_id IS NOT NULL;

-- For service_user_document_analytics
CREATE UNIQUE INDEX IF NOT EXISTS service_user_document_analytics_company_null_unique 
ON public.service_user_document_analytics (company_id) 
WHERE meeting_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS service_user_document_analytics_company_meeting_unique 
ON public.service_user_document_analytics (company_id, meeting_id) 
WHERE meeting_id IS NOT NULL;

-- For feedback_analytics
CREATE UNIQUE INDEX IF NOT EXISTS feedback_analytics_company_null_unique 
ON public.feedback_analytics (company_id) 
WHERE meeting_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS feedback_analytics_company_meeting_unique 
ON public.feedback_analytics (company_id, meeting_id) 
WHERE meeting_id IS NOT NULL;

-- For incidents_analytics  
CREATE UNIQUE INDEX IF NOT EXISTS incidents_analytics_company_null_unique 
ON public.incidents_analytics (company_id) 
WHERE meeting_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS incidents_analytics_company_meeting_unique 
ON public.incidents_analytics (company_id, meeting_id) 
WHERE meeting_id IS NOT NULL;

-- For supervision_analytics
CREATE UNIQUE INDEX IF NOT EXISTS supervision_analytics_company_null_unique 
ON public.supervision_analytics (company_id) 
WHERE meeting_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS supervision_analytics_company_meeting_unique 
ON public.supervision_analytics (company_id, meeting_id) 
WHERE meeting_id IS NOT NULL;

-- For spot_check_analytics
CREATE UNIQUE INDEX IF NOT EXISTS spot_check_analytics_company_null_unique 
ON public.spot_check_analytics (company_id) 
WHERE meeting_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS spot_check_analytics_company_meeting_unique 
ON public.spot_check_analytics (company_id, meeting_id) 
WHERE meeting_id IS NOT NULL;