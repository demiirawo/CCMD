-- Create table to track meeting emails and follow-ups
CREATE TABLE IF NOT EXISTS public.meeting_email_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  meeting_date DATE NOT NULL,
  meeting_title TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  follow_up_scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  follow_up_sent_at TIMESTAMP WITH TIME ZONE,
  attendees JSONB NOT NULL DEFAULT '[]'::jsonb,
  dashboard_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_email_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for meeting_email_tracking
CREATE POLICY "Users can view their company's email tracking"
  ON public.meeting_email_tracking
  FOR SELECT
  USING (
    company_id = get_user_company_id()
    OR is_super_admin()
  );

CREATE POLICY "Users can insert email tracking for their company"
  ON public.meeting_email_tracking
  FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id()
    OR is_super_admin()
  );

CREATE POLICY "Users can update their company's email tracking"
  ON public.meeting_email_tracking
  FOR UPDATE
  USING (
    company_id = get_user_company_id()
    OR is_super_admin()
  );

-- Create index for efficient querying of scheduled follow-ups
CREATE INDEX idx_meeting_email_tracking_followup 
  ON public.meeting_email_tracking(follow_up_scheduled_for, follow_up_sent_at)
  WHERE follow_up_sent_at IS NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_meeting_email_tracking_updated_at
  BEFORE UPDATE ON public.meeting_email_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();