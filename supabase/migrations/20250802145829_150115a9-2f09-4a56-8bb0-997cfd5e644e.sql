-- Create missing analytics tables to ensure complete data persistence

-- Create care_plan_overview table (currently using dashboard_data)
CREATE TABLE IF NOT EXISTS public.care_plan_overview (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  meeting_id UUID NULL,
  high_risk INTEGER NOT NULL DEFAULT 0,
  medium_risk INTEGER NOT NULL DEFAULT 0,
  low_risk INTEGER NOT NULL DEFAULT 0,
  na_risk INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new table
ALTER TABLE public.care_plan_overview ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for care_plan_overview
CREATE POLICY "Users can create company care plan overview" 
ON public.care_plan_overview 
FOR INSERT 
WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can view company care plan overview" 
ON public.care_plan_overview 
FOR SELECT 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update company care plan overview" 
ON public.care_plan_overview 
FOR UPDATE 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete company care plan overview" 
ON public.care_plan_overview 
FOR DELETE 
USING ((company_id = get_user_company_id()) OR is_admin());

-- Create proper partial unique indexes for care_plan_overview
CREATE UNIQUE INDEX IF NOT EXISTS care_plan_overview_company_null_unique 
ON public.care_plan_overview (company_id) 
WHERE meeting_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS care_plan_overview_company_meeting_unique 
ON public.care_plan_overview (company_id, meeting_id) 
WHERE meeting_id IS NOT NULL;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_care_plan_overview_updated_at
BEFORE UPDATE ON public.care_plan_overview
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();