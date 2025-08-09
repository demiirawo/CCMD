import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Action {
  id: string;
  title: string;
  assignee: string;
  due_date: string;
  meeting_title: string | null;
  meeting_date: string | null;
  company_id: string;
}

interface TeamMember {
  email: string;
  name: string;
  company_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // DST-aware guard: run only at 09:00 Europe/London
    const nowUkHour = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Europe/London' }).format(new Date());
    if (nowUkHour !== '09') {
      console.log('Skipping send-action-reminders: current UK hour is', nowUkHour);
      return new Response(JSON.stringify({ message: `Skipped - UK time is not 09:00 (current UK hour: ${nowUkHour})` }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting action reminder check...");

    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log("Checking for actions due on:", tomorrowStr);

    // Get actions due tomorrow that are still pending
    const { data: actions, error: actionsError } = await supabase
      .from('actions')
      .select('*')
      .eq('due_date', tomorrowStr)
      .eq('status', 'pending');

    if (actionsError) {
      console.error("Error fetching actions:", actionsError);
      throw new Error("Failed to fetch actions");
    }

    console.log(`Found ${actions?.length || 0} actions due tomorrow`);

    if (!actions || actions.length === 0) {
      return new Response(JSON.stringify({ message: "No actions due tomorrow" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Group actions by company
    const actionsByCompany = actions.reduce((acc: Record<string, Action[]>, action) => {
      if (!acc[action.company_id]) {
        acc[action.company_id] = [];
      }
      acc[action.company_id].push(action);
      return acc;
    }, {});

    let totalEmailsSent = 0;
    let totalErrors = 0;

    // Process each company
    for (const [companyId, companyActions] of Object.entries(actionsByCompany)) {
      console.log(`Processing ${companyActions.length} actions for company ${companyId}`);

      // Get team members for this company (Office Team members)
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('email, name, company_id')
        .eq('company_id', companyId)
        .not('email', 'is', null);

      if (teamError) {
        console.error(`Error fetching team members for company ${companyId}:`, teamError);
        totalErrors++;
        continue;
      }

      if (!teamMembers || teamMembers.length === 0) {
        console.log(`No team members with email found for company ${companyId}`);
        continue;
      }

      // Group actions by assignee and match to team members
      const actionsByAssignee: Record<string, { member: TeamMember; actions: Action[] }> = {};
      
      for (const action of companyActions) {
        // Find team member whose name matches the assignee (case-insensitive)
        const matchedMember = teamMembers.find(member => 
          member.name.toLowerCase().includes(action.assignee.toLowerCase()) ||
          action.assignee.toLowerCase().includes(member.name.toLowerCase())
        );

        if (matchedMember) {
          const key = matchedMember.email;
          if (!actionsByAssignee[key]) {
            actionsByAssignee[key] = { member: matchedMember, actions: [] };
          }
          actionsByAssignee[key].actions.push(action);
        } else {
          console.log(`No team member found for assignee: ${action.assignee} in company ${companyId}`);
        }
      }

      // Send personalized emails to each team member with their actions
      for (const { member, actions: memberActions } of Object.values(actionsByAssignee)) {
        try {
          console.log(`Sending reminder email to ${member.email} for ${memberActions.length} actions`);

          const emailHtml = generatePersonalizedActionReminderEmail(memberActions, member.name);

          const emailResponse = await resend.emails.send({
            from: "CCMD <noreply@ccmd.co.uk>",
            to: [member.email],
            subject: "⚠️ Action Reminder - Your Tasks Due Tomorrow",
            html: emailHtml,
          });

          console.log(`Email sent successfully to ${member.email}:`, emailResponse);
          totalEmailsSent++;
        } catch (emailError) {
          console.error(`Failed to send email to ${member.email}:`, emailError);
          totalErrors++;
        }
      }
    }

    return new Response(JSON.stringify({
      message: "Action reminder process completed",
      emailsSent: totalEmailsSent,
      errors: totalErrors,
      actionsProcessed: actions.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-action-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generatePersonalizedActionReminderEmail(actions: Action[], memberName: string): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = tomorrow.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const actionItems = actions.map(action => {
    const meetingContext = action.meeting_title && action.meeting_date 
      ? `From: ${action.meeting_title} - ${new Date(action.meeting_date).toLocaleDateString('en-GB')}`
      : 'From: Manual Entry';

    return `
      <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 16px; margin-bottom: 16px; border-radius: 0 8px 8px 0;">
        <div style="margin-bottom: 8px;">
          <strong style="color: #1F2937; font-size: 16px;">${action.title}</strong>
        </div>
        <div style="margin-bottom: 4px;">
          <span style="font-size: 14px; color: #DC2626; font-weight: bold;">📅 Due: Tomorrow (${tomorrowFormatted})</span>
        </div>
        <div>
          <span style="font-size: 12px; color: #9CA3AF;">${meetingContext}</span>
        </div>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Action Reminder - CCMD</title>
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #DC2626; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #1F2937; margin: 0; font-size: 24px;">⚠️ Action Reminder</h1>
            <p style="color: #6B7280; margin: 5px 0 0 0; font-size: 16px;">Hi ${memberName}, you have ${actions.length} action${actions.length > 1 ? 's' : ''} due tomorrow</p>
            <p style="color: #9CA3AF; margin: 5px 0 0 0; font-size: 14px;">CCMD Management System</p>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h2 style="color: #374151; margin-bottom: 16px; font-size: 18px;">Your Actions Due Tomorrow</h2>
            ${actionItems}
        </div>

        <div style="border-top: 1px solid #E5E7EB; padding-top: 20px;">
            <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
                This reminder was automatically generated by CCMD Management System<br>
                If you believe this email was sent in error, please contact your system administrator.
            </p>
        </div>
    </div>
</body>
</html>
  `;
}

serve(handler);