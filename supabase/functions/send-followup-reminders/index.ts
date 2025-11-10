import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MeetingEmailTracking {
  id: string;
  company_id: string;
  meeting_date: string;
  meeting_title: string;
  sent_at: string;
  attendees: { email: string; name: string }[];
  dashboard_data: any;
}

interface Action {
  id: string;
  action_text: string;
  due_date: string;
  mentioned_attendee: string;
  status: string;
  closed: boolean;
  item_title?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔍 Checking for follow-ups to send...");

    // Get all tracking records due for follow-up
    const { data: trackingRecords, error: trackingError } = await supabase
      .from("meeting_email_tracking")
      .select("*")
      .lte("follow_up_scheduled_for", new Date().toISOString())
      .is("follow_up_sent_at", null)
      .order("follow_up_scheduled_for", { ascending: true });

    if (trackingError) {
      console.error("Error fetching tracking records:", trackingError);
      throw trackingError;
    }

    if (!trackingRecords || trackingRecords.length === 0) {
      console.log("✅ No follow-ups due at this time");
      return new Response(
        JSON.stringify({ message: "No follow-ups due", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📧 Found ${trackingRecords.length} follow-ups to send`);

    let successCount = 0;
    let errorCount = 0;

    // Process each tracking record
    for (const record of trackingRecords as MeetingEmailTracking[]) {
      console.log(`Processing follow-up for meeting: ${record.meeting_title}`);

      // Fetch open actions for this company
      const { data: actions, error: actionsError } = await supabase
        .from("actions_log")
        .select("*")
        .eq("company_id", record.company_id)
        .eq("closed", false);

      if (actionsError) {
        console.error(`Error fetching actions for company ${record.company_id}:`, actionsError);
        errorCount++;
        continue;
      }

      // Group actions by attendee
      const actionsByAttendee = new Map<string, Action[]>();
      
      if (actions) {
        for (const action of actions) {
          const attendeeName = action.mentioned_attendee.toLowerCase().trim();
          if (!actionsByAttendee.has(attendeeName)) {
            actionsByAttendee.set(attendeeName, []);
          }
          actionsByAttendee.get(attendeeName)!.push(action);
        }
      }

      // Send email to each attendee with open actions
      for (const attendee of record.attendees) {
        const attendeeActions = actionsByAttendee.get(attendee.name.toLowerCase().trim());
        
        if (!attendeeActions || attendeeActions.length === 0) {
          console.log(`ℹ️  Skipping ${attendee.name} - no open actions`);
          continue;
        }

        try {
          const html = generateFollowUpEmail(
            attendee.name,
            record.meeting_date,
            record.meeting_title,
            attendeeActions
          );

          const emailResponse = await resend.emails.send({
            from: "CCMD Management System <noreply@ccmd.co.uk>",
            to: [attendee.email],
            subject: `⏰ Follow-up: Action Reminders from ${record.meeting_title}`,
            html,
          });

          console.log(`✅ Follow-up email sent to ${attendee.email}:`, emailResponse);
          successCount++;

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (emailError) {
          console.error(`❌ Failed to send email to ${attendee.email}:`, emailError);
          errorCount++;
        }
      }

      // Mark follow-up as sent
      const { error: updateError } = await supabase
        .from("meeting_email_tracking")
        .update({ follow_up_sent_at: new Date().toISOString() })
        .eq("id", record.id);

      if (updateError) {
        console.error(`Error updating tracking record ${record.id}:`, updateError);
      }
    }

    const summary = {
      message: "Follow-up reminders processed",
      meetingsProcessed: trackingRecords.length,
      emailsSent: successCount,
      errors: errorCount,
    };

    console.log("📊 Summary:", summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-followup-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

function generateFollowUpEmail(
  memberName: string,
  meetingDate: string,
  meetingTitle: string,
  actions: Action[]
): string {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getDaysUntilDue = (dueDate: string): number => {
    try {
      const due = new Date(dueDate);
      const now = new Date();
      const diffTime = due.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const getActionClass = (dueDate: string): string => {
    const daysUntil = getDaysUntilDue(dueDate);
    if (daysUntil < 0) return ""; // overdue - red (default)
    if (daysUntil <= 7) return "amber"; // due soon
    return "green"; // on track
  };

  const getStatusLabel = (dueDate: string): string => {
    const daysUntil = getDaysUntilDue(dueDate);
    if (daysUntil < 0) return `<span class="due-date-warning">${formatDate(dueDate)} (OVERDUE)</span>`;
    if (daysUntil <= 7) return `<span style="color: #d97706; font-weight: 600;">${formatDate(dueDate)} (Due Soon)</span>`;
    return formatDate(dueDate);
  };

  // Sort actions: overdue first, then by due date
  const sortedActions = [...actions].sort((a, b) => {
    const daysA = getDaysUntilDue(a.due_date);
    const daysB = getDaysUntilDue(b.due_date);
    return daysA - daysB;
  });

  const overdueCount = sortedActions.filter(a => getDaysUntilDue(a.due_date) < 0).length;
  const dueSoonCount = sortedActions.filter(a => {
    const days = getDaysUntilDue(a.due_date);
    return days >= 0 && days <= 7;
  }).length;
  const onTrackCount = sortedActions.filter(a => getDaysUntilDue(a.due_date) > 7).length;

  const actionsHtml = sortedActions
    .map(
      (action) => `
        <div class="action-item ${getActionClass(action.due_date)}">
          <div class="action-title">${action.action_text}</div>
          <div class="action-detail"><strong>Due Date:</strong> ${getStatusLabel(action.due_date)}</div>
          <div class="action-detail"><strong>Status:</strong> Open</div>
          ${action.item_title ? `<div class="action-detail"><strong>From Meeting:</strong> ${action.item_title}</div>` : ''}
        </div>
      `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Action Follow-up Reminder</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #f59e0b;
        }
        .header h1 {
            color: #f59e0b;
            margin: 0;
            font-size: 24px;
        }
        .header p {
            color: #666;
            margin: 10px 0 0 0;
            font-size: 14px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .reminder-notice {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin-bottom: 25px;
            border-radius: 4px;
        }
        .reminder-notice p {
            margin: 0;
            color: #92400e;
            font-size: 14px;
        }
        .section-title {
            font-size: 18px;
            color: #1f2937;
            margin-top: 25px;
            margin-bottom: 15px;
            font-weight: 600;
        }
        .action-item {
            background-color: #f9fafb;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        .action-item.amber {
            border-left-color: #f59e0b;
        }
        .action-item.green {
            border-left-color: #10b981;
        }
        .action-title {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
            font-size: 15px;
        }
        .action-detail {
            font-size: 13px;
            color: #6b7280;
            margin: 4px 0;
        }
        .action-detail strong {
            color: #374151;
        }
        .due-date-warning {
            color: #dc2626;
            font-weight: 600;
        }
        .summary {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            padding: 15px;
            border-radius: 4px;
            margin-top: 25px;
        }
        .summary p {
            margin: 5px 0;
            font-size: 14px;
            color: #1e40af;
        }
        .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
            font-weight: 600;
            text-align: center;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>⏰ Action Follow-up Reminder</h1>
            <p>CCMD Management System</p>
        </div>

        <div class="greeting">
            <p>Hi <strong>${memberName}</strong>,</p>
        </div>

        <div class="reminder-notice">
            <p>
                <strong>📋 Follow-up Notice:</strong> This is a follow-up reminder about actions assigned to you 
                from the meeting on <strong>${formatDate(meetingDate)}</strong>. Some actions are still open and may require your attention.
            </p>
        </div>

        <div class="section-title">🔴 Your Open Actions</div>

        ${actionsHtml}

        <div class="summary">
            <p><strong>Summary:</strong></p>
            <p>📊 Total Open Actions: <strong>${actions.length}</strong></p>
            ${overdueCount > 0 ? `<p>🔴 Overdue: <strong>${overdueCount}</strong></p>` : ''}
            ${dueSoonCount > 0 ? `<p>🟡 Due Soon (within 7 days): <strong>${dueSoonCount}</strong></p>` : ''}
            ${onTrackCount > 0 ? `<p>🟢 On Track: <strong>${onTrackCount}</strong></p>` : ''}
        </div>

        <div style="text-align: center;">
            <a href="https://gwywpkhxpbokmbhwsnod.supabase.co" class="cta-button">
                View Dashboard & Update Actions
            </a>
        </div>

        <div class="footer">
            <p>This is an automated follow-up reminder from the CCMD Management System.</p>
            <p>If you have questions, please contact your system administrator.</p>
            <p style="margin-top: 10px;">
                <em>Original meeting email sent: ${formatDate(meetingDate)}</em>
            </p>
        </div>
    </div>
</body>
</html>
  `;
}

serve(handler);
