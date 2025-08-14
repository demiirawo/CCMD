-- Add compliance settings columns to companies table
ALTER TABLE public.companies 
ADD COLUMN cqc_personal_care BOOLEAN DEFAULT false,
ADD COLUMN home_office_cos BOOLEAN DEFAULT false,
ADD COLUMN ofsted_supported_accommodation BOOLEAN DEFAULT false;