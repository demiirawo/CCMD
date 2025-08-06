
-- First, let's clean up and rebuild the user-company relationship structure

-- Drop existing tables that will be rebuilt
DROP TABLE IF EXISTS public.user_companies CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;

-- Create a new team_members table that serves as the source of truth
-- Each record represents a user's membership in a company
CREATE TABLE public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  display_name text NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  permission user_permission NOT NULL DEFAULT 'read',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Ensure one active membership per email per company
  UNIQUE(email, company_id)
);

-- Enable RLS on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for team_members
CREATE POLICY "Allow checking team member emails for authentication" 
  ON public.team_members 
  FOR SELECT 
  USING (true);

CREATE POLICY "Company admins can manage team members" 
  ON public.team_members 
  FOR ALL 
  USING (
    (company_id = get_user_company_id() AND check_user_permission('company_admin'::user_permission)) 
    OR is_admin()
  );

-- Create updated_at trigger for team_members
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update the profiles table to be simpler - it just tracks the user's current active company
-- Remove the team_member_id and permission columns as these will come from team_members
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS team_member_id,
  DROP COLUMN IF EXISTS permission;

-- Add a simple active_company_id to track which company the user is currently viewing
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS active_company_id uuid REFERENCES public.companies(id);

-- Update the database functions to work with the new structure
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    CASE 
      WHEN is_super_admin() THEN 
        -- For super admin, return the active company from their profile
        (SELECT active_company_id FROM public.profiles WHERE user_id = auth.uid())
      ELSE 
        -- For regular users, get the company they're currently active in
        (SELECT active_company_id FROM public.profiles WHERE user_id = auth.uid())
    END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_permission()
RETURNS user_permission
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    CASE 
      WHEN is_super_admin() THEN 'company_admin'::user_permission
      ELSE 
        COALESCE(
          (SELECT tm.permission 
           FROM public.team_members tm
           JOIN public.profiles p ON p.active_company_id = tm.company_id
           WHERE p.user_id = auth.uid() 
             AND tm.email = (SELECT email FROM auth.users WHERE id = auth.uid())
             AND tm.is_active = true
           LIMIT 1),
          'read'::user_permission
        )
    END;
$$;

-- Create a function to get user's companies based on their email
CREATE OR REPLACE FUNCTION public.get_user_companies(user_email text)
RETURNS TABLE(
  team_member_id uuid,
  company_id uuid,
  company_name text,
  company_slug text,
  company_logo_url text,
  company_theme_color text,
  display_name text,
  permission user_permission,
  is_active boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    tm.id as team_member_id,
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    c.logo_url as company_logo_url,
    c.theme_color as company_theme_color,
    tm.display_name,
    tm.permission,
    tm.is_active
  FROM public.team_members tm
  JOIN public.companies c ON tm.company_id = c.id
  WHERE tm.email = user_email AND tm.is_active = true
  ORDER BY c.name;
$$;

-- Update the user setup function to work with the new structure
CREATE OR REPLACE FUNCTION public.ensure_user_setup_complete(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  auth_user_id uuid;
  team_member_record RECORD;
  company_count INTEGER;
  first_company_id uuid;
BEGIN
  -- Get the auth user ID
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', user_email;
  END IF;

  -- Count how many companies this user belongs to
  SELECT COUNT(*), MIN(company_id) 
  INTO company_count, first_company_id
  FROM public.team_members 
  WHERE email = user_email AND is_active = true;

  -- If user belongs to companies, ensure they have a profile
  IF company_count > 0 THEN
    -- Create or update profile
    INSERT INTO public.profiles (user_id, username, active_company_id)
    VALUES (
      auth_user_id,
      (SELECT display_name FROM public.team_members WHERE email = user_email LIMIT 1),
      CASE WHEN company_count = 1 THEN first_company_id ELSE NULL END
    )
    ON CONFLICT (user_id) DO UPDATE SET
      username = COALESCE(EXCLUDED.username, profiles.username),
      active_company_id = CASE 
        WHEN company_count = 1 THEN first_company_id 
        ELSE profiles.active_company_id 
      END;
  END IF;
END;
$$;
