-- Delete all analytics records with null company_id to avoid conflicts
-- This will remove the old data that's causing the wiping issue

DELETE FROM public.resourcing_analytics WHERE company_id IS NULL;
DELETE FROM public.care_plan_analytics WHERE company_id IS NULL;
DELETE FROM public.spot_check_analytics WHERE company_id IS NULL;
DELETE FROM public.staff_documents_analytics WHERE company_id IS NULL;
DELETE FROM public.staff_training_analytics WHERE company_id IS NULL;
DELETE FROM public.supervision_analytics WHERE company_id IS NULL;
DELETE FROM public.incidents_analytics WHERE company_id IS NULL;
DELETE FROM public.medication_analytics WHERE company_id IS NULL;
DELETE FROM public.care_notes_analytics WHERE company_id IS NULL;
DELETE FROM public.feedback_analytics WHERE company_id IS NULL;