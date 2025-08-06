
-- First, create a function that returns all company IDs a user has access to
CREATE OR REPLACE FUNCTION public.get_user_accessible_company_ids()
 RETURNS uuid[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    CASE 
      WHEN is_super_admin() THEN 
        -- Super admin can see all companies
        ARRAY(SELECT id FROM public.companies)
      ELSE 
        -- Regular users can see companies they're linked to via user_companies
        ARRAY(SELECT company_id FROM public.user_companies WHERE user_id = auth.uid())
    END;
$function$;

-- Update the RLS policy to use this new function
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;

CREATE POLICY "Users can view accessible companies" ON public.companies
  FOR SELECT 
  USING (
    is_admin() OR 
    id = ANY(get_user_accessible_company_ids())
  );
