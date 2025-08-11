-- Restrict admin to Super Admin only and align meetings RLS with company-based access

-- 1) Make is_admin() return only Super Admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT is_super_admin();
$function$;

-- 2) Update meetings RLS policies to use company scope or super admin
DROP POLICY IF EXISTS "Users can create company meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can delete company meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can update company meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can view company meetings" ON public.meetings;

CREATE POLICY "Users can create company meetings"
ON public.meetings
FOR INSERT
WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete company meetings"
ON public.meetings
FOR DELETE
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update company meetings"
ON public.meetings
FOR UPDATE
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can view company meetings"
ON public.meetings
FOR SELECT
USING ((company_id = get_user_company_id()) OR is_admin());