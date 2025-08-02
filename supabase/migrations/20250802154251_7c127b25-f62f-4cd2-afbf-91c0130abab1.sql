-- Check current constraints on incidents_analytics table
SELECT constraint_name, constraint_type, column_name 
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'incidents_analytics';

-- Add proper unique constraints for incidents_analytics
ALTER TABLE incidents_analytics DROP CONSTRAINT IF EXISTS incidents_analytics_company_id_key;
ALTER TABLE incidents_analytics DROP CONSTRAINT IF EXISTS incidents_analytics_company_meeting_unique;

-- For company-wide data (meeting_id is null)
CREATE UNIQUE INDEX IF NOT EXISTS incidents_analytics_company_only_unique 
ON incidents_analytics (company_id) 
WHERE meeting_id IS NULL;

-- For meeting-specific data
CREATE UNIQUE INDEX IF NOT EXISTS incidents_analytics_company_meeting_unique 
ON incidents_analytics (company_id, meeting_id) 
WHERE meeting_id IS NOT NULL;