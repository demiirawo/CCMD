-- Drop all existing analytics tables to rebuild with proper structure
DROP TABLE IF EXISTS feedback_analytics CASCADE;
DROP TABLE IF EXISTS incidents_analytics CASCADE;
DROP TABLE IF EXISTS medication_analytics CASCADE;
DROP TABLE IF EXISTS care_notes_analytics CASCADE;
DROP TABLE IF EXISTS care_plan_analytics CASCADE;
DROP TABLE IF EXISTS staff_training_analytics CASCADE;
DROP TABLE IF EXISTS staff_documents_analytics CASCADE;
DROP TABLE IF EXISTS supervision_analytics CASCADE;
DROP TABLE IF EXISTS spot_check_analytics CASCADE;
DROP TABLE IF EXISTS resourcing_analytics CASCADE;
DROP TABLE IF EXISTS meeting_backups CASCADE;

-- Create a centralized dashboard_data table for persistent storage
CREATE TABLE public.dashboard_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  meeting_id UUID,
  data_type TEXT NOT NULL,
  data_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, meeting_id, data_type)
);

-- Enable Row Level Security
ALTER TABLE public.dashboard_data ENABLE ROW LEVEL SECURITY;

-- Create policies for dashboard_data
CREATE POLICY "Users can view company dashboard data" 
ON public.dashboard_data 
FOR SELECT 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can create company dashboard data" 
ON public.dashboard_data 
FOR INSERT 
WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update company dashboard data" 
ON public.dashboard_data 
FOR UPDATE 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete company dashboard data" 
ON public.dashboard_data 
FOR DELETE 
USING ((company_id = get_user_company_id()) OR is_admin());

-- Create indexes for better performance
CREATE INDEX idx_dashboard_data_company_meeting ON public.dashboard_data(company_id, meeting_id);
CREATE INDEX idx_dashboard_data_type ON public.dashboard_data(data_type);

-- Create function to update timestamps
CREATE TRIGGER update_dashboard_data_updated_at
BEFORE UPDATE ON public.dashboard_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a meeting_sessions table to track unique meeting sessions
CREATE TABLE public.meeting_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_quarter TEXT NOT NULL,
  meeting_year INTEGER NOT NULL,
  title TEXT,
  purpose TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, session_id)
);

-- Enable Row Level Security
ALTER TABLE public.meeting_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for meeting_sessions
CREATE POLICY "Users can view company meeting sessions" 
ON public.meeting_sessions 
FOR SELECT 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can create company meeting sessions" 
ON public.meeting_sessions 
FOR INSERT 
WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update company meeting sessions" 
ON public.meeting_sessions 
FOR UPDATE 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete company meeting sessions" 
ON public.meeting_sessions 
FOR DELETE 
USING ((company_id = get_user_company_id()) OR is_admin());

-- Create indexes
CREATE INDEX idx_meeting_sessions_company ON public.meeting_sessions(company_id);
CREATE INDEX idx_meeting_sessions_date ON public.meeting_sessions(meeting_date);

-- Create trigger for timestamps
CREATE TRIGGER update_meeting_sessions_updated_at
BEFORE UPDATE ON public.meeting_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing actions_log to use session-based approach
ALTER TABLE public.actions_log ADD COLUMN IF NOT EXISTS session_id TEXT;
CREATE INDEX IF NOT EXISTS idx_actions_log_session ON public.actions_log(company_id, session_id);

-- Migrate existing key_documents to use session-based approach  
ALTER TABLE public.key_documents ADD COLUMN IF NOT EXISTS session_id TEXT;
CREATE INDEX IF NOT EXISTS idx_key_documents_session ON public.key_documents(company_id, session_id);

-- Migrate existing subsection_data to use session-based approach
ALTER TABLE public.subsection_data ADD COLUMN IF NOT EXISTS session_id TEXT;
CREATE INDEX IF NOT EXISTS idx_subsection_data_session ON public.subsection_data(company_id, session_id);