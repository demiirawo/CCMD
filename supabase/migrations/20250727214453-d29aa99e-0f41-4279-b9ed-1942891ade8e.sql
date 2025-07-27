-- Add settings columns to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#3b82f6';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;