-- Create analytics tables that are missing from the database schema

-- Care Notes Analytics table
CREATE TABLE IF NOT EXISTS public.care_notes_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  monthly_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Medication Analytics table  
CREATE TABLE IF NOT EXISTS public.medication_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  monthly_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Incidents Analytics table
CREATE TABLE IF NOT EXISTS public.incidents_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  monthly_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Staff Training Analytics table
CREATE TABLE IF NOT EXISTS public.staff_training_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  training_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Staff Documents Analytics table
CREATE TABLE IF NOT EXISTS public.staff_documents_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  documents_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Feedback Analytics table
CREATE TABLE IF NOT EXISTS public.feedback_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  meeting_id UUID,
  monthly_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, meeting_id)
);

-- Supervision Analytics table
CREATE TABLE IF NOT EXISTS public.supervision_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  meeting_id UUID,
  monthly_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, meeting_id)
);

-- Spot Check Analytics table
CREATE TABLE IF NOT EXISTS public.spot_check_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  meeting_id UUID,
  monthly_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, meeting_id)
);

-- Care Plan Analytics table
CREATE TABLE IF NOT EXISTS public.care_plan_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  meeting_id UUID,
  monthly_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  frequencies JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, meeting_id)
);

-- Enable Row Level Security on all analytics tables
ALTER TABLE public.care_notes_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_training_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_documents_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervision_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spot_check_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_plan_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all analytics tables
CREATE POLICY "Users can view company analytics" ON public.care_notes_analytics
  FOR SELECT USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can create company analytics" ON public.care_notes_analytics
  FOR INSERT WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update company analytics" ON public.care_notes_analytics
  FOR UPDATE USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete company analytics" ON public.care_notes_analytics
  FOR DELETE USING ((company_id = get_user_company_id()) OR is_admin());

-- Repeat policies for all other analytics tables
CREATE POLICY "Users can view company analytics" ON public.medication_analytics
  FOR SELECT USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can create company analytics" ON public.medication_analytics
  FOR INSERT WITH CHECK ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can update company analytics" ON public.medication_analytics
  FOR UPDATE USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can delete company analytics" ON public.medication_analytics
  FOR DELETE USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can view company analytics" ON public.incidents_analytics
  FOR SELECT USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can create company analytics" ON public.incidents_analytics
  FOR INSERT WITH CHECK ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can update company analytics" ON public.incidents_analytics
  FOR UPDATE USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can delete company analytics" ON public.incidents_analytics
  FOR DELETE USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can view company analytics" ON public.staff_training_analytics
  FOR SELECT USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can create company analytics" ON public.staff_training_analytics
  FOR INSERT WITH CHECK ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can update company analytics" ON public.staff_training_analytics
  FOR UPDATE USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can delete company analytics" ON public.staff_training_analytics
  FOR DELETE USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can view company analytics" ON public.staff_documents_analytics
  FOR SELECT USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can create company analytics" ON public.staff_documents_analytics
  FOR INSERT WITH CHECK ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can update company analytics" ON public.staff_documents_analytics
  FOR UPDATE USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can delete company analytics" ON public.staff_documents_analytics
  FOR DELETE USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can view company analytics" ON public.feedback_analytics
  FOR SELECT USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can create company analytics" ON public.feedback_analytics
  FOR INSERT WITH CHECK ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can update company analytics" ON public.feedback_analytics
  FOR UPDATE USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can delete company analytics" ON public.feedback_analytics
  FOR DELETE USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can view company analytics" ON public.supervision_analytics
  FOR SELECT USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can create company analytics" ON public.supervision_analytics
  FOR INSERT WITH CHECK ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can update company analytics" ON public.supervision_analytics
  FOR UPDATE USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can delete company analytics" ON public.supervision_analytics
  FOR DELETE USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can view company analytics" ON public.spot_check_analytics
  FOR SELECT USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can create company analytics" ON public.spot_check_analytics
  FOR INSERT WITH CHECK ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can update company analytics" ON public.spot_check_analytics
  FOR UPDATE USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can delete company analytics" ON public.spot_check_analytics
  FOR DELETE USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can view company analytics" ON public.care_plan_analytics
  FOR SELECT USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can create company analytics" ON public.care_plan_analytics
  FOR INSERT WITH CHECK ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can update company analytics" ON public.care_plan_analytics
  FOR UPDATE USING ((company_id = get_user_company_id()) OR is_admin());
CREATE POLICY "Users can delete company analytics" ON public.care_plan_analytics
  FOR DELETE USING ((company_id = get_user_company_id()) OR is_admin());

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_care_notes_analytics_updated_at
  BEFORE UPDATE ON public.care_notes_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medication_analytics_updated_at
  BEFORE UPDATE ON public.medication_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incidents_analytics_updated_at
  BEFORE UPDATE ON public.incidents_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_training_analytics_updated_at
  BEFORE UPDATE ON public.staff_training_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_documents_analytics_updated_at
  BEFORE UPDATE ON public.staff_documents_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feedback_analytics_updated_at
  BEFORE UPDATE ON public.feedback_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supervision_analytics_updated_at
  BEFORE UPDATE ON public.supervision_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spot_check_analytics_updated_at
  BEFORE UPDATE ON public.spot_check_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_care_plan_analytics_updated_at
  BEFORE UPDATE ON public.care_plan_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();