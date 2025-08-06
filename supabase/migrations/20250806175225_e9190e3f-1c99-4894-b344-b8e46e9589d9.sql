
-- Check for any orphaned data or inconsistencies for ronaldirawo@gmail.com
-- First, let's see what's in the auth.users table
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'ronaldirawo@gmail.com';

-- Check for orphaned profiles (profiles without matching auth users)
SELECT 
    p.id,
    p.user_id,
    p.username,
    p.role,
    p.company_id,
    'orphaned_profile' as issue_type
FROM profiles p
LEFT JOIN auth.users au ON p.user_id = au.id
WHERE au.id IS NULL;

-- Check for orphaned user_companies entries
SELECT 
    uc.id,
    uc.user_id,
    uc.team_member_id,
    uc.company_id,
    uc.is_active,
    'orphaned_user_companies' as issue_type
FROM user_companies uc
LEFT JOIN auth.users au ON uc.user_id = au.id
WHERE au.id IS NULL;

-- Check for team members with ronaldirawo@gmail.com email
SELECT 
    tm.id,
    tm.name,
    tm.email,
    tm.permission,
    tm.company_id,
    c.name as company_name
FROM team_members tm
LEFT JOIN companies c ON tm.company_id = c.id
WHERE tm.email = 'ronaldirawo@gmail.com';

-- Check if there are multiple team_member records for the same email
SELECT 
    email,
    COUNT(*) as count,
    array_agg(id) as team_member_ids,
    array_agg(company_id) as company_ids
FROM team_members 
WHERE email = 'ronaldirawo@gmail.com'
GROUP BY email
HAVING COUNT(*) > 1;
