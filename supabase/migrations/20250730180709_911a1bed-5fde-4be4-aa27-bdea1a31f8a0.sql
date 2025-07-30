-- Create enum for user permissions
CREATE TYPE public.user_permission AS ENUM ('read', 'edit', 'company_admin');

-- Add permission column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN permission public.user_permission NOT NULL DEFAULT 'read';

-- Create a table to store team members for companies
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  permission public.user_permission NOT NULL DEFAULT 'read',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_team_members_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Enable RLS on team_members table
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for team_members table
CREATE POLICY "Users can view their company team members" 
ON public.team_members 
FOR SELECT 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Company admins can create team members" 
ON public.team_members 
FOR INSERT 
WITH CHECK (
  (company_id = get_user_company_id() AND 
   (SELECT permission FROM public.profiles WHERE user_id = auth.uid()) = 'company_admin') 
  OR is_admin()
);

CREATE POLICY "Company admins can update team members" 
ON public.team_members 
FOR UPDATE 
USING (
  (company_id = get_user_company_id() AND 
   (SELECT permission FROM public.profiles WHERE user_id = auth.uid()) = 'company_admin') 
  OR is_admin()
);

CREATE POLICY "Company admins can delete team members" 
ON public.team_members 
FOR DELETE 
USING (
  (company_id = get_user_company_id() AND 
   (SELECT permission FROM public.profiles WHERE user_id = auth.uid()) = 'company_admin') 
  OR is_admin()
);

-- Create trigger for updating team_members updated_at
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing admin users to have company_admin permission
UPDATE public.profiles 
SET permission = 'company_admin' 
WHERE role = 'admin';

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION public.check_user_permission(required_permission public.user_permission)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    CASE 
      WHEN required_permission = 'read' THEN 
        (SELECT permission FROM public.profiles WHERE user_id = auth.uid()) IN ('read', 'edit', 'company_admin')
      WHEN required_permission = 'edit' THEN 
        (SELECT permission FROM public.profiles WHERE user_id = auth.uid()) IN ('edit', 'company_admin')
      WHEN required_permission = 'company_admin' THEN 
        (SELECT permission FROM public.profiles WHERE user_id = auth.uid()) = 'company_admin'
      ELSE false
    END
    OR is_admin();
$$;