-- Remove compound unique constraints on (company_id, meeting_id) from analytics tables
-- These constraints prevent multiple saves for the same company and meeting combination

-- Drop unique constraint on (company_id, meeting_id) from incidents_analytics
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'incidents_analytics_company_meeting_unique' 
            AND table_name = 'incidents_analytics'
    ) THEN
        ALTER TABLE incidents_analytics DROP CONSTRAINT incidents_analytics_company_meeting_unique;
    END IF;
END $$;

-- Drop unique constraint on (company_id, meeting_id) from feedback_analytics
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'feedback_analytics_company_meeting_unique' 
            AND table_name = 'feedback_analytics'
    ) THEN
        ALTER TABLE feedback_analytics DROP CONSTRAINT feedback_analytics_company_meeting_unique;
    END IF;
END $$;

-- Drop unique constraint on (company_id, meeting_id) from spot_check_analytics
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'spot_check_analytics_company_meeting_unique' 
            AND table_name = 'spot_check_analytics'
    ) THEN
        ALTER TABLE spot_check_analytics DROP CONSTRAINT spot_check_analytics_company_meeting_unique;
    END IF;
END $$;

-- Drop unique constraint on (company_id, meeting_id) from supervision_analytics
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'supervision_analytics_company_meeting_unique' 
            AND table_name = 'supervision_analytics'
    ) THEN
        ALTER TABLE supervision_analytics DROP CONSTRAINT supervision_analytics_company_meeting_unique;
    END IF;
END $$;

-- Drop unique constraint on (company_id, meeting_id) from care_plan_analytics
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'care_plan_analytics_company_meeting_unique' 
            AND table_name = 'care_plan_analytics'
    ) THEN
        ALTER TABLE care_plan_analytics DROP CONSTRAINT care_plan_analytics_company_meeting_unique;
    END IF;
END $$;

-- Drop unique constraint on (company_id, meeting_id) from staff_training_analytics
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'staff_training_analytics_company_meeting_unique' 
            AND table_name = 'staff_training_analytics'
    ) THEN
        ALTER TABLE staff_training_analytics DROP CONSTRAINT staff_training_analytics_company_meeting_unique;
    END IF;
END $$;

-- Drop unique constraint on (company_id, meeting_id) from staff_documents_analytics
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'staff_documents_analytics_company_meeting_unique' 
            AND table_name = 'staff_documents_analytics'
    ) THEN
        ALTER TABLE staff_documents_analytics DROP CONSTRAINT staff_documents_analytics_company_meeting_unique;
    END IF;
END $$;