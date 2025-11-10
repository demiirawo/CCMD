# Follow-up Email Reminder System Setup

This system automatically sends follow-up reminder emails to meeting attendees 3.5 days after the initial meeting summary email is sent.

## How It Works

1. **When Meeting Summary is Sent**: 
   - A tracking record is created in the `meeting_email_tracking` table
   - The follow-up is scheduled for 3.5 days later

2. **Daily Cron Job**:
   - Checks for tracking records where `follow_up_scheduled_for` <= current time
   - Fetches open actions for each attendee
   - Sends personalized follow-up emails
   - Marks the follow-up as sent

3. **Follow-up Email**:
   - Includes only the recipient's open actions
   - Color-coded by status (overdue/due soon/on track)
   - Summary statistics
   - Link to dashboard

## Setting Up the Cron Job

To enable automated daily follow-ups, run this SQL in your Supabase SQL Editor:

\`\`\`sql
-- Schedule the follow-up reminder function to run daily at 9 AM
SELECT cron.schedule(
  'send-followup-reminders-daily',
  '0 9 * * *', -- Every day at 9 AM
  $$
  SELECT
    net.http_post(
        url:='https://gwywpkhxpbokmbhwsnod.supabase.co/functions/v1/send-followup-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eXdwa2h4cGJva21iaHdzbm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjEyODcsImV4cCI6MjA2ODkzNzI4N30.ZpFRdjvGv75scJBqwnnMdClJSKTOgwM0A9rJaUbyHoU"}'::jsonb
    ) as request_id;
  $$
);
\`\`\`

### Cron Schedule Options

You can adjust the timing by modifying the cron expression:
- `0 9 * * *` - 9 AM daily (default)
- `0 10 * * *` - 10 AM daily
- `0 9 * * 1-5` - 9 AM on weekdays only
- `0 */6 * * *` - Every 6 hours

### Verify Cron Job

To check if the cron job is set up correctly:

\`\`\`sql
SELECT * FROM cron.job WHERE jobname = 'send-followup-reminders-daily';
\`\`\`

### Remove Cron Job

If you need to disable or remove the cron job:

\`\`\`sql
SELECT cron.unschedule('send-followup-reminders-daily');
\`\`\`

## Testing

You can manually trigger the follow-up reminder function to test it:

1. Go to Supabase Dashboard → Edge Functions
2. Select `send-followup-reminders`
3. Click "Invoke Function"
4. Or use the SQL Editor:

\`\`\`sql
SELECT
  net.http_post(
      url:='https://gwywpkhxpbokmbhwsnod.supabase.co/functions/v1/send-followup-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eXdwa2h4cGJva21iaHdzbm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjEyODcsImV4cCI6MjA2ODkzNzI4N30.ZpFRdjvGv75scJBqwnnMdClJSKTOgwM0A9rJaUbyHoU"}'::jsonb
  ) as request_id;
\`\`\`

## Database Tables

### meeting_email_tracking
Stores tracking information for meeting emails and follow-ups:
- `company_id`: Company the meeting belongs to
- `meeting_date`: Date of the meeting
- `meeting_title`: Title of the meeting
- `sent_at`: When the initial email was sent
- `follow_up_scheduled_for`: When to send the follow-up (sent_at + 3.5 days)
- `follow_up_sent_at`: When the follow-up was actually sent (NULL until sent)
- `attendees`: JSON array of attendees with emails
- `dashboard_data`: Dashboard state at time of meeting (for context)

## Monitoring

Check the edge function logs to monitor follow-up emails:
1. Go to Supabase Dashboard → Edge Functions
2. Select `send-followup-reminders`
3. View the Logs tab

Look for:
- `✅ Follow-up email sent to [email]`
- `❌ Failed to send email to [email]`
- Summary statistics at the end of each run
