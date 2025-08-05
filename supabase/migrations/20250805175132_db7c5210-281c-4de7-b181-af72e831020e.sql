-- Fix the magic link signup to only run setup for NEW users, not existing ones
-- This prevents profile switching when adding team members

CREATE OR REPLACE FUNCTION public.handle_magic_link_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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

  -- For regular team members, only run setup on actual NEW signups
  -- Check if this is a real new signup (not an existing user being updated)
  IF NEW.created_at = NEW.updated_at THEN
    PERFORM public.ensure_user_setup_complete(NEW.email);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Also update ensure_user_setup_complete to be safer
-- Add a check to prevent modifying active profiles of users who are already logged in
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
  existing_profile_count INTEGER;
BEGIN
  -- Get the auth user ID
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', user_email;
  END IF;

  -- Check if user already has a complete profile setup
  SELECT COUNT(*) INTO existing_profile_count
  FROM public.profiles 
  WHERE user_id = auth_user_id AND company_id IS NOT NULL;

  -- If user already has a profile with company, don't modify it
  -- This prevents profile switching for existing users
  IF existing_profile_count > 0 THEN
    -- Still ensure user_companies entries exist, but don't change active status
    FOR team_member_record IN 
      SELECT tm.id, tm.company_id, tm.name, tm.permission 
      FROM public.team_members tm 
      WHERE tm.email = user_email
    LOOP
      INSERT INTO public.user_companies (user_id, team_member_id, company_id, is_active)
      VALUES (
        auth_user_id,
        team_member_record.id,
        team_member_record.company_id,
        false  -- Don't activate for existing users
      )
      ON CONFLICT (user_id, team_member_id, company_id) DO NOTHING;
    END LOOP;
    
    RETURN; -- Exit early for existing users
  END IF;

  -- For new users only: proceed with full setup
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