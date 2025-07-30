-- Create table for storing quarterly reports
CREATE TABLE public.quarterly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  quarter TEXT NOT NULL,
  year INTEGER NOT NULL,
  report_content TEXT NOT NULL,
  analytics_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, quarter, year)
);

-- Enable Row Level Security
ALTER TABLE public.quarterly_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their company reports" 
ON public.quarterly_reports 
FOR SELECT 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can create their company reports" 
ON public.quarterly_reports 
FOR INSERT 
WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update their company reports" 
ON public.quarterly_reports 
FOR UPDATE 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete their company reports" 
ON public.quarterly_reports 
FOR DELETE 
USING ((company_id = get_user_company_id()) OR is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_quarterly_reports_updated_at
BEFORE UPDATE ON public.quarterly_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();