
-- Add ronaldirawo@gmail.com as a team member to Spring Fountain and create user_companies association
DO $$
DECLARE
  auth_user_id uuid;
  spring_fountain_id uuid;
  ronald_team_member_id uuid;
BEGIN
  -- Get the auth user ID for ronaldirawo@gmail.com
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = 'ronaldirawo@gmail.com';
  
  -- Get Spring Fountain company ID
  SELECT id INTO spring_fountain_id 
  FROM companies 
  WHERE name = 'Spring Fountain';
  
  IF auth_user_id IS NULL THEN
    RAISE NOTICE 'User ronaldirawo@gmail.com not found';
    RETURN;
  END IF;
  
  IF spring_fountain_id IS NULL THEN
    RAISE NOTICE 'Spring Fountain company not found';
    RETURN;
  END IF;

  -- Check if team member already exists
  SELECT id INTO ronald_team_member_id
  FROM team_members 
  WHERE email = 'ronaldirawo@gmail.com' AND company_id = spring_fountain_id;
  
  IF ronald_team_member_id IS NULL THEN
    -- Create team member record for Spring Fountain
    INSERT INTO team_members (company_id, name, email, permission)
    VALUES (spring_fountain_id, 'Ronald', 'ronaldirawo@gmail.com', 'edit')
    RETURNING id INTO ronald_team_member_id;
    
    RAISE NOTICE 'Created team member record for Ronald in Spring Fountain: %', ronald_team_member_id;
  ELSE
    RAISE NOTICE 'Team member already exists for Ronald in Spring Fountain: %', ronald_team_member_id;
  END IF;
  
  -- Create user_companies association
  INSERT INTO user_companies (user_id, team_member_id, company_id, is_active)
  VALUES (auth_user_id, ronald_team_member_id, spring_fountain_id, false)
  ON CONFLICT (user_id, team_member_id, company_id) DO UPDATE SET
    is_active = false; -- Don't make it active yet, let user choose
    
  RAISE NOTICE 'Created user_companies association for Spring Fountain';
  
  -- Show all companies Ronald now has access to
  RAISE NOTICE 'Ronald now has access to these companies:';
  FOR record IN 
    SELECT c.name, tm.permission, uc.is_active
    FROM user_companies uc
    JOIN companies c ON uc.company_id = c.id
    JOIN team_members tm ON uc.team_member_id = tm.id
    WHERE uc.user_id = auth_user_id
    ORDER BY c.name
  LOOP
    RAISE NOTICE 'Company: %, Permission: %, Active: %', record.name, record.permission, record.is_active;
  END LOOP;
  
END $$;
