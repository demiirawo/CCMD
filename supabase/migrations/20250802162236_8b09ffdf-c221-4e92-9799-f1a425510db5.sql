-- Drop the unique indexes that are causing the constraint violations
DROP INDEX IF EXISTS incidents_analytics_company_meeting_unique;
DROP INDEX IF EXISTS incidents_analytics_company_null_unique;

-- Drop similar indexes from other analytics tables
DROP INDEX IF EXISTS feedback_analytics_company_meeting_unique;
DROP INDEX IF EXISTS feedback_analytics_company_null_unique;
DROP INDEX IF EXISTS spot_check_analytics_company_meeting_unique;
DROP INDEX IF EXISTS spot_check_analytics_company_null_unique;
DROP INDEX IF EXISTS supervision_analytics_company_meeting_unique;
DROP INDEX IF EXISTS supervision_analytics_company_null_unique;
DROP INDEX IF EXISTS care_plan_analytics_company_meeting_unique;
DROP INDEX IF EXISTS care_plan_analytics_company_null_unique;
DROP INDEX IF EXISTS staff_training_analytics_company_meeting_unique;
DROP INDEX IF EXISTS staff_training_analytics_company_null_unique;
DROP INDEX IF EXISTS staff_documents_analytics_company_meeting_unique;
DROP INDEX IF EXISTS staff_documents_analytics_company_null_unique;