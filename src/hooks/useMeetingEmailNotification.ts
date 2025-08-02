import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MeetingEmailData {
  title: string;
  date: string;
  attendees: any[];
  actions: any[];
  meetingSummary?: string;
}

export const useMeetingEmailNotification = () => {
  const { toast } = useToast();

  const sendMeetingEmails = async (meetingData: MeetingEmailData) => {
    try {
      console.log('🔄 Starting email notification process...');
      console.log('📧 Meeting data:', {
        title: meetingData.title,
        attendeesCount: meetingData.attendees.length,
        actionsCount: meetingData.actions.length
      });

      // Extract attendee emails
      const attendeeEmails = meetingData.attendees
        .filter(attendee => attendee.email && attendee.email.trim() !== '')
        .map(attendee => attendee.email);

      console.log('📬 Valid attendee emails found:', attendeeEmails);

      if (attendeeEmails.length === 0) {
        console.log('⚠️ No attendee emails found, skipping email notifications');
        toast({
          title: "No Email Addresses",
          description: "No valid email addresses found for attendees. Please add email addresses to send notifications.",
          variant: "destructive"
        });
        return;
      }

      // Generate meeting summary content - check if there's a meaningful summary
      const meetingSummaryText = meetingData.meetingSummary?.trim();
      const shouldIncludeSummary = meetingSummaryText && 
        meetingSummaryText !== '' && 
        meetingSummaryText !== 'No summary provided' &&
        meetingSummaryText.length > 0;
      
      // Count attendees who actually attended
      const attendedCount = meetingData.attendees.filter(attendee => attendee.attended).length;
      const totalAttendeesCount = meetingData.attendees.length;
      
      // Debug action items structure
      console.log('🔍 Action items raw data:', JSON.stringify(meetingData.actions, null, 2));
      
      // Function to get actions for current user - check if assignee matches their email or name
      const getCurrentUserActions = (attendeeEmail: string) => {
        const currentAttendee = meetingData.attendees.find(att => att.email === attendeeEmail);
        const currentAttendeeName = currentAttendee?.name || '';
        
        return meetingData.actions.filter(action => {
          const assignee = action.mentionedAttendee || action.mentioned_attendee || action.assignee || action.assigned_to || action.owner || '';
          console.log(`🔍 Checking action for ${attendeeEmail}:`, { assignee, currentAttendeeName });
          
          // Check if assignee matches email, name, or contains "my"/"me"
          return assignee.toLowerCase().includes(attendeeEmail.toLowerCase()) || 
                 (currentAttendeeName && assignee.toLowerCase().includes(currentAttendeeName.toLowerCase())) ||
                 assignee.toLowerCase().includes('my') || 
                 assignee.toLowerCase().includes('me');
        });
      };
      
      // Function to get all other actions (Office Team actions)
      const getOfficeTeamActions = (attendeeEmail: string) => {
        const currentAttendee = meetingData.attendees.find(att => att.email === attendeeEmail);
        const currentAttendeeName = currentAttendee?.name || '';
        
        return meetingData.actions.filter(action => {
          const assignee = action.mentionedAttendee || action.mentioned_attendee || action.assignee || action.assigned_to || action.owner || '';
          
          // Exclude actions assigned to current user, include all others with assignees
          const isMyAction = assignee.toLowerCase().includes(attendeeEmail.toLowerCase()) || 
                           (currentAttendeeName && assignee.toLowerCase().includes(currentAttendeeName.toLowerCase())) ||
                           assignee.toLowerCase().includes('my') || 
                           assignee.toLowerCase().includes('me');
          
          return !isMyAction && assignee.trim() !== '';
        });
      };

      // Format action items with categories
      const formatActionSection = (actions: any[], title: string) => {
        if (actions.length === 0) return '';
        
        return `
          <h4 style="color: #374151; margin: 16px 0 8px 0; font-size: 16px;">${title} (${actions.length})</h4>
          <ul style="margin: 0; padding-left: 20px;">
            ${actions.map((action, index) => {
              console.log(`🔍 Processing action ${index}:`, {
                raw: action,
                keys: Object.keys(action),
                // ActionLogEntry fields
                action: action.action,
                mentionedAttendee: action.mentionedAttendee,
                dueDate: action.dueDate,
                // Alternative possible fields
                action_text: action.action_text,
                actionText: action.actionText,
                description: action.description,
                text: action.text,
                title: action.title,
                mentioned_attendee: action.mentioned_attendee,
                assignee: action.assignee,
                assigned_to: action.assigned_to,
                owner: action.owner,
                due_date: action.due_date,
                targetDate: action.targetDate,
                target_date: action.target_date
              });
              
              // Use correct ActionLogEntry field names first, then fallbacks
              const actionText = action.action || 
                                action.action_text || 
                                action.actionText || 
                                action.description || 
                                action.text || 
                                action.title || 
                                'No action description';
              
              const assignee = action.mentionedAttendee || 
                              action.mentioned_attendee || 
                              action.assignee || 
                              action.assigned_to || 
                              action.owner || 
                              '';
              
              const dueDate = action.dueDate || 
                             action.due_date || 
                             action.targetDate || 
                             action.target_date || 
                             '';
              
              return `
                <li style="margin-bottom: 12px; color: #6B7280; line-height: 1.5;">
                  <div style="margin-bottom: 4px;">
                    <strong style="color: #374151;">${actionText}</strong>
                  </div>
                  ${assignee ? `<div style="font-size: 14px; color: #6B7280;">👤 Assigned to: ${assignee}</div>` : ''}
                  ${dueDate ? `<div style="font-size: 14px; color: #6B7280;">📅 Due: ${dueDate}</div>` : ''}
                </li>
              `;
            }).join('')}
          </ul>
        `;
      };

      // Function to generate personalized action items HTML for each attendee
      const generateActionItemsHtml = (attendeeEmail: string) => {
        const myActions = getCurrentUserActions(attendeeEmail);
        const officeTeamActions = getOfficeTeamActions(attendeeEmail);

        console.log(`📧 Actions for ${attendeeEmail}:`, {
          myActions: myActions.length,
          officeTeamActions: officeTeamActions.length,
          myActionsList: myActions.map(a => ({ text: a.action || a.actionText, assignee: a.mentionedAttendee || a.assignee })),
          officeActionsList: officeTeamActions.map(a => ({ text: a.action || a.actionText, assignee: a.mentionedAttendee || a.assignee }))
        });

        return meetingData.actions.length > 0 
          ? `
            <h3 style="color: #374151; margin-bottom: 16px;">Action Items (${meetingData.actions.length} total):</h3>
            ${formatActionSection(myActions, 'My Actions')}
            ${formatActionSection(officeTeamActions, 'Office Team')}
          `
          : '<h3 style="color: #374151; margin-bottom: 16px;">Action Items:</h3><p style="color: #6B7280;">No action items recorded.</p>';
      };

      // Send emails to all attendees
      console.log('📤 Starting to send emails to:', attendeeEmails.length, 'recipients');
      
      const emailPromises = attendeeEmails.map(async (email) => {
        try {
          console.log(`📧 Sending email to: ${email}`);
          
          // Generate personalized email content for this attendee
          const personalizedActionItemsHtml = generateActionItemsHtml(email);
          
          // Create email HTML content
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
              <div style="border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="color: #1F2937; margin: 0; font-size: 24px;">Meeting Summary</h1>
                <p style="color: #6B7280; margin: 5px 0 0 0; font-size: 16px;">${meetingData.title}</p>
                <p style="color: #9CA3AF; margin: 5px 0 0 0; font-size: 14px;">${new Date(meetingData.date).toLocaleDateString('en-GB')} at ${new Date(meetingData.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                <p style="color: #9CA3AF; margin: 5px 0 0 0; font-size: 14px;">👥 Attendees: ${attendedCount} of ${totalAttendeesCount} attended</p>
              </div>
              
              ${shouldIncludeSummary ? `
              <div style="margin-bottom: 30px;">
                <h3 style="color: #374151; margin-bottom: 16px;">Meeting Notes:</h3>
                <div style="background-color: #F9FAFB; padding: 16px; border-radius: 8px; border-left: 4px solid #3B82F6;">
                  <p style="color: #6B7280; margin: 0; line-height: 1.6;">${meetingSummaryText}</p>
                </div>
              </div>
              ` : `
              <div style="margin-bottom: 30px;">
                <h3 style="color: #374151; margin-bottom: 16px;">Meeting Notes:</h3>
                <div style="background-color: #F9FAFB; padding: 16px; border-radius: 8px; border-left: 4px solid #3B82F6;">
                  <p style="color: #9CA3AF; margin: 0; line-height: 1.6; font-style: italic;">No meeting summary provided</p>
                </div>
              </div>
              `}

              <div style="margin-bottom: 30px;">
                ${personalizedActionItemsHtml}
              </div>

              <div style="border-top: 1px solid #E5E7EB; padding-top: 20px;">
                <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
                  This email was automatically generated from CCMD
                </p>
              </div>
            </div>
          `;
          
          const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
              to: email,
              subject: `${meetingData.title} - ${new Date(meetingData.date).toLocaleDateString('en-GB')}`,
              html: emailHtml,
              from: 'CCMD <meetings@ccmd.co.uk>'
            }
          });

          console.log(`📧 Email response for ${email}:`, { data, error });

          if (error) {
            console.error(`❌ Failed to send email to ${email}:`, error);
            return { email, success: false, error: error.message };
          }

          console.log(`Email sent successfully to ${email}`);
          return { email, success: true };
        } catch (error) {
          console.error(`Error sending email to ${email}:`, error);
          return { email, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      if (successCount === totalCount) {
        toast({
          title: "Emails Sent",
          description: `Meeting summary sent to all ${totalCount} attendees`,
        });
      } else if (successCount > 0) {
        toast({
          title: "Partial Success",
          description: `Meeting summary sent to ${successCount} of ${totalCount} attendees`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Email Failed",
          description: "Failed to send meeting summary to attendees",
          variant: "destructive"
        });
      }

      return results;

    } catch (error) {
      console.error('Error in sendMeetingEmails:', error);
      toast({
        title: "Email Error",
        description: "Failed to send meeting notifications",
        variant: "destructive"
      });
      throw error;
    }
  };

  return { sendMeetingEmails };
};