-- Add CASCADE delete for companies
-- This will ensure when a company is deleted, all related data is also deleted

-- First, let's drop existing foreign key constraints and recreate them with CASCADE
-- This applies to all tables that reference companies

-- Update team_members table
ALTER TABLE public.team_members 
DROP CONSTRAINT IF EXISTS team_members_company_id_fkey;

ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Update profiles table
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_company_id_fkey;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- Update user_companies table
ALTER TABLE public.user_companies 
DROP CONSTRAINT IF EXISTS user_companies_company_id_fkey;

ALTER TABLE public.user_companies 
ADD CONSTRAINT user_companies_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Update meeting_headers table
ALTER TABLE public.meeting_headers 
DROP CONSTRAINT IF EXISTS meeting_headers_company_id_fkey;

ALTER TABLE public.meeting_headers 
ADD CONSTRAINT meeting_headers_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Update meeting_sessions table
ALTER TABLE public.meeting_sessions 
DROP CONSTRAINT IF EXISTS meeting_sessions_company_id_fkey;

ALTER TABLE public.meeting_sessions 
ADD CONSTRAINT meeting_sessions_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Update subsection_data table
ALTER TABLE public.subsection_data 
DROP CONSTRAINT IF EXISTS subsection_data_company_id_fkey;

ALTER TABLE public.subsection_data 
ADD CONSTRAINT subsection_data_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Update actions_log table
ALTER TABLE public.actions_log 
DROP CONSTRAINT IF EXISTS actions_log_company_id_fkey;

ALTER TABLE public.actions_log 
ADD CONSTRAINT actions_log_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Update key_documents table
ALTER TABLE public.key_documents 
DROP CONSTRAINT IF EXISTS key_documents_company_id_fkey;

ALTER TABLE public.key_documents 
ADD CONSTRAINT key_documents_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Update dashboard_data table
ALTER TABLE public.dashboard_data 
DROP CONSTRAINT IF EXISTS dashboard_data_company_id_fkey;

ALTER TABLE public.dashboard_data 
ADD CONSTRAINT dashboard_data_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Update analytics tables
ALTER TABLE public.feedback_analytics 
DROP CONSTRAINT IF EXISTS feedback_analytics_company_id_fkey;

ALTER TABLE public.feedback_analytics 
ADD CONSTRAINT feedback_analytics_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.incidents_analytics 
DROP CONSTRAINT IF EXISTS incidents_analytics_company_id_fkey;

ALTER TABLE public.incidents_analytics 
ADD CONSTRAINT incidents_analytics_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.spot_check_analytics 
DROP CONSTRAINT IF EXISTS spot_check_analytics_company_id_fkey;

ALTER TABLE public.spot_check_analytics 
ADD CONSTRAINT spot_check_analytics_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.supervision_analytics 
DROP CONSTRAINT IF EXISTS supervision_analytics_company_id_fkey;

ALTER TABLE public.supervision_analytics 
ADD CONSTRAINT supervision_analytics_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.staff_documents_analytics 
DROP CONSTRAINT IF EXISTS staff_documents_analytics_company_id_fkey;

ALTER TABLE public.staff_documents_analytics 
ADD CONSTRAINT staff_documents_analytics_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.staff_training_analytics 
DROP CONSTRAINT IF EXISTS staff_training_analytics_company_id_fkey;

ALTER TABLE public.staff_training_analytics 
ADD CONSTRAINT staff_training_analytics_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.care_plan_analytics 
DROP CONSTRAINT IF EXISTS care_plan_analytics_company_id_fkey;

ALTER TABLE public.care_plan_analytics 
ADD CONSTRAINT care_plan_analytics_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.care_notes_analytics 
DROP CONSTRAINT IF EXISTS care_notes_analytics_company_id_fkey;

ALTER TABLE public.care_notes_analytics 
ADD CONSTRAINT care_notes_analytics_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.analytics_backups 
DROP CONSTRAINT IF EXISTS analytics_backups_company_id_fkey;

ALTER TABLE public.analytics_backups 
ADD CONSTRAINT analytics_backups_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.quarterly_reports 
DROP CONSTRAINT IF EXISTS quarterly_reports_company_id_fkey;

ALTER TABLE public.quarterly_reports 
ADD CONSTRAINT quarterly_reports_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Update medication_analytics table
ALTER TABLE public.medication_analytics 
DROP CONSTRAINT IF EXISTS medication_analytics_company_id_fkey;

ALTER TABLE public.medication_analytics 
ADD CONSTRAINT medication_analytics_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Update actions table
ALTER TABLE public.actions 
DROP CONSTRAINT IF EXISTS actions_company_id_fkey;

ALTER TABLE public.actions 
ADD CONSTRAINT actions_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Update meetings table
ALTER TABLE public.meetings 
DROP CONSTRAINT IF EXISTS meetings_company_id_fkey;

ALTER TABLE public.meetings 
ADD CONSTRAINT meetings_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Add DELETE policy for companies table (admin only)
CREATE POLICY "Admins can delete companies" 
ON public.companies 
FOR DELETE 
USING (is_admin());