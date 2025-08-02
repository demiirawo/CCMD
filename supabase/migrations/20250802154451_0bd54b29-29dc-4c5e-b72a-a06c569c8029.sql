-- Create the proper unique constraint for meeting_headers
ALTER TABLE meeting_headers 
ADD CONSTRAINT meeting_headers_company_date_unique 
UNIQUE (company_id, meeting_date);