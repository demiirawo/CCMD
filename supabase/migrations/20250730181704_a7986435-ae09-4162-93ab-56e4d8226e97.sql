-- Add a link between profiles and team_members
ALTER TABLE public.profiles 
ADD COLUMN team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL;

-- Create a junction table for users who belong to multiple companies
CREATE TABLE public.user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false, -- which company is currently active
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, team_member_id, company_id)
);

-- Enable RLS on user_companies table
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

-- Create policies for user_companies table
CREATE POLICY "Users can view their own companies" 
ON public.user_companies 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own active company" 
ON public.user_companies 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "System can create user company links" 
ON public.user_companies 
FOR INSERT 
WITH CHECK (true); -- This will be handled by triggers

-- Create trigger for updating user_companies updated_at
CREATE TRIGGER update_user_companies_updated_at
  BEFORE UPDATE ON public.user_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update the get_user_company_id function to return active company
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT company_id FROM public.user_companies 
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$;

-- Create function to get user permission from active company
CREATE OR REPLACE FUNCTION public.get_user_permission()
RETURNS user_permission
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT tm.permission FROM public.user_companies uc
  JOIN public.team_members tm ON uc.team_member_id = tm.id
  WHERE uc.user_id = auth.uid() AND uc.is_active = true
  LIMIT 1;
$$;

-- Update check_user_permission function to use the new permission system
CREATE OR REPLACE FUNCTION public.check_user_permission(required_permission public.user_permission)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    CASE 
      WHEN required_permission = 'read' THEN 
        get_user_permission() IN ('read', 'edit', 'company_admin')
      WHEN required_permission = 'edit' THEN 
        get_user_permission() IN ('edit', 'company_admin')
      WHEN required_permission = 'company_admin' THEN 
        get_user_permission() = 'company_admin'
      ELSE false
    END
    OR is_admin();
$$;

-- Create function to handle magic link sign up
CREATE OR REPLACE FUNCTION public.handle_magic_link_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  team_member_record RECORD;
  user_company_count INTEGER;
BEGIN
  -- Find all team members with this email across all companies
  FOR team_member_record IN 
    SELECT tm.id, tm.company_id, tm.name, tm.permission 
    FROM public.team_members tm 
    WHERE tm.email = NEW.email
  LOOP
    -- Create user_companies entry for each company this person belongs to
    INSERT INTO public.user_companies (user_id, team_member_id, company_id, is_active)
    VALUES (
      NEW.id,
      team_member_record.id,
      team_member_record.company_id,
      false -- We'll set one as active later
    )
    ON CONFLICT (user_id, team_member_id, company_id) DO NOTHING;
  END LOOP;

  -- Count how many companies this user belongs to
  SELECT COUNT(*) INTO user_company_count
  FROM public.user_companies 
  WHERE user_id = NEW.id;

  -- If user belongs to multiple companies, don't set any as active (they'll choose)
  -- If only one company, set it as active and create profile
  IF user_company_count = 1 THEN
    -- Set the single company as active
    UPDATE public.user_companies 
    SET is_active = true 
    WHERE user_id = NEW.id;
    
    -- Create profile with team member info
    SELECT tm.name, tm.permission, uc.team_member_id, uc.company_id 
    INTO team_member_record
    FROM public.user_companies uc
    JOIN public.team_members tm ON uc.team_member_id = tm.id
    WHERE uc.user_id = NEW.id;
    
    INSERT INTO public.profiles (user_id, username, permission, team_member_id, company_id)
    VALUES (
      NEW.id,
      team_member_record.name,
      team_member_record.permission,
      team_member_record.team_member_id,
      team_member_record.company_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_magic_link_signup();