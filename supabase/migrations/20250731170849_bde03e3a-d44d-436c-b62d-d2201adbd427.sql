-- Disable the daily action reminder cron job
SELECT cron.unschedule('daily-action-reminders');