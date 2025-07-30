-- Create a policy to allow reading team members for magic link authentication
-- This allows unauthenticated users to check if their email exists in team_members
CREATE POLICY "Allow checking team member emails for magic link authentication" 
ON public.team_members 
FOR SELECT 
TO anon
USING (true);