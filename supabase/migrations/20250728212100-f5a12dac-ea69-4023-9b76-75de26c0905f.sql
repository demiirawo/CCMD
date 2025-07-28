-- Add monthly_data column to resourcing_analytics table
ALTER TABLE public.resourcing_analytics
ADD COLUMN monthly_data jsonb DEFAULT '[]'::jsonb;

-- Update existing constraint to include monthly_data
-- First drop the existing constraint if it exists
ALTER TABLE public.resourcing_analytics 
DROP CONSTRAINT IF EXISTS resourcing_analytics_company_id_key;

-- Add a unique constraint on company_id for proper upserts
ALTER TABLE public.resourcing_analytics 
ADD CONSTRAINT resourcing_analytics_company_id_unique UNIQUE (company_id);