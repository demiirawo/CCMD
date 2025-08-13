-- Create enhanced backup tables for data loss prevention
CREATE TABLE IF NOT EXISTS public.meeting_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  meeting_id TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('auto', 'manual', 'checkpoint')),
  data_type TEXT NOT NULL CHECK (data_type IN ('dashboard_data', 'actions_log', 'key_documents', 'full_meeting')),
  backup_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create audit trail table for tracking save/load operations
CREATE TABLE IF NOT EXISTS public.data_audit_trail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  meeting_id TEXT,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('save', 'load', 'backup', 'restore', 'delete')),
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_size INTEGER,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meeting_backups_company_meeting ON public.meeting_backups(company_id, meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_backups_date ON public.meeting_backups(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meeting_backups_created_at ON public.meeting_backups(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_trail_company_table ON public.data_audit_trail(company_id, table_name);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON public.data_audit_trail(timestamp);

-- Enable RLS
ALTER TABLE public.meeting_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_audit_trail ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meeting_backups
CREATE POLICY "Users can view their company's backups" 
ON public.meeting_backups 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can create backups for their company" 
ON public.meeting_backups 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update their own backups" 
ON public.meeting_backups 
FOR UPDATE 
USING (company_id = get_user_company_id());

-- Create RLS policies for data_audit_trail
CREATE POLICY "Users can view their company's audit trail" 
ON public.data_audit_trail 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can create audit entries for their company" 
ON public.data_audit_trail 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id());