-- Add comment column to key_documents table
ALTER TABLE public.key_documents 
ADD COLUMN IF NOT EXISTS comment text DEFAULT '';