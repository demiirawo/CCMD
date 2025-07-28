-- Fix the unique constraint on supervision_analytics table
-- Drop the existing unique constraint on meeting_id only
ALTER TABLE public.supervision_analytics DROP CONSTRAINT IF EXISTS supervision_analytics_meeting_id_key;

-- Add a proper composite unique constraint on meeting_id and company_id
ALTER TABLE public.supervision_analytics ADD CONSTRAINT supervision_analytics_meeting_id_company_id_key UNIQUE (meeting_id, company_id);

-- Do the same for spot_check_analytics to ensure consistency
ALTER TABLE public.spot_check_analytics DROP CONSTRAINT IF EXISTS spot_check_analytics_meeting_id_key;
ALTER TABLE public.spot_check_analytics ADD CONSTRAINT spot_check_analytics_meeting_id_company_id_key UNIQUE (meeting_id, company_id);