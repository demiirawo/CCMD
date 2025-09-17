-- Fix super admin access issue
-- The current is_super_admin() function might not be working correctly

-- First, let's recreate the is_super_admin function with better error handling
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND LOWER(email) = 'demi.irawo@care-cuddle.co.uk'
  );
$function$;

-- Ensure super admin profile exists and is properly configured
DO $$
DECLARE
  super_admin_id uuid;
BEGIN
  -- Get the super admin user ID
  SELECT id INTO super_admin_id 
  FROM auth.users 
  WHERE LOWER(email) = 'demi.irawo@care-cuddle.co.uk';
  
  IF super_admin_id IS NOT NULL THEN
    -- Ensure profile exists with admin role
    INSERT INTO public.profiles (user_id, username, role)
    VALUES (
      super_admin_id,
      'Demi Irawo (Super Admin)',
      'admin'::user_role
    )
    ON CONFLICT (user_id) DO UPDATE SET
      username = EXCLUDED.username,
      role = EXCLUDED.role;
  END IF;
END $$;

-- Add a more permissive policy for super admin on all main tables
-- This ensures super admin can access data regardless of company context

-- Update companies policies
DROP POLICY IF EXISTS "Super admin can access all companies" ON public.companies;
CREATE POLICY "Super admin can access all companies"
ON public.companies
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Update meeting_headers policies  
DROP POLICY IF EXISTS "Super admin can access all meeting_headers" ON public.meeting_headers;
CREATE POLICY "Super admin can access all meeting_headers"
ON public.meeting_headers
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Update subsection_data policies
DROP POLICY IF EXISTS "Super admin can access all subsection_data" ON public.subsection_data;
CREATE POLICY "Super admin can access all subsection_data"
ON public.subsection_data
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Update actions_log policies
DROP POLICY IF EXISTS "Super admin can access all actions_log" ON public.actions_log;
CREATE POLICY "Super admin can access all actions_log"
ON public.actions_log
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Update key_documents policies
DROP POLICY IF EXISTS "Super admin can access all key_documents" ON public.key_documents;
CREATE POLICY "Super admin can access all key_documents"
ON public.key_documents
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());