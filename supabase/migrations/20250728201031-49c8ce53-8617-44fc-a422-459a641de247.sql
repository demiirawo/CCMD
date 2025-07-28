-- Add unique constraints only for tables that don't have them yet

-- Check and add unique constraint for incidents_analytics if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'incidents_analytics_meeting_company_unique'
    ) THEN
        ALTER TABLE public.incidents_analytics 
        ADD CONSTRAINT incidents_analytics_meeting_company_unique 
        UNIQUE (meeting_id, company_id);
    END IF;
END $$;

-- Check and add unique constraint for medication_analytics if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'medication_analytics_meeting_company_unique'
    ) THEN
        ALTER TABLE public.medication_analytics 
        ADD CONSTRAINT medication_analytics_meeting_company_unique 
        UNIQUE (meeting_id, company_id);
    END IF;
END $$;

-- Check and add unique constraint for care_notes_analytics if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'care_notes_analytics_meeting_company_unique'
    ) THEN
        ALTER TABLE public.care_notes_analytics 
        ADD CONSTRAINT care_notes_analytics_meeting_company_unique 
        UNIQUE (meeting_id, company_id);
    END IF;
END $$;

-- Check and add unique constraint for staff_training_analytics if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'staff_training_analytics_meeting_company_unique'
    ) THEN
        ALTER TABLE public.staff_training_analytics 
        ADD CONSTRAINT staff_training_analytics_meeting_company_unique 
        UNIQUE (meeting_id, company_id);
    END IF;
END $$;

-- Check and add unique constraint for staff_documents_analytics if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'staff_documents_analytics_meeting_company_unique'
    ) THEN
        ALTER TABLE public.staff_documents_analytics 
        ADD CONSTRAINT staff_documents_analytics_meeting_company_unique 
        UNIQUE (meeting_id, company_id);
    END IF;
END $$;

-- Check and add unique constraint for spot_check_analytics if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'spot_check_analytics_meeting_company_unique'
    ) THEN
        ALTER TABLE public.spot_check_analytics 
        ADD CONSTRAINT spot_check_analytics_meeting_company_unique 
        UNIQUE (meeting_id, company_id);
    END IF;
END $$;

-- Check and add unique constraint for supervision_analytics if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'supervision_analytics_meeting_company_unique'
    ) THEN
        ALTER TABLE public.supervision_analytics 
        ADD CONSTRAINT supervision_analytics_meeting_company_unique 
        UNIQUE (meeting_id, company_id);
    END IF;
END $$;

-- Check and add unique constraint for resourcing_analytics if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'resourcing_analytics_month_company_unique'
    ) THEN
        ALTER TABLE public.resourcing_analytics 
        ADD CONSTRAINT resourcing_analytics_month_company_unique 
        UNIQUE (month, company_id);
    END IF;
END $$;