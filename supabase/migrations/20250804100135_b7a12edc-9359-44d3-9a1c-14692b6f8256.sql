-- Fix Hauwa's account first
UPDATE public.user_companies 
SET is_active = true 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'hauwa.habib@care-cuddle.co.uk')
AND team_member_id = 'd2b6bd9c-76c1-4dc1-bff8-2521dcdb4138';

-- Create profile for Hauwa
INSERT INTO public.profiles (user_id, username, permission, team_member_id, company_id)
SELECT 
  auth_users.id,
  tm.name,
  tm.permission,
  tm.id,
  tm.company_id
FROM auth.users auth_users
JOIN public.team_members tm ON tm.email = auth_users.email
WHERE auth_users.email = 'hauwa.habib@care-cuddle.co.uk'
AND tm.id = 'd2b6bd9c-76c1-4dc1-bff8-2521dcdb4138'
ON CONFLICT (user_id) DO UPDATE SET
  username = EXCLUDED.username,
  permission = EXCLUDED.permission,
  team_member_id = EXCLUDED.team_member_id,
  company_id = EXCLUDED.company_id;

-- Create a more robust function to ensure user setup is complete
CREATE OR REPLACE FUNCTION public.ensure_user_setup_complete(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  auth_user_id uuid;
  team_member_record RECORD;
  user_company_count INTEGER;
BEGIN
  -- Get the auth user ID
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', user_email;
  END IF;

  -- For each team member record with this email
  FOR team_member_record IN 
    SELECT tm.id, tm.company_id, tm.name, tm.permission 
    FROM public.team_members tm 
    WHERE tm.email = user_email
  LOOP
    -- Ensure user_companies entry exists
    INSERT INTO public.user_companies (user_id, team_member_id, company_id, is_active)
    VALUES (
      auth_user_id,
      team_member_record.id,
      team_member_record.company_id,
      false
    )
    ON CONFLICT (user_id, team_member_id, company_id) DO NOTHING;
  END LOOP;

  -- Count how many companies this user belongs to
  SELECT COUNT(*) INTO user_company_count
  FROM public.user_companies 
  WHERE user_id = auth_user_id;

  -- If user belongs to only one company, set it as active and create profile
  IF user_company_count = 1 THEN
    -- Set the single company as active
    UPDATE public.user_companies 
    SET is_active = true 
    WHERE user_id = auth_user_id;
    
    -- Create or update profile with team member info
    SELECT tm.name, tm.permission, uc.team_member_id, uc.company_id 
    INTO team_member_record
    FROM public.user_companies uc
    JOIN public.team_members tm ON uc.team_member_id = tm.id
    WHERE uc.user_id = auth_user_id AND uc.is_active = true;
    
    INSERT INTO public.profiles (user_id, username, permission, team_member_id, company_id)
    VALUES (
      auth_user_id,
      team_member_record.name,
      team_member_record.permission,
      team_member_record.team_member_id,
      team_member_record.company_id
    )
    ON CONFLICT (user_id) DO UPDATE SET
      username = EXCLUDED.username,
      permission = EXCLUDED.permission,
      team_member_id = EXCLUDED.team_member_id,
      company_id = EXCLUDED.company_id;
  END IF;
END;
$$;

-- Update the magic link signup function to use our new robust function
CREATE OR REPLACE FUNCTION public.handle_magic_link_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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

  -- For regular team members, use the robust setup function
  PERFORM public.ensure_user_setup_complete(NEW.email);
  
  RETURN NEW;
END;
$function$;