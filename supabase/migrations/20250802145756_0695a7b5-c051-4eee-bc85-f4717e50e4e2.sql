-- Fix meeting_headers table constraint issue
-- The constraint "meeting_headers_company_unique" is causing duplicate key violations

-- First, let's see what constraint exists and fix it
-- Drop the problematic constraint that doesn't handle meeting-specific vs company-wide data properly
ALTER TABLE public.meeting_headers DROP CONSTRAINT IF EXISTS meeting_headers_company_unique;

-- Create proper partial unique indexes like we did for analytics tables
-- For company-wide meeting headers (meeting_id is null)
CREATE UNIQUE INDEX IF NOT EXISTS meeting_headers_company_null_unique 
ON public.meeting_headers (company_id) 
WHERE meeting_date IS NULL;

-- For date-specific meeting headers
CREATE UNIQUE INDEX IF NOT EXISTS meeting_headers_company_date_unique 
ON public.meeting_headers (company_id, meeting_date) 
WHERE meeting_date IS NOT NULL;