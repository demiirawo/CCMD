
-- First, let's check if the user exists in auth.users
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'ronaldirawo@gmail.com';

-- Check if there's a team member record for this email
SELECT tm.*, c.name as company_name 
FROM team_members tm
JOIN companies c ON tm.company_id = c.id
WHERE tm.email = 'ronaldirawo@gmail.com';

-- Check user_companies entries for this user
SELECT uc.*, c.name as company_name, tm.name as team_member_name, tm.permission
FROM user_companies uc
JOIN companies c ON uc.company_id = c.id
JOIN team_members tm ON uc.team_member_id = tm.id
WHERE uc.user_id IN (SELECT id FROM auth.users WHERE email = 'ronaldirawo@gmail.com');

-- Check the user's profile
SELECT p.*, c.name as company_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.user_id IN (SELECT id FROM auth.users WHERE email = 'ronaldirawo@gmail.com');

-- Check if Spiring Fountain company exists
SELECT id, name, created_at 
FROM companies 
WHERE name ILIKE '%spiring%' OR name ILIKE '%fountain%';
