-- Add trends_themes column to subsection_data table
ALTER TABLE public.subsection_data 
ADD COLUMN trends_themes TEXT;