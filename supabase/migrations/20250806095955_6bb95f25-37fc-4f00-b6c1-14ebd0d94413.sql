-- Add unique constraint to prevent duplicate emails within the same company
-- Since email can be null, we create a partial unique index that excludes null values
CREATE UNIQUE INDEX CONCURRENTLY idx_team_members_email_company_unique 
ON public.team_members (email, company_id) 
WHERE email IS NOT NULL;

-- Add a check constraint to ensure email is provided for team members
-- (email should not be null for active team members)
ALTER TABLE public.team_members 
ADD CONSTRAINT check_email_required 
CHECK (email IS NOT NULL AND email != '');