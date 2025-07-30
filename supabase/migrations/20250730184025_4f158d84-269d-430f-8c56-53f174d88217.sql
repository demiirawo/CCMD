-- Create function to check if user is the super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'demi.irawo@care-cuddle.co.uk'
  );
$$;

-- Update the is_admin function to include super admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR is_super_admin()
  );
$$;

-- Update get_user_company_id to work for super admin (they can access any company)
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN is_super_admin() THEN 
        -- For super admin, return the company_id from their profile (set when they select a company)
        (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
      ELSE 
        -- For regular users, use the active company from user_companies
        (SELECT company_id FROM public.user_companies 
         WHERE user_id = auth.uid() AND is_active = true
         LIMIT 1)
    END;
$$;

-- Update get_user_permission to give super admin company_admin permission
CREATE OR REPLACE FUNCTION public.get_user_permission()
RETURNS user_permission
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN is_super_admin() THEN 'company_admin'::user_permission
      ELSE (
        SELECT tm.permission FROM public.user_companies uc
        JOIN public.team_members tm ON uc.team_member_id = tm.id
        WHERE uc.user_id = auth.uid() AND uc.is_active = true
        LIMIT 1
      )
    END;
$$;

-- Update handle_magic_link_signup to automatically give super admin access
CREATE OR REPLACE FUNCTION public.handle_magic_link_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  team_member_record RECORD;
  user_company_count INTEGER;
BEGIN
  -- Check if this is the super admin
  IF NEW.email = 'demi.irawo@care-cuddle.co.uk' THEN
    -- Create admin profile immediately for super admin
    INSERT INTO public.profiles (user_id, username, role)
    VALUES (
      NEW.id,
      'Demi Irawo (Super Admin)',
      'admin'::user_role
    )
    ON CONFLICT (user_id) DO UPDATE SET
      username = EXCLUDED.username,
      role = EXCLUDED.role;
    
    RETURN NEW;
  END IF;

  -- Regular magic link signup process for team members
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

-- Create trigger for the magic link signup (if it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_magic_link_signup();