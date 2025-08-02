-- First drop the constraint if it exists, then recreate it
DO $$ 
BEGIN
    -- Try to drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'feedback_analytics_company_meeting_unique'
    ) THEN
        ALTER TABLE public.feedback_analytics 
        DROP CONSTRAINT feedback_analytics_company_meeting_unique;
    END IF;
    
    -- Add the unique constraint
    ALTER TABLE public.feedback_analytics 
    ADD CONSTRAINT feedback_analytics_company_meeting_unique 
    UNIQUE (company_id, meeting_id);
END $$;