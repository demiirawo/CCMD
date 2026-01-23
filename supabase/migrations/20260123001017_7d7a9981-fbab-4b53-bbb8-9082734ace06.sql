-- Create table to store utilisation forecast overrides
CREATE TABLE public.utilisation_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  week text NOT NULL,
  required numeric,
  allocated numeric,
  unallocated numeric,
  available_staff_hours numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, week)
);

-- Enable RLS
ALTER TABLE public.utilisation_overrides ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company overrides"
ON public.utilisation_overrides
FOR SELECT
USING (company_id = get_user_company_id() OR is_admin());

CREATE POLICY "Users can create their company overrides"
ON public.utilisation_overrides
FOR INSERT
WITH CHECK (company_id = get_user_company_id() OR is_admin());

CREATE POLICY "Users can update their company overrides"
ON public.utilisation_overrides
FOR UPDATE
USING (company_id = get_user_company_id() OR is_admin());

CREATE POLICY "Users can delete their company overrides"
ON public.utilisation_overrides
FOR DELETE
USING (company_id = get_user_company_id() OR is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_utilisation_overrides_updated_at
  BEFORE UPDATE ON public.utilisation_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();