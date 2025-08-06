
-- Check recent auth events for ronaldirawo@gmail.com
SELECT id, email, created_at, updated_at, email_confirmed_at, last_sign_in_at, 
       raw_user_meta_data, email_change_confirm_status
FROM auth.users 
WHERE email = 'ronaldirawo@gmail.com'
ORDER BY created_at DESC;

-- Check if there are any team member records for this email
SELECT tm.id, tm.name, tm.email, tm.permission, c.name as company_name, c.id as company_id
FROM team_members tm
JOIN companies c ON tm.company_id = c.id
WHERE tm.email = 'ronaldirawo@gmail.com';

-- Check if any user_companies entries were created
SELECT uc.*, au.email, c.name as company_name
FROM user_companies uc
JOIN auth.users au ON uc.user_id = au.id
JOIN companies c ON uc.company_id = c.id
WHERE au.email = 'ronaldirawo@gmail.com';

-- Check profiles table for this user
SELECT p.*, au.email, c.name as company_name
FROM profiles p
JOIN auth.users au ON p.user_id = au.id
LEFT JOIN companies c ON p.company_id = c.id
WHERE au.email = 'ronaldirawo@gmail.com';

-- Check recent authentication logs (if any signup attempts were made)
SELECT email, created_at, email_confirmed_at, confirmation_sent_at
FROM auth.users 
WHERE email = 'ronaldirawo@gmail.com'
ORDER BY created_at DESC
LIMIT 5;
