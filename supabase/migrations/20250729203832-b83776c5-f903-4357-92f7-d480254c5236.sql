-- Add meeting_id column to incidents_analytics table
ALTER TABLE public.incidents_analytics ADD COLUMN meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE;

-- Create a unique constraint for company_id and meeting_id (with meeting_id nullable)
CREATE UNIQUE INDEX incidents_analytics_company_meeting_unique 
ON public.incidents_analytics (company_id, COALESCE(meeting_id, '00000000-0000-0000-0000-000000000000'::uuid));