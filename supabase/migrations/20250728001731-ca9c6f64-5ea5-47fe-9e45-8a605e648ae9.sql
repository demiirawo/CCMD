-- Fix unique constraints for proper upsert operations

-- Add unique constraint for meeting_headers (one current header per company)
ALTER TABLE public.meeting_headers 
ADD CONSTRAINT meeting_headers_company_unique UNIQUE (company_id);

-- Add unique constraint for subsection_data
ALTER TABLE public.subsection_data 
ADD CONSTRAINT subsection_data_unique UNIQUE (company_id, section_id, item_id);

-- Add unique constraint for actions_log based on action_id and company_id
ALTER TABLE public.actions_log 
ADD CONSTRAINT actions_log_action_unique UNIQUE (company_id, action_id);