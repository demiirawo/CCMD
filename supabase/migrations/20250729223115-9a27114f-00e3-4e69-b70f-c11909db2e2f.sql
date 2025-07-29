-- Check if the get_user_company_id function works correctly
-- Let's update the RLS policies for meetings to be more explicit

-- Drop existing policies for meetings table
DROP POLICY IF EXISTS "Users can view company meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can create company meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can update company meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can delete company meetings" ON public.meetings;

-- Recreate policies with more explicit conditions
CREATE POLICY "Users can view company meetings" 
ON public.meetings 
FOR SELECT 
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can create company meetings" 
ON public.meetings 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can update company meetings" 
ON public.meetings 
FOR UPDATE 
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can delete company meetings" 
ON public.meetings 
FOR DELETE 
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);