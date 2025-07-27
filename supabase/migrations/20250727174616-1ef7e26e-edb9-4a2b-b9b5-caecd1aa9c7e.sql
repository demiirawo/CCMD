-- Make meeting_id nullable and remove foreign key constraint to match resourcing_analytics table structure
ALTER TABLE public.staff_documents_analytics 
DROP CONSTRAINT staff_documents_analytics_meeting_id_fkey;

ALTER TABLE public.staff_documents_analytics 
ALTER COLUMN meeting_id DROP NOT NULL;