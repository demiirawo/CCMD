-- Remove the email required constraint to allow team members without email addresses
ALTER TABLE public.team_members 
DROP CONSTRAINT IF EXISTS check_email_required;