-- Add admin users to all companies in user_companies table
-- This ensures admin users have access to all companies

INSERT INTO public.user_companies (user_id, company_id, is_active, team_member_id)
SELECT 
  p.user_id,
  c.id as company_id,
  false as is_active, -- We'll set one as active later
  NULL as team_member_id -- Admin users don't need team_member_id
FROM public.profiles p
CROSS JOIN public.companies c
WHERE p.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.user_id = p.user_id AND uc.company_id = c.id
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