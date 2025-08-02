-- Create missing analytics tables for data persistence

-- Create resourcing_overview table for ResourcingOverview component
CREATE TABLE IF NOT EXISTS public.resourcing_overview (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  meeting_id UUID NULL,
  onboarding INTEGER NOT NULL DEFAULT 0,
  on_probation INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 0,
  required_staffing_level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, meeting_id)
);

-- Create service_user_document_analytics table for ServiceUserDocumentsAnalytics component
CREATE TABLE IF NOT EXISTS public.service_user_document_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  meeting_id UUID NULL,
  incomplete_documents INTEGER NOT NULL DEFAULT 0,
  total_service_users INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, meeting_id)
);

-- Enable RLS on new tables
ALTER TABLE public.resourcing_overview ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_user_document_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for resourcing_overview
CREATE POLICY "Users can create company resourcing overview" 
ON public.resourcing_overview 
FOR INSERT 
WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can view company resourcing overview" 
ON public.resourcing_overview 
FOR SELECT 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update company resourcing overview" 
ON public.resourcing_overview 
FOR UPDATE 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete company resourcing overview" 
ON public.resourcing_overview 
FOR DELETE 
USING ((company_id = get_user_company_id()) OR is_admin());

-- Create RLS policies for service_user_document_analytics
CREATE POLICY "Users can create company service user document analytics" 
ON public.service_user_document_analytics 
FOR INSERT 
WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can view company service user document analytics" 
ON public.service_user_document_analytics 
FOR SELECT 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update company service user document analytics" 
ON public.service_user_document_analytics 
FOR UPDATE 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete company service user document analytics" 
ON public.service_user_document_analytics 
FOR DELETE 
USING ((company_id = get_user_company_id()) OR is_admin());

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_resourcing_overview_updated_at
BEFORE UPDATE ON public.resourcing_overview
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_user_document_analytics_updated_at
BEFORE UPDATE ON public.service_user_document_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();