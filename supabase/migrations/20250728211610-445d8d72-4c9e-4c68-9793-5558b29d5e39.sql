-- Add monthly_data column to resourcing_analytics table to make it consistent with other analytics tables
ALTER TABLE public.resourcing_analytics 
ADD COLUMN monthly_data jsonb DEFAULT '[]'::jsonb;