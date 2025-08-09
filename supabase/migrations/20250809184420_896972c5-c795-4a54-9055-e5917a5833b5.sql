-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove previous jobs to avoid duplicates
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-action-reminders') THEN
    PERFORM cron.unschedule('daily-action-reminders');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'hourly-action-reminders-uk') THEN
    PERFORM cron.unschedule('hourly-action-reminders-uk');
  END IF;
END $$;

-- Schedule hourly trigger; function itself will only act at 09:00 Europe/London
SELECT cron.schedule(
  'hourly-action-reminders-uk',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://gwywpkhxpbokmbhwsnod.supabase.co/functions/v1/send-action-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eXdwa2h4cGJva21iaHdzbm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjEyODcsImV4cCI6MjA2ODkzNzI4N30.ZpFRdjvGv75scJBqwnnMdClJSKTOgwM0A9rJaUbyHoU"}'::jsonb,
        body:='{"source": "cron", "invoked_at": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);