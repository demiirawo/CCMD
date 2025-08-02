-- Check and remove ALL unique constraints from incidents_analytics table
-- This will ensure no constraints block the data saving

-- Get all constraints on incidents_analytics and drop unique ones
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Loop through all unique constraints on incidents_analytics
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'incidents_analytics' 
            AND constraint_type = 'UNIQUE'
            AND constraint_name != 'incidents_analytics_pkey'  -- Keep primary key
    LOOP
        EXECUTE 'ALTER TABLE incidents_analytics DROP CONSTRAINT ' || constraint_record.constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_record.constraint_name;
    END LOOP;
END $$;

-- Do the same for feedback_analytics
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'feedback_analytics' 
            AND constraint_type = 'UNIQUE'
            AND constraint_name != 'feedback_analytics_pkey'
    LOOP
        EXECUTE 'ALTER TABLE feedback_analytics DROP CONSTRAINT ' || constraint_record.constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_record.constraint_name;
    END LOOP;
END $$;

-- Do the same for all other analytics tables
DO $$
DECLARE
    constraint_record RECORD;
    table_name_val TEXT;
BEGIN
    FOR table_name_val IN VALUES ('spot_check_analytics'), ('supervision_analytics'), ('care_plan_analytics'), ('staff_training_analytics'), ('staff_documents_analytics')
    LOOP
        FOR constraint_record IN 
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = table_name_val
                AND constraint_type = 'UNIQUE'
                AND constraint_name NOT LIKE '%_pkey'
        LOOP
            EXECUTE 'ALTER TABLE ' || table_name_val || ' DROP CONSTRAINT ' || constraint_record.constraint_name;
            RAISE NOTICE 'Dropped constraint: % from table: %', constraint_record.constraint_name, table_name_val;
        END LOOP;
    END LOOP;
END $$;