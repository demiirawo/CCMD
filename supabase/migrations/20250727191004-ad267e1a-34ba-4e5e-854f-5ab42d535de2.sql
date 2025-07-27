-- Add missing fields to care_plan_analytics table for complete data persistence
ALTER TABLE public.care_plan_analytics 
ADD COLUMN monthly_data jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN high_frequency integer NOT NULL DEFAULT 6,
ADD COLUMN medium_frequency integer NOT NULL DEFAULT 12,
ADD COLUMN low_frequency integer NOT NULL DEFAULT 24;