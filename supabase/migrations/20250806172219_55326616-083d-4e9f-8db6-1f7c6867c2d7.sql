
-- Add tags column to cqc_evidence table
ALTER TABLE public.cqc_evidence 
ADD COLUMN tags text[] DEFAULT '{}';
