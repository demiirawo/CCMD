CREATE OR REPLACE FUNCTION public.ensure_user_setup_complete(user_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  auth_user_id uuid;
  team_member_record RECORD;
  user_company_count INTEGER;
  existing_profile_count INTEGER;
  normalized_email text;
BEGIN
  -- Normalize email to lowercase for consistent matching
  normalized_email := LOWER(user_email);
  
  -- Get the auth user ID with case-insensitive matching
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE LOWER(email) = normalized_email;
  
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
      WHERE LOWER(tm.email) = normalized_email
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
  -- For each team member record with this email (case-insensitive)
  FOR team_member_record IN 
    SELECT tm.id, tm.company_id, tm.name, tm.permission 
    FROM public.team_members tm 
    WHERE LOWER(tm.email) = normalized_email
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
$function$