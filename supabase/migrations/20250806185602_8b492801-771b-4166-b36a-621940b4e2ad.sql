
-- First, let's get the auth user ID for ronaldirawo@gmail.com
-- Then create the missing user_companies records

-- Get the user ID (we'll need this)
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
        RAISE EXCEPTION 'User not found with email: ronaldirawo@gmail.com';
    END IF;
    
    -- Create user_companies records for each team_member record with this email
    FOR team_member_record IN 
        SELECT tm.id, tm.company_id, tm.name, tm.permission 
        FROM team_members tm 
        WHERE tm.email = 'ronaldirawo@gmail.com'
    LOOP
        -- Insert user_companies entry
        INSERT INTO user_companies (user_id, team_member_id, company_id, is_active)
        VALUES (
            auth_user_id,
            team_member_record.id,
            team_member_record.company_id,
            false
        )
        ON CONFLICT (user_id, team_member_id, company_id) DO NOTHING;
        
        RAISE NOTICE 'Created user_companies record for team_member: % (company: %)', 
            team_member_record.name, team_member_record.company_id;
    END LOOP;
    
    -- If user has only one company, make it active and create/update profile
    IF (SELECT COUNT(*) FROM user_companies WHERE user_id = auth_user_id) = 1 THEN
        -- Set the single company as active
        UPDATE user_companies 
        SET is_active = true 
        WHERE user_id = auth_user_id;
        
        -- Create or update profile
        INSERT INTO profiles (user_id, username, permission, team_member_id, company_id)
        SELECT 
            auth_user_id,
            tm.name,
            tm.permission,
            uc.team_member_id,
            uc.company_id
        FROM user_companies uc
        JOIN team_members tm ON uc.team_member_id = tm.id
        WHERE uc.user_id = auth_user_id AND uc.is_active = true
        ON CONFLICT (user_id) DO UPDATE SET
            username = EXCLUDED.username,
            permission = EXCLUDED.permission,
            team_member_id = EXCLUDED.team_member_id,
            company_id = EXCLUDED.company_id;
            
        RAISE NOTICE 'Set single company as active and updated profile';
    END IF;
    
    RAISE NOTICE 'Setup complete for user: ronaldirawo@gmail.com';
END $$;
