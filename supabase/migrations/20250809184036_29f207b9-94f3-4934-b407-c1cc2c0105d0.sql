-- Enable required extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Conditionally unschedule any previous jobs to avoid errors
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-meeting-reminders-every-5-min') THEN
    PERFORM cron.unschedule('process-meeting-reminders-every-5-min');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'meeting-email-reminders') THEN
    PERFORM cron.unschedule('meeting-email-reminders');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-meeting-reminders') THEN
    PERFORM cron.unschedule('daily-meeting-reminders');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-action-reminders') THEN
    PERFORM cron.unschedule('daily-action-reminders');
  END IF;
END $$;

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