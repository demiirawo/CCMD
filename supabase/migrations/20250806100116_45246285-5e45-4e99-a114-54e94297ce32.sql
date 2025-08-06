-- First, identify and remove duplicate team members
-- Keep only the most recent entry for each email/company combination
DELETE FROM public.team_members 
WHERE id NOT IN (
  SELECT DISTINCT ON (email, company_id) id
  FROM public.team_members
  WHERE email IS NOT NULL
  ORDER BY email, company_id, created_at DESC
);

-- Now add the unique constraint to prevent duplicate emails within the same company
CREATE UNIQUE INDEX idx_team_members_email_company_unique 
ON public.team_members (email, company_id) 
WHERE email IS NOT NULL;

-- Add a check constraint to ensure email is provided for team members
ALTER TABLE public.team_members 
ADD CONSTRAINT check_email_required 
CHECK (email IS NOT NULL AND email != '');