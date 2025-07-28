-- Add unique constraint for company_id to enable proper upserts
ALTER TABLE public.resourcing_analytics 
ADD CONSTRAINT resourcing_analytics_company_id_unique UNIQUE (company_id);