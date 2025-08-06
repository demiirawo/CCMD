
-- Fix user_companies association for ronaldirawo@gmail.com
DO $$
DECLARE
  auth_user_id uuid;
  team_member_record RECORD;
BEGIN
  -- Get the auth user ID for ronaldirawo@gmail.com
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = 'ronaldirawo@gmail.com';
  
  IF auth_user_id IS NULL THEN
    RAISE NOTICE 'User ronaldirawo@gmail.com not found in auth.users';
    RETURN;
  END IF;

  -- Check existing user_companies entries
  RAISE NOTICE 'Current user_companies entries for ronaldirawo@gmail.com:';
  FOR team_member_record IN 
    SELECT uc.id, uc.team_member_id, uc.company_id, uc.is_active, c.name as company_name
    FROM user_companies uc
    JOIN companies c ON uc.company_id = c.id
    WHERE uc.user_id = auth_user_id
  LOOP
    RAISE NOTICE 'User company: ID=%, TeamMember=%, Company=% (%), Active=%', 
      team_member_record.id, 
      team_member_record.team_member_id, 
      team_member_record.company_id,
      team_member_record.company_name,
      team_member_record.is_active;
  END LOOP;

  -- Check team_members entries for this email
  RAISE NOTICE 'Team member records for ronaldirawo@gmail.com:';
  FOR team_member_record IN 
    SELECT tm.id, tm.company_id, tm.name, tm.permission, c.name as company_name
    FROM team_members tm 
    JOIN companies c ON tm.company_id = c.id
    WHERE tm.email = 'ronaldirawo@gmail.com'
  LOOP
    RAISE NOTICE 'Team member: ID=%, Company=% (%), Name=%, Permission=%', 
      team_member_record.id,
      team_member_record.company_id,
      team_member_record.company_name,
      team_member_record.name,
      team_member_record.permission;
    
    -- Ensure user_companies entry exists for each team member record
    INSERT INTO user_companies (user_id, team_member_id, company_id, is_active)
    VALUES (
      auth_user_id,
      team_member_record.id,
      team_member_record.company_id,
      true  -- Set as active since user is trying to access
    )
    ON CONFLICT (user_id, team_member_id, company_id) DO UPDATE SET
      is_active = true;
    
    RAISE NOTICE 'Created/updated user_companies entry for team member %', team_member_record.id;
  END LOOP;

  -- Update profile with team member info if only one company
  IF (SELECT COUNT(*) FROM user_companies WHERE user_id = auth_user_id) = 1 THEN
    SELECT tm.name, tm.permission, uc.team_member_id, uc.company_id 
    INTO team_member_record
    FROM user_companies uc
    JOIN team_members tm ON uc.team_member_id = tm.id
    WHERE uc.user_id = auth_user_id AND uc.is_active = true;
    
    UPDATE profiles 
    SET 
      username = team_member_record.name,
      permission = team_member_record.permission,
      team_member_id = team_member_record.team_member_id,
      company_id = team_member_record.company_id,
      updated_at = now()
    WHERE user_id = auth_user_id;
    
    RAISE NOTICE 'Updated profile for single company association';
  END IF;

  RAISE NOTICE 'Fix completed for ronaldirawo@gmail.com';
END $$;
