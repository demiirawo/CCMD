-- Create feedback analytics table for persistent data storage
CREATE TABLE public.feedback_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID,
  company_id UUID,
  monthly_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feedback_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company-based access
CREATE POLICY "Users can view company feedback analytics" 
ON public.feedback_analytics 
FOR SELECT 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can create company feedback analytics" 
ON public.feedback_analytics 
FOR INSERT 
WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update company feedback analytics" 
ON public.feedback_analytics 
FOR UPDATE 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete company feedback analytics" 
ON public.feedback_analytics 
FOR DELETE 
USING ((company_id = get_user_company_id()) OR is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_feedback_analytics_updated_at
BEFORE UPDATE ON public.feedback_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();