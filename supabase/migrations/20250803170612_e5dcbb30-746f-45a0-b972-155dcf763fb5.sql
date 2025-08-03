-- Create meeting summaries table for persistent and resilient meeting summary data
CREATE TABLE public.meeting_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  summary_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Create unique constraint to prevent duplicates
  UNIQUE(company_id, meeting_date)
);

-- Enable Row Level Security
ALTER TABLE public.meeting_summaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meeting summaries
CREATE POLICY "Users can view their company meeting summaries" 
ON public.meeting_summaries 
FOR SELECT 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can create their company meeting summaries" 
ON public.meeting_summaries 
FOR INSERT 
WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update their company meeting summaries" 
ON public.meeting_summaries 
FOR UPDATE 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete their company meeting summaries" 
ON public.meeting_summaries 
FOR DELETE 
USING ((company_id = get_user_company_id()) OR is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_meeting_summaries_updated_at
  BEFORE UPDATE ON public.meeting_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_meeting_summaries_company_date 
ON public.meeting_summaries(company_id, meeting_date);