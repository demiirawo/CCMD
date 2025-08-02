-- Fix meeting_headers table constraint for proper upsert operations
-- First, let's check and update the unique constraint to be properly named

-- Drop existing constraint if it exists
ALTER TABLE meeting_headers DROP CONSTRAINT IF EXISTS meeting_headers_company_date_unique;

-- Create a proper unique constraint that can be used with ON CONFLICT
ALTER TABLE meeting_headers ADD CONSTRAINT meeting_headers_company_date_unique 
UNIQUE (company_id, meeting_date);

-- Also ensure we have proper indexing
CREATE INDEX IF NOT EXISTS idx_meeting_headers_company_date ON meeting_headers (company_id, meeting_date);