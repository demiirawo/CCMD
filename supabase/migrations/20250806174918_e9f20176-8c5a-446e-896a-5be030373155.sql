
-- Check if the user actually exists in auth.users (they should based on the logs)
SELECT id, email, created_at, updated_at, email_confirmed_at, last_sign_in_at
FROM auth.users 
WHERE email = 'ronaldirawo@gmail.com';

-- Double-check the team member exists
SELECT tm.id, tm.name, tm.email, tm.permission, tm.company_id, c.name as company_name
FROM team_members tm
JOIN companies c ON tm.company_id = c.id
WHERE tm.email = 'ronaldirawo@gmail.com';

-- Let's see if there are any profiles created for this user
SELECT p.id, p.user_id, p.username, p.role, p.permission, p.company_id, p.team_member_id
FROM profiles p
JOIN auth.users au ON p.user_id = au.id
WHERE au.email = 'ronaldirawo@gmail.com';

-- Check user_companies table
SELECT uc.id, uc.user_id, uc.team_member_id, uc.company_id, uc.is_active
FROM user_companies uc
JOIN auth.users au ON uc.user_id = au.id
WHERE au.email = 'ronaldirawo@gmail.com';

-- Let's manually trigger the setup process if needed
SELECT public.ensure_user_setup_complete('ronaldirawo@gmail.com');
