-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Unschedule any previous high-frequency or legacy jobs (idempotent)
SELECT cron.unschedule('process-meeting-reminders-every-5-min');
SELECT cron.unschedule('meeting-email-reminders');
SELECT cron.unschedule('daily-meeting-reminders');
SELECT cron.unschedule('daily-action-reminders');

-- Schedule daily job at 09:00 UTC to invoke the reminder processor
SELECT cron.schedule(
  'daily-action-reminders',
  '0 9 * * *', -- every day at 09:00 UTC
  $$
  SELECT
    net.http_post(
        url:='https://gwywpkhxpbokmbhwsnod.supabase.co/functions/v1/send-action-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eXdwa2h4cGJva21iaHdzbm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjEyODcsImV4cCI6MjA2ODkzNzI4N30.ZpFRdjvGv75scJBqwnnMdClJSKTOgwM0A9rJaUbyHoU"}'::jsonb,
        body:='{"time": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);