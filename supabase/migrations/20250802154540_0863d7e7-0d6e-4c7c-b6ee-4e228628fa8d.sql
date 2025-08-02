-- Create the unique constraint properly for meeting_headers
-- First let's check if there are any duplicate records that would prevent the constraint
SELECT company_id, meeting_date, COUNT(*) as count
FROM meeting_headers 
GROUP BY company_id, meeting_date 
HAVING COUNT(*) > 1;

-- Now add the unique constraint
ALTER TABLE meeting_headers 
ADD CONSTRAINT meeting_headers_company_date_unique 
UNIQUE (company_id, meeting_date);