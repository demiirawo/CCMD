-- Create analytics backup table for data recovery
CREATE TABLE public.analytics_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  meeting_id UUID,
  analytics_type TEXT NOT NULL,
  data_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'auto_backup',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analytics_backups ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics backups
CREATE POLICY "Users can create company analytics backups" 
ON public.analytics_backups 
FOR INSERT 
WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can view company analytics backups" 
ON public.analytics_backups 
FOR SELECT 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update company analytics backups" 
ON public.analytics_backups 
FOR UPDATE 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete company analytics backups" 
ON public.analytics_backups 
FOR DELETE 
USING ((company_id = get_user_company_id()) OR is_admin());

-- Create indexes for performance
CREATE INDEX idx_analytics_backups_company_meeting ON public.analytics_backups(company_id, meeting_id);
CREATE INDEX idx_analytics_backups_type_timestamp ON public.analytics_backups(analytics_type, timestamp);
CREATE INDEX idx_analytics_backups_source ON public.analytics_backups(source);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_analytics_backups_updated_at
BEFORE UPDATE ON public.analytics_backups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();