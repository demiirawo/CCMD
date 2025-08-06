
-- Check current state of ronaldirawo@gmail.com in the system
-- Get the current auth user
SELECT 
    'auth_user' as table_name,
    id::text as record_id,
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at
FROM auth.users 
WHERE email = 'ronaldirawo@gmail.com'

UNION ALL

-- Get profile data
SELECT 
    'profile' as table_name,
    p.id::text as record_id,
    p.username as email,
    p.company_id IS NOT NULL as email_confirmed,
    p.created_at
FROM profiles p
JOIN auth.users au ON p.user_id = au.id
WHERE au.email = 'ronaldirawo@gmail.com'

UNION ALL

-- Get user_companies data
SELECT 
    'user_companies' as table_name,
    uc.id::text as record_id,
    uc.is_active::text as email,
    uc.company_id IS NOT NULL as email_confirmed,
    uc.created_at
FROM user_companies uc
JOIN auth.users au ON uc.user_id = au.id
WHERE au.email = 'ronaldirawo@gmail.com'

UNION ALL

-- Get team_members data
SELECT 
    'team_members' as table_name,
    tm.id::text as record_id,
    tm.name as email,
    tm.company_id IS NOT NULL as email_confirmed,
    tm.created_at
FROM team_members tm
WHERE tm.email = 'ronaldirawo@gmail.com';

-- If there are team members but no user setup, manually trigger the setup
DO $$
DECLARE
    target_email text := 'ronaldirawo@gmail.com';
BEGIN
    -- Call the setup function to ensure user is properly configured
    PERFORM ensure_user_setup_complete(target_email);
    RAISE NOTICE 'User setup function called for %', target_email;
END $$;
