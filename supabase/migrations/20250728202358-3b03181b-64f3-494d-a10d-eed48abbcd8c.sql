-- Update all existing analytics records to have proper company_id
-- This fixes the data wiping issue by ensuring existing data can be found by the updated queries

-- Update resourcing_analytics records that have null company_id
UPDATE public.resourcing_analytics 
SET company_id = (
  SELECT company_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
)
WHERE company_id IS NULL;

-- Update care_plan_analytics records that have null company_id  
UPDATE public.care_plan_analytics
SET company_id = (
  SELECT company_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
)
WHERE company_id IS NULL;

-- Update spot_check_analytics records that have null company_id
UPDATE public.spot_check_analytics
SET company_id = (
  SELECT company_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
)
WHERE company_id IS NULL;

-- Update staff_documents_analytics records that have null company_id
UPDATE public.staff_documents_analytics
SET company_id = (
  SELECT company_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
)
WHERE company_id IS NULL;

-- Update staff_training_analytics records that have null company_id
UPDATE public.staff_training_analytics
SET company_id = (
  SELECT company_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
)
WHERE company_id IS NULL;

-- Update supervision_analytics records that have null company_id
UPDATE public.supervision_analytics
SET company_id = (
  SELECT company_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
)
WHERE company_id IS NULL;

-- Update incidents_analytics records that have null company_id
UPDATE public.incidents_analytics
SET company_id = (
  SELECT company_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
)
WHERE company_id IS NULL;

-- Update medication_analytics records that have null company_id
UPDATE public.medication_analytics
SET company_id = (
  SELECT company_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
)
WHERE company_id IS NULL;

-- Update care_notes_analytics records that have null company_id
UPDATE public.care_notes_analytics
SET company_id = (
  SELECT company_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
)
WHERE company_id IS NULL;

-- Update feedback_analytics records that have null company_id
UPDATE public.feedback_analytics
SET company_id = (
  SELECT company_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
)
WHERE company_id IS NULL;