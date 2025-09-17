-- Ensure all analytics tables have proper RLS policies for company-based data isolation

-- Analytics tables that need RLS policies
-- All these tables should only allow access to data belonging to the user's company

-- Add RLS policy for care_plan_analytics if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'care_plan_analytics' 
        AND policyname = 'Users can access company care plan analytics'
    ) THEN
        CREATE POLICY "Users can access company care plan analytics" 
        ON public.care_plan_analytics 
        FOR ALL 
        USING (company_id = get_user_company_id() OR is_admin())
        WITH CHECK (company_id = get_user_company_id() OR is_admin());
    END IF;
END $$;

-- Add RLS policy for care_notes_analytics if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'care_notes_analytics' 
        AND policyname = 'Users can access company care notes analytics'
    ) THEN
        CREATE POLICY "Users can access company care notes analytics" 
        ON public.care_notes_analytics 
        FOR ALL 
        USING (company_id = get_user_company_id() OR is_admin())
        WITH CHECK (company_id = get_user_company_id() OR is_admin());
    END IF;
END $$;

-- Add RLS policy for medication_analytics if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'medication_analytics' 
        AND policyname = 'Users can access company medication analytics'
    ) THEN
        CREATE POLICY "Users can access company medication analytics" 
        ON public.medication_analytics 
        FOR ALL 
        USING (company_id = get_user_company_id() OR is_admin())
        WITH CHECK (company_id = get_user_company_id() OR is_admin());
    END IF;
END $$;

-- Ensure dashboard_data has comprehensive RLS policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'dashboard_data' 
        AND policyname = 'Users can access company dashboard data'
    ) THEN
        CREATE POLICY "Users can access company dashboard data" 
        ON public.dashboard_data 
        FOR ALL 
        USING (company_id = get_user_company_id() OR is_admin())
        WITH CHECK (company_id = get_user_company_id() OR is_admin());
    END IF;
END $$;