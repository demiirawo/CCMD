-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the action reminder job to run every day at 9:00 AM
SELECT cron.schedule(
  'daily-action-reminders',
  '0 9 * * *', -- Every day at 9:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://gwywpkhxpbokmbhwsnod.supabase.co/functions/v1/send-action-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eXdwa2h4cGJva21iaHdzbm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjEyODcsImV4cCI6MjA2ODkzNzI4N30.ZpFRdjvGv75scJBqwnnMdClJSKTOgwM0A9rJaUbyHoU"}'::jsonb,
        body:='{"time": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);