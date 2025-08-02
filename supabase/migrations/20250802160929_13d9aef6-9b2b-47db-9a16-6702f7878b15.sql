-- Remove any existing foreign key constraints on meeting_id in analytics tables
-- This will prevent issues where meeting IDs don't exist in a meetings table

-- Drop foreign key constraint from incidents_analytics if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'incidents_analytics'
            AND kcu.column_name = 'meeting_id'
    ) THEN
        ALTER TABLE incidents_analytics DROP CONSTRAINT incidents_analytics_meeting_id_fkey;
    END IF;
END $$;

-- Drop foreign key constraint from feedback_analytics if it exists  
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'feedback_analytics'
            AND kcu.column_name = 'meeting_id'
    ) THEN
        ALTER TABLE feedback_analytics DROP CONSTRAINT feedback_analytics_meeting_id_fkey;
    END IF;
END $$;

-- Drop foreign key constraint from spot_check_analytics if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'spot_check_analytics'
            AND kcu.column_name = 'meeting_id'
    ) THEN
        ALTER TABLE spot_check_analytics DROP CONSTRAINT spot_check_analytics_meeting_id_fkey;
    END IF;
END $$;

-- Drop foreign key constraint from supervision_analytics if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'supervision_analytics'
            AND kcu.column_name = 'meeting_id'
    ) THEN
        ALTER TABLE supervision_analytics DROP CONSTRAINT supervision_analytics_meeting_id_fkey;
    END IF;
END $$;

-- Drop foreign key constraint from care_plan_analytics if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'care_plan_analytics'
            AND kcu.column_name = 'meeting_id'
    ) THEN
        ALTER TABLE care_plan_analytics DROP CONSTRAINT care_plan_analytics_meeting_id_fkey;
    END IF;
END $$;

-- Drop foreign key constraint from staff_training_analytics if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'staff_training_analytics'
            AND kcu.column_name = 'meeting_id'
    ) THEN
        ALTER TABLE staff_training_analytics DROP CONSTRAINT staff_training_analytics_meeting_id_fkey;
    END IF;
END $$;

-- Drop foreign key constraint from staff_documents_analytics if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'staff_documents_analytics'
            AND kcu.column_name = 'meeting_id'
    ) THEN
        ALTER TABLE staff_documents_analytics DROP CONSTRAINT staff_documents_analytics_meeting_id_fkey;
    END IF;
END $$;

-- Drop foreign key constraint from care_plan_overview if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'care_plan_overview'
            AND kcu.column_name = 'meeting_id'
    ) THEN
        ALTER TABLE care_plan_overview DROP CONSTRAINT care_plan_overview_meeting_id_fkey;
    END IF;
END $$;

-- Drop foreign key constraint from resourcing_overview if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'resourcing_overview'
            AND kcu.column_name = 'meeting_id'
    ) THEN
        ALTER TABLE resourcing_overview DROP CONSTRAINT resourcing_overview_meeting_id_fkey;
    END IF;
END $$;

-- Drop foreign key constraint from service_user_document_analytics if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'service_user_document_analytics'
            AND kcu.column_name = 'meeting_id'
    ) THEN
        ALTER TABLE service_user_document_analytics DROP CONSTRAINT service_user_document_analytics_meeting_id_fkey;
    END IF;
END $$;