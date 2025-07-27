-- Fix security definer functions by setting search_path
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Update RLS policies for remaining analytics tables
-- Resourcing analytics
DROP POLICY IF EXISTS "Anyone can view resourcing analytics" ON public.resourcing_analytics;
DROP POLICY IF EXISTS "Anyone can create resourcing analytics" ON public.resourcing_analytics;
DROP POLICY IF EXISTS "Anyone can update resourcing analytics" ON public.resourcing_analytics;
DROP POLICY IF EXISTS "Anyone can delete resourcing analytics" ON public.resourcing_analytics;

CREATE POLICY "Users can view company resourcing analytics" 
ON public.resourcing_analytics 
FOR SELECT 
USING (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can create company resourcing analytics" 
ON public.resourcing_analytics 
FOR INSERT 
WITH CHECK (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can update company resourcing analytics" 
ON public.resourcing_analytics 
FOR UPDATE 
USING (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can delete company resourcing analytics" 
ON public.resourcing_analytics 
FOR DELETE 
USING (company_id = public.get_user_company_id() OR public.is_admin());

-- Spot check analytics
DROP POLICY IF EXISTS "Anyone can view spot check analytics" ON public.spot_check_analytics;
DROP POLICY IF EXISTS "Anyone can create spot check analytics" ON public.spot_check_analytics;
DROP POLICY IF EXISTS "Anyone can update spot check analytics" ON public.spot_check_analytics;
DROP POLICY IF EXISTS "Anyone can delete spot check analytics" ON public.spot_check_analytics;

CREATE POLICY "Users can view company spot check analytics" 
ON public.spot_check_analytics 
FOR SELECT 
USING (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can create company spot check analytics" 
ON public.spot_check_analytics 
FOR INSERT 
WITH CHECK (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can update company spot check analytics" 
ON public.spot_check_analytics 
FOR UPDATE 
USING (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can delete company spot check analytics" 
ON public.spot_check_analytics 
FOR DELETE 
USING (company_id = public.get_user_company_id() OR public.is_admin());

-- Staff documents analytics
DROP POLICY IF EXISTS "Anyone can view staff documents analytics" ON public.staff_documents_analytics;
DROP POLICY IF EXISTS "Anyone can create staff documents analytics" ON public.staff_documents_analytics;
DROP POLICY IF EXISTS "Anyone can update staff documents analytics" ON public.staff_documents_analytics;
DROP POLICY IF EXISTS "Anyone can delete staff documents analytics" ON public.staff_documents_analytics;

CREATE POLICY "Users can view company staff documents analytics" 
ON public.staff_documents_analytics 
FOR SELECT 
USING (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can create company staff documents analytics" 
ON public.staff_documents_analytics 
FOR INSERT 
WITH CHECK (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can update company staff documents analytics" 
ON public.staff_documents_analytics 
FOR UPDATE 
USING (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can delete company staff documents analytics" 
ON public.staff_documents_analytics 
FOR DELETE 
USING (company_id = public.get_user_company_id() OR public.is_admin());

-- Staff training analytics
DROP POLICY IF EXISTS "Anyone can view staff training analytics" ON public.staff_training_analytics;
DROP POLICY IF EXISTS "Anyone can create staff training analytics" ON public.staff_training_analytics;
DROP POLICY IF EXISTS "Anyone can update staff training analytics" ON public.staff_training_analytics;
DROP POLICY IF EXISTS "Anyone can delete staff training analytics" ON public.staff_training_analytics;

CREATE POLICY "Users can view company staff training analytics" 
ON public.staff_training_analytics 
FOR SELECT 
USING (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can create company staff training analytics" 
ON public.staff_training_analytics 
FOR INSERT 
WITH CHECK (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can update company staff training analytics" 
ON public.staff_training_analytics 
FOR UPDATE 
USING (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can delete company staff training analytics" 
ON public.staff_training_analytics 
FOR DELETE 
USING (company_id = public.get_user_company_id() OR public.is_admin());

-- Supervision analytics
DROP POLICY IF EXISTS "Anyone can view supervision analytics" ON public.supervision_analytics;
DROP POLICY IF EXISTS "Anyone can create supervision analytics" ON public.supervision_analytics;
DROP POLICY IF EXISTS "Anyone can update supervision analytics" ON public.supervision_analytics;
DROP POLICY IF EXISTS "Anyone can delete supervision analytics" ON public.supervision_analytics;

CREATE POLICY "Users can view company supervision analytics" 
ON public.supervision_analytics 
FOR SELECT 
USING (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can create company supervision analytics" 
ON public.supervision_analytics 
FOR INSERT 
WITH CHECK (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can update company supervision analytics" 
ON public.supervision_analytics 
FOR UPDATE 
USING (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can delete company supervision analytics" 
ON public.supervision_analytics 
FOR DELETE 
USING (company_id = public.get_user_company_id() OR public.is_admin());