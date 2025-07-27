-- Create medication analytics table
CREATE TABLE public.medication_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID,
  company_id UUID,
  monthly_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create care notes analytics table
CREATE TABLE public.care_notes_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID,
  company_id UUID,
  monthly_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create incidents analytics table
CREATE TABLE public.incidents_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID,
  company_id UUID,
  monthly_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for all new tables
ALTER TABLE public.medication_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_notes_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for medication analytics
CREATE POLICY "Users can view company medication analytics" ON public.medication_analytics FOR SELECT USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can create company medication analytics" ON public.medication_analytics FOR INSERT WITH CHECK ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can update company medication analytics" ON public.medication_analytics FOR UPDATE USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can delete company medication analytics" ON public.medication_analytics FOR DELETE USING ((company_id = get_user_company_id()) OR is_admin());

-- Create RLS policies for care notes analytics
CREATE POLICY "Users can view company care notes analytics" ON public.care_notes_analytics FOR SELECT USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can create company care notes analytics" ON public.care_notes_analytics FOR INSERT WITH CHECK ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can update company care notes analytics" ON public.care_notes_analytics FOR UPDATE USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can delete company care notes analytics" ON public.care_notes_analytics FOR DELETE USING ((company_id = get_user_company_id()) OR is_admin());

-- Create RLS policies for incidents analytics
CREATE POLICY "Users can view company incidents analytics" ON public.incidents_analytics FOR SELECT USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can create company incidents analytics" ON public.incidents_analytics FOR INSERT WITH CHECK ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can update company incidents analytics" ON public.incidents_analytics FOR UPDATE USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can delete company incidents analytics" ON public.incidents_analytics FOR DELETE USING ((company_id = get_user_company_id()) OR is_admin());

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_medication_analytics_updated_at BEFORE UPDATE ON public.medication_analytics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_care_notes_analytics_updated_at BEFORE UPDATE ON public.care_notes_analytics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_incidents_analytics_updated_at BEFORE UPDATE ON public.incidents_analytics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();