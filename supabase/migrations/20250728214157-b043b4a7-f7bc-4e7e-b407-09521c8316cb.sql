-- Create meeting_backups table for auto backup functionality
CREATE TABLE public.meeting_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  meeting_id UUID NOT NULL,
  backup_type TEXT NOT NULL DEFAULT 'auto',
  backup_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, meeting_id, backup_type)
);

-- Enable Row Level Security
ALTER TABLE public.meeting_backups ENABLE ROW LEVEL SECURITY;

-- Create policies for meeting backups
CREATE POLICY "Users can view company meeting backups" 
ON public.meeting_backups 
FOR SELECT 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can create company meeting backups" 
ON public.meeting_backups 
FOR INSERT 
WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update company meeting backups" 
ON public.meeting_backups 
FOR UPDATE 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete company meeting backups" 
ON public.meeting_backups 
FOR DELETE 
USING ((company_id = get_user_company_id()) OR is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_meeting_backups_updated_at
BEFORE UPDATE ON public.meeting_backups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();