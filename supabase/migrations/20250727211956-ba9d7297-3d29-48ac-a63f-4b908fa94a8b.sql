-- Clear all observation and meeting data

-- Delete all meetings (contains observations, office team, meeting summary data)
DELETE FROM public.meetings;

-- Delete all analytics data
DELETE FROM public.care_plan_analytics;
DELETE FROM public.resourcing_analytics;
DELETE FROM public.spot_check_analytics;
DELETE FROM public.staff_documents_analytics;
DELETE FROM public.staff_training_analytics;
DELETE FROM public.supervision_analytics;