-- Create table for matching staff per company
CREATE TABLE public.matching_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT 'Prefer not to say',
  contract_type TEXT NOT NULL DEFAULT 'Full-Time Contract',
  status TEXT NOT NULL DEFAULT 'Active',
  typical_weekly_hours NUMERIC NOT NULL DEFAULT 40,
  forecast_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for matching service users per company
CREATE TABLE public.matching_service_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  gender_preference TEXT NOT NULL DEFAULT 'No Preference',
  support_needs JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferences JSONB NOT NULL DEFAULT '[]'::jsonb,
  typical_weekly_hours NUMERIC NOT NULL DEFAULT 0,
  forecast_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  primary_staff_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  backup_staff_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  staff_allocations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.matching_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_service_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for matching_staff
CREATE POLICY "Users can view their company matching staff"
  ON public.matching_staff FOR SELECT
  USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can create matching staff for their company"
  ON public.matching_staff FOR INSERT
  WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update their company matching staff"
  ON public.matching_staff FOR UPDATE
  USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete their company matching staff"
  ON public.matching_staff FOR DELETE
  USING ((company_id = get_user_company_id()) OR is_admin());

-- RLS policies for matching_service_users
CREATE POLICY "Users can view their company matching service users"
  ON public.matching_service_users FOR SELECT
  USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can create matching service users for their company"
  ON public.matching_service_users FOR INSERT
  WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update their company matching service users"
  ON public.matching_service_users FOR UPDATE
  USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete their company matching service users"
  ON public.matching_service_users FOR DELETE
  USING ((company_id = get_user_company_id()) OR is_admin());

-- Add triggers for updated_at
CREATE TRIGGER update_matching_staff_updated_at
  BEFORE UPDATE ON public.matching_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matching_service_users_updated_at
  BEFORE UPDATE ON public.matching_service_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();