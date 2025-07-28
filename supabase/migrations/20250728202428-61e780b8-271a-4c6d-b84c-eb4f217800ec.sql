-- Since the previous approach with auth.uid() might not work for existing data,
-- let's update all null company_id records to use a specific company ID
-- We'll use the company ID that appears to be currently active: 932b0ef7-5b69-420d-a35b-d832664ca17d

-- Update resourcing_analytics records that have null company_id
UPDATE public.resourcing_analytics 
SET company_id = '932b0ef7-5b69-420d-a35b-d832664ca17d'
WHERE company_id IS NULL;

-- Update care_plan_analytics records that have null company_id  
UPDATE public.care_plan_analytics
SET company_id = '932b0ef7-5b69-420d-a35b-d832664ca17d'
WHERE company_id IS NULL;

-- Update spot_check_analytics records that have null company_id
UPDATE public.spot_check_analytics
SET company_id = '932b0ef7-5b69-420d-a35b-d832664ca17d'
WHERE company_id IS NULL;

-- Update staff_documents_analytics records that have null company_id
UPDATE public.staff_documents_analytics
SET company_id = '932b0ef7-5b69-420d-a35b-d832664ca17d'
WHERE company_id IS NULL;

-- Update staff_training_analytics records that have null company_id
UPDATE public.staff_training_analytics
SET company_id = '932b0ef7-5b69-420d-a35b-d832664ca17d'
WHERE company_id IS NULL;

-- Update supervision_analytics records that have null company_id
UPDATE public.supervision_analytics
SET company_id = '932b0ef7-5b69-420d-a35b-d832664ca17d'
WHERE company_id IS NULL;

-- Update incidents_analytics records that have null company_id
UPDATE public.incidents_analytics
SET company_id = '932b0ef7-5b69-420d-a35b-d832664ca17d'
WHERE company_id IS NULL;

-- Update medication_analytics records that have null company_id
UPDATE public.medication_analytics
SET company_id = '932b0ef7-5b69-420d-a35b-d832664ca17d'
WHERE company_id IS NULL;

-- Update care_notes_analytics records that have null company_id
UPDATE public.care_notes_analytics
SET company_id = '932b0ef7-5b69-420d-a35b-d832664ca17d'
WHERE company_id IS NULL;

-- Update feedback_analytics records that have null company_id
UPDATE public.feedback_analytics
SET company_id = '932b0ef7-5b69-420d-a35b-d832664ca17d'
WHERE company_id IS NULL;