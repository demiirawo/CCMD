-- Add missing UPDATE policy for companies table
-- Users should be able to update their own company
CREATE POLICY "Users can update their company" 
ON public.companies 
FOR UPDATE 
USING (id = get_user_company_id());

-- Also allow admins to update any company
CREATE POLICY "Admins can update companies" 
ON public.companies 
FOR UPDATE 
USING (is_admin());