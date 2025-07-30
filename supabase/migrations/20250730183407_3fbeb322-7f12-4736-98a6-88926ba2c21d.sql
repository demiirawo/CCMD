-- Create team member entries for admin users in each company
-- This allows admin users to access all companies through the user_companies system

INSERT INTO public.team_members (name, email, permission, company_id)
SELECT 
  COALESCE(p.username, 'Admin User') as name,
  au.email,
  'company_admin'::user_permission as permission,
  c.id as company_id
FROM public.profiles p
JOIN auth.users au ON p.user_id = au.id
CROSS JOIN public.companies c
WHERE p.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.email = au.email AND tm.company_id = c.id
  );

-- Now add admin users to all companies in user_companies table
INSERT INTO public.user_companies (user_id, company_id, is_active, team_member_id)
SELECT 
  p.user_id,
  tm.company_id,
  false as is_active, -- We'll set one as active later
  tm.id as team_member_id
FROM public.profiles p
JOIN auth.users au ON p.user_id = au.id
JOIN public.team_members tm ON au.email = tm.email
WHERE p.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.user_id = p.user_id AND uc.company_id = tm.company_id
  );

-- For admin users, set the first company as active if none are active
UPDATE public.user_companies 
SET is_active = true 
WHERE user_id IN (
  SELECT p.user_id FROM public.profiles p WHERE p.role = 'admin'
) 
AND id IN (
  SELECT DISTINCT ON (user_id) id 
  FROM public.user_companies 
  WHERE user_id IN (
    SELECT p.user_id FROM public.profiles p WHERE p.role = 'admin'
  )
  ORDER BY user_id, created_at
)
AND NOT EXISTS (
  SELECT 1 FROM public.user_companies uc2 
  WHERE uc2.user_id = user_companies.user_id 
  AND uc2.is_active = true
);