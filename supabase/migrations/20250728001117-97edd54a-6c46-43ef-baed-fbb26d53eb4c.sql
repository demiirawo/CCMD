-- Create a table to store meeting header data persistently
CREATE TABLE IF NOT EXISTS public.meeting_headers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT NOT NULL DEFAULT '',
  attendees JSONB NOT NULL DEFAULT '[]'::jsonb,
  purpose TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_headers ENABLE ROW LEVEL SECURITY;

-- Create policies for meeting headers
CREATE POLICY "Users can view company meeting headers" 
ON public.meeting_headers 
FOR SELECT 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can create company meeting headers" 
ON public.meeting_headers 
FOR INSERT 
WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update company meeting headers" 
ON public.meeting_headers 
FOR UPDATE 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete company meeting headers" 
ON public.meeting_headers 
FOR DELETE 
USING ((company_id = get_user_company_id()) OR is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_meeting_headers_updated_at
BEFORE UPDATE ON public.meeting_headers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add status field to subsection_data to track item status changes
ALTER TABLE public.subsection_data 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'green';

-- Add last_reviewed field to subsection_data 
ALTER TABLE public.subsection_data 
ADD COLUMN IF NOT EXISTS last_reviewed TEXT DEFAULT '';

-- Create a table for key documents tracking
CREATE TABLE IF NOT EXISTS public.key_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'missing',
  due_date TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for key documents
ALTER TABLE public.key_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for key documents
CREATE POLICY "Users can view company key documents" 
ON public.key_documents 
FOR SELECT 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can create company key documents" 
ON public.key_documents 
FOR INSERT 
WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update company key documents" 
ON public.key_documents 
FOR UPDATE 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete company key documents" 
ON public.key_documents 
FOR DELETE 
USING ((company_id = get_user_company_id()) OR is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_key_documents_updated_at
BEFORE UPDATE ON public.key_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a table for persistent actions log
CREATE TABLE IF NOT EXISTS public.actions_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  action_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  item_title TEXT NOT NULL,
  mentioned_attendee TEXT NOT NULL,
  comment TEXT NOT NULL,
  action_text TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'green',
  closed BOOLEAN NOT NULL DEFAULT false,
  closed_date TEXT DEFAULT '',
  source_type TEXT DEFAULT 'manual',
  source_id TEXT DEFAULT '',
  audit_trail JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for actions log
ALTER TABLE public.actions_log ENABLE ROW LEVEL SECURITY;

-- Create policies for actions log
CREATE POLICY "Users can view company actions log" 
ON public.actions_log 
FOR SELECT 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can create company actions log" 
ON public.actions_log 
FOR INSERT 
WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update company actions log" 
ON public.actions_log 
FOR UPDATE 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete company actions log" 
ON public.actions_log 
FOR DELETE 
USING ((company_id = get_user_company_id()) OR is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_actions_log_updated_at
BEFORE UPDATE ON public.actions_log
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();