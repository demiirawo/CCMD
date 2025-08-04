-- Add lessons_learned column to subsection_data table
ALTER TABLE public.subsection_data 
ADD COLUMN lessons_learned TEXT;