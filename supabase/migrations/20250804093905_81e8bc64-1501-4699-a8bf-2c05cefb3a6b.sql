-- Add overdue column to care_plan_overview table if it doesn't exist
ALTER TABLE public.care_plan_overview 
ADD COLUMN IF NOT EXISTS overdue integer NOT NULL DEFAULT 0;