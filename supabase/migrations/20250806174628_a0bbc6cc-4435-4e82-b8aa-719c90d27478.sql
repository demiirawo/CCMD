
-- Get the company ID for Spiring Fountain (or similar names)
SELECT id, name, slug 
FROM companies 
WHERE name ILIKE '%spiring%' OR name ILIKE '%fountain%' OR name ILIKE '%spring%';

-- Check all team members for companies with 'spiring', 'fountain', or 'spring' in the name
SELECT tm.id, tm.name, tm.email, tm.permission, c.name as company_name, c.id as company_id
FROM team_members tm
JOIN companies c ON tm.company_id = c.id
WHERE c.name ILIKE '%spiring%' OR c.name ILIKE '%fountain%' OR c.name ILIKE '%spring%'
ORDER BY tm.email;

-- Check if ronaldirawo@gmail.com exists in auth.users and get their ID
SELECT id, email, created_at, email_confirmed_at
FROM auth.users 
WHERE email = 'ronaldirawo@gmail.com';

-- If the user exists, check their user_companies entries
SELECT uc.id, uc.is_active, c.name as company_name, tm.name as team_member_name, tm.permission, tm.email
FROM user_companies uc
JOIN companies c ON uc.company_id = c.id
JOIN team_members tm ON uc.team_member_id = tm.id
JOIN auth.users au ON uc.user_id = au.id
WHERE au.email = 'ronaldirawo@gmail.com';

-- Check their profile
SELECT p.*, c.name as company_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
JOIN auth.users au ON p.user_id = au.id
WHERE au.email = 'ronaldirawo@gmail.com';
