
-- Check what's in the database for ronaldirawo@gmail.com
-- First, get the user ID
SELECT id, email FROM auth.users WHERE email = 'ronaldirawo@gmail.com';

-- Check team_members records
SELECT tm.id, tm.name, tm.email, tm.company_id, c.name as company_name 
FROM team_members tm
JOIN companies c ON tm.company_id = c.id
WHERE tm.email = 'ronaldirawo@gmail.com';

-- Check user_companies records (assuming we have the user_id)
SELECT uc.*, tm.name, tm.email, c.name as company_name
FROM user_companies uc
JOIN team_members tm ON uc.team_member_id = tm.id
JOIN companies c ON uc.company_id = c.id
WHERE uc.user_id IN (SELECT id FROM auth.users WHERE email = 'ronaldirawo@gmail.com');

-- Check profiles
SELECT p.*, c.name as company_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.user_id IN (SELECT id FROM auth.users WHERE email = 'ronaldirawo@gmail.com');
