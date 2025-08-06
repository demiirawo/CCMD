
-- First, let's see if the user actually exists in auth.users
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'ronaldirawo@gmail.com';

-- Then let's manually trigger the setup process
SELECT public.ensure_user_setup_complete('ronaldirawo@gmail.com');

-- Check if the team member exists
SELECT tm.id, tm.name, tm.email, tm.permission, tm.company_id, c.name as company_name
FROM team_members tm
JOIN companies c ON tm.company_id = c.id
WHERE tm.email = 'ronaldirawo@gmail.com';

-- After running the setup, check if user_companies was created
SELECT uc.id, uc.user_id, uc.team_member_id, uc.company_id, uc.is_active, c.name as company_name
FROM user_companies uc
JOIN companies c ON uc.company_id = c.id
JOIN auth.users au ON uc.user_id = au.id
WHERE au.email = 'ronaldirawo@gmail.com';

-- Check if profile was created
SELECT p.id, p.username, p.role, p.permission, p.company_id, p.team_member_id, c.name as company_name
FROM profiles p
JOIN auth.users au ON p.user_id = au.id
LEFT JOIN companies c ON p.company_id = c.id
WHERE au.email = 'ronaldirawo@gmail.com';
