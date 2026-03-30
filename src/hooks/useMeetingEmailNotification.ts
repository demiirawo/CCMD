import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MeetingEmailData {
  title: string;
  date: string;
  attendees: any[];
  actions: any[];
  meetingSummary?: string;
  companyName?: string;
  companyServices?: string[];
  dashboardData?: {
    sections: Array<{
      id: string;
      title: string;
      items: Array<{
        id: string;
        title: string;
        status: 'green' | 'amber' | 'red' | 'na';
        lastReviewed: string;
        observation: string;
        actions: Array<{
          id: string;
          name: string;
          description?: string;
          targetDate: string;
          isCompleted: boolean;
          completedAt?: string;
        }>;
        details: string;
        metadata?: any;
        [key: string]: any;
      }>;
      [key: string]: any;
    }>;
    [key: string]: any;
  };
  keyDocuments?: any[];
}

export const useMeetingEmailNotification = () => {
  const { toast } = useToast();

      const sendMeetingEmails = async (meetingData: MeetingEmailData) => {
        try {
          console.log('🔄 Starting email notification process...');
          console.log('📧 Meeting data:', {
            title: meetingData.title,
            attendeesCount: meetingData.attendees.length,
            actionsCount: meetingData.actions.length,
            hasDashboardData: !!meetingData.dashboardData,
            sectionsCount: meetingData.dashboardData?.sections?.length || 0
          });

          // Debug dashboard sections structure
          if (meetingData.dashboardData?.sections) {
            console.log('📊 Dashboard sections structure:');
            meetingData.dashboardData.sections.forEach((section, idx) => {
              const totalActions = section.items.reduce((total, item) => total + (item.actions?.length || 0), 0);
              console.log(`  Section ${idx}: ${section.title} - ${section.items.length} items, ${totalActions} total actions`);
              section.items.forEach((item, itemIdx) => {
                if (item.actions && item.actions.length > 0) {
                  console.log(`    Item ${itemIdx}: ${item.title} - ${item.actions.length} actions`);
                  item.actions.forEach((action, actionIdx) => {
                    console.log(`      Action ${actionIdx}: ${action.name || 'unnamed'} - ${action.isCompleted ? 'completed' : 'open'} - due: ${action.targetDate}`);
                  });
                }
              });
            });
          } else {
            console.log('⚠️ No dashboard sections found in meeting data');
          }

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

      // Helper function to get overall actions status from dashboard sections
      const getActionsOverallStatus = (sections: any[]): 'green' | 'red' => {
        const allActions: any[] = [];
        
        sections.forEach(section => {
          section.items.forEach((item: any) => {
            if (item.actions && item.actions.length > 0) {
              allActions.push(...item.actions);
            }
          });
        });

        const openActions = allActions.filter(action => !action.isCompleted);
        const overdueActions = openActions.filter(action => {
          if (!action.targetDate || action.targetDate === '' || action.targetDate === 'No due date') {
            return false;
          }
          
          let dueDate: Date;
          try {
            if (action.targetDate.includes('/')) {
              const [day, month, year] = action.targetDate.split('/');
              dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
              dueDate = new Date(action.targetDate);
            }
            
            if (isNaN(dueDate.getTime())) {
              return false;
            }
          } catch (error) {
            return false;
          }
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);
          
          return dueDate < today;
        });
        
        return overdueActions.length > 0 ? 'red' : 'green';
      };

      // Helper function to process actions from dashboard sections
      const processActionsFromSections = (sections: any[], currentUserName?: string) => {
        const processedActions: any[] = [];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        sections.forEach(section => {
          section.items.forEach((item: any) => {
            if (item.actions && item.actions.length > 0) {
              item.actions.forEach((action: any) => {
                const isCompleted = action.isCompleted || false;
                const assigneeName = action.name || 'Unassigned';
                const isMyAction = currentUserName ? 
                  assigneeName.toLowerCase().includes(currentUserName.toLowerCase()) : false;

                let isWithinLast30Days = true;
                if (isCompleted && action.completedAt) {
                  const completedDate = new Date(action.completedAt);
                  isWithinLast30Days = completedDate >= thirtyDaysAgo;
                } else if (action.targetDate) {
                  const targetDate = new Date(action.targetDate);
                  isWithinLast30Days = targetDate >= thirtyDaysAgo;
                }

                processedActions.push({
                  ...action,
                  sectionTitle: section.title,
                  itemTitle: item.title,
                  isMyAction,
                  isWithinLast30Days,
                  isCompleted,
                  assignedTo: assigneeName
                });
              });
            }
          });
        });

        return processedActions;
      };

      // Generate high-level status summary
      const generateStatusSummary = () => {
        if (!meetingData.dashboardData?.sections) return '';
        
        console.log('📧 EMAIL: Company Services for filtering:', meetingData.companyServices);
        console.log('📧 EMAIL: Available sections:', meetingData.dashboardData.sections.map(s => ({ 
          id: s.id, 
          title: s.title,
          items: s.items.map(i => ({ id: i.id, title: i.title, status: i.status }))
        })));
        
        const statusMapping = { green: 'G', amber: 'A', red: 'R' };
        const sectionStatusSummary: Array<{title: string, status: string, updated: string}> = [];
        
        // Check if Child Contact Centre is selected
        const isChildContactCentre = meetingData.companyServices?.includes("Child Contact Centre") || false;
        console.log('📧 EMAIL: Child Contact Centre check:', isChildContactCentre);
        
        // Calculate status for each major section (excluding meeting-overview)
        meetingData.dashboardData.sections.forEach(section => {
          if (section.id === 'meeting-overview') {
            console.log('📧 EMAIL: Skipping meeting-overview section');
            return;
          }
          
          // Skip Supported Housing section if not enabled in company services
          if (section.id === 'supported-housing') {
            const hasSupported = meetingData.companyServices?.includes('Supported Housing') || false;
            console.log('📧 EMAIL: Supported Housing check:', { 
              sectionId: section.id, 
              hasSupported, 
              companyServices: meetingData.companyServices,
              includes: meetingData.companyServices?.includes('Supported Housing')
            });
            if (!hasSupported) {
              console.log('📧 EMAIL: Skipping Supported Housing - not in company services');
              return;
            }
          }
          
          // Calculate overall section status matching dashboard logic
          // Only consider green, amber, red statuses (exclude 'na')
          const validItems = section.items.filter(item => item.status !== 'na');
          let sectionStatus: 'green' | 'amber' | 'red' = 'green';
          
          // Count statuses
          const statusCounts = {
            red: validItems.filter(item => item.status === 'red').length,
            amber: validItems.filter(item => item.status === 'amber').length,
            green: validItems.filter(item => item.status === 'green').length
          };
          
          // Map section titles for special logic check
          let displayTitle = section.title;
          if (section.id === 'care-planning') displayTitle = 'Care & Support';
          if (section.id === 'continuous-improvement') displayTitle = 'Continuous Improvement';
          if (section.id === 'supported-housing') displayTitle = 'Supported Housing';
          
          // For Child Contact Centre, use the section title as-is (already correct in the data)
          // The Child Contact Centre sections are: Staffing, Case Management, Safety, Continuous Improvement
          
          // Special logic for major sections (matching dashboard DashboardSection.tsx)
          const majorSections = isChildContactCentre 
            ? ["Staffing", "Case Management", "Safety", "Continuous Improvement"]
            : ["Staffing", "Care & Support", "Support", "Safety", "Continuous Improvement"];
            
          if (majorSections.includes(displayTitle)) {
            // If any subsection is red -> make major section red
            if (statusCounts.red > 0) {
              sectionStatus = 'red';
            }
            // If more than one subsection is amber -> make major section amber
            else if (statusCounts.amber > 1) {
              sectionStatus = 'amber';
            }
            // If only one subsection is amber but others are green -> keep major section green
            else {
              sectionStatus = 'green';
            }
          } else {
            // Default logic for other sections
            if (statusCounts.red > 0) {
              sectionStatus = 'red';
            } else if (statusCounts.amber > 0) {
              sectionStatus = 'amber';
            } else {
              sectionStatus = 'green';
            }
          }
          
          console.log('📧 EMAIL: Section status calculation:', {
            sectionId: section.id,
            displayTitle: displayTitle,
            isMajorSection: majorSections.includes(displayTitle),
            totalItems: section.items.length,
            validItems: validItems.length,
            statusCounts,
            itemStatuses: section.items.map(i => ({ id: i.id, title: i.title, status: i.status })),
            calculatedStatus: sectionStatus
          });
          
          console.log('📧 EMAIL: Including section in status summary:', { id: section.id, title: displayTitle, status: sectionStatus });
          
          sectionStatusSummary.push({
            title: displayTitle,
            status: statusMapping[sectionStatus],
            updated: new Date().toLocaleDateString('en-GB')
          });
        });
        
        // Add Key Review Dates status if we have key documents (at the end to match dashboard order)
        // Don't include Compliance Documents for Child Contact Centre
        if (meetingData.keyDocuments && meetingData.keyDocuments.length > 0 && !isChildContactCentre) {
          // Calculate key documents status based on due dates
          const now = new Date();
          let keyDocsStatus: 'green' | 'amber' | 'red' = 'green';
          
          meetingData.keyDocuments.forEach((doc: any) => {
            if (doc.nextReviewDate) {
              const dueDate = new Date(doc.nextReviewDate);
              const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysUntilDue < 0) keyDocsStatus = 'red'; // Overdue
              else if (daysUntilDue <= 30 && keyDocsStatus !== 'red') keyDocsStatus = 'amber'; // Due soon
            }
          });
          
          sectionStatusSummary.push({
            title: 'Compliance Documents',
            status: statusMapping[keyDocsStatus],
            updated: new Date().toLocaleDateString('en-GB')
          });
        }

        // Add Actions Summary status (at the end to match dashboard order)
        if (meetingData.dashboardData?.sections) {
          const actionsStatus = getActionsOverallStatus(meetingData.dashboardData.sections);
          sectionStatusSummary.push({
            title: 'Actions Summary',
            status: statusMapping[actionsStatus],
            updated: new Date().toLocaleDateString('en-GB')
          });
        }
        
        if (sectionStatusSummary.length === 0) return '';
        
        return `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #374151; margin-bottom: 16px;">Status Overview:</h3>
            <div style="background-color: #F9FAFB; padding: 16px; border-radius: 8px; border-left: 4px solid #3B82F6;">
              ${sectionStatusSummary.map(item => `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 12px; background-color: white; border-radius: 4px;">
                  <span style="color: #374151; font-weight: 500; margin-right: 16px;">${item.title}</span>
                  <div style="display: flex; align-items: center; gap: 16px;">
                    <span style="
                      display: inline-block;
                      width: 20px;
                      height: 20px;
                      border-radius: 3px;
                      text-align: center;
                      font-size: 12px;
                      font-weight: bold;
                      color: white;
                      line-height: 20px;
                      background-color: ${item.status === 'G' ? '#10B981' : item.status === 'A' ? '#F59E0B' : '#EF4444'};
                    ">${item.status}</span>
                    <span style="color: #6B7280; font-size: 12px; margin-left: 8px;">Updated: ${item.updated}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      };

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
      const getCurrentUserActions = (attendeeEmail: string, sourceActions: any[] = meetingData.actions) => {
        const currentAttendee = meetingData.attendees.find(att => att.email === attendeeEmail);
        const currentAttendeeName = currentAttendee?.name || '';
        
        return sourceActions.filter(action => {
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
      const getOfficeTeamActions = (attendeeEmail: string, sourceActions: any[] = meetingData.actions) => {
        const currentAttendee = meetingData.attendees.find(att => att.email === attendeeEmail);
        const currentAttendeeName = currentAttendee?.name || '';
        
        return sourceActions.filter(action => {
          const assignee = action.mentionedAttendee || action.mentioned_attendee || action.assignee || action.assigned_to || action.owner || '';
          
          // Exclude actions assigned to current user, include all others with assignees
          const isMyAction = assignee.toLowerCase().includes(attendeeEmail.toLowerCase()) || 
                           (currentAttendeeName && assignee.toLowerCase().includes(currentAttendeeName.toLowerCase())) ||
                           assignee.toLowerCase().includes('my') || 
                           assignee.toLowerCase().includes('me');
          
          return !isMyAction && assignee.trim() !== '';
        });
      };

      // Sort actions by due date (soonest first)
      const sortActionsByDueDate = (actions: any[]) => {
        return actions.sort((a, b) => {
          const parseDueDate = (dueDate: string): Date => {
            if (!dueDate || dueDate.trim() === '') return new Date('9999-12-31');
            
            // Handle DD/MM/YYYY format (e.g., "28/07/2026")
            if (dueDate.includes('/') && dueDate.split('/').length === 3) {
              const parts = dueDate.split('/');
              if (parts.length === 3 && parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
                // DD/MM/YYYY format - convert to YYYY-MM-DD
                const [day, month, year] = parts;
                return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
              }
            }
            // Try standard parsing
            return new Date(dueDate);
          };
          
          const aDueDate = parseDueDate(a.dueDate || a.due_date || a.targetDate || a.target_date || '');
          const bDueDate = parseDueDate(b.dueDate || b.due_date || b.targetDate || b.target_date || '');
          
          // Sort by date ascending (overdue and soonest first)
          return aDueDate.getTime() - bDueDate.getTime();
        });
      };

      // Helpers for completed actions detection and date parsing
      const parseFlexibleDate = (dateStr?: string): Date | null => {
        if (!dateStr || dateStr.trim() === '') return null;
        if (dateStr.includes('/') && dateStr.split('/').length === 3) {
          const [day, month, year] = dateStr.split('/');
          if (year && month && day) {
            return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
          }
        }
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d;
      };

      const isActionCompleted = (action: any): boolean => {
        const closedBool = action.closed === true || action.isClosed === true;
        const statusStr = (action.status || '').toString().toLowerCase();
        return closedBool || statusStr === 'closed' || statusStr === 'complete' || statusStr === 'completed' || statusStr === 'done';
      };

      const getClosedDate = (action: any): Date | null => {
        const cd = parseFlexibleDate(action.closedDate || action.closed_date || action.completedDate || action.completed_date);
        if (cd) return cd;
        const updated = parseFlexibleDate(action.updated_at || action.updatedAt);
        return isActionCompleted(action) && updated ? updated : null;
      };

      const isWithinLastNDays = (date: Date, days: number) => {
        const now = new Date();
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        return date >= cutoff && date <= now;
      };

      const getRecentCompletedActions = (actions: any[], days = 30) => {
        return actions.filter(a => {
          if (!isActionCompleted(a)) return false;
          const d = getClosedDate(a);
          return d ? isWithinLastNDays(d, days) : false;
        });
      };

      // Format dashboard actions with enhanced information
      const formatDashboardActionSection = (actions: any[], title: string) => {
        if (actions.length === 0) {
          return `<div style="margin-bottom: 16px;"><h4 style="color: #374151; margin: 8px 0; font-size: 16px;">${title} (0)</h4><p style="color: #6B7280; font-style: italic;">No actions</p></div>`;
        }

        return `
          <div style="margin-bottom: 16px;">
            <h4 style="color: #374151; margin: 8px 0; font-size: 16px;">${title} (${actions.length})</h4>
            <ul style="margin: 0; padding-left: 20px;">
              ${actions.map((action: any) => {
                const formatDateSafely = (dateString: string) => {
                  if (!dateString) return 'No due date';
                  try {
                    if (dateString.includes('/')) {
                      const [day, month, year] = dateString.split('/');
                      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                      return !isNaN(date.getTime()) ? date.toLocaleDateString() : dateString;
                    }
                    const date = new Date(dateString);
                    return !isNaN(date.getTime()) ? date.toLocaleDateString() : dateString;
                  } catch (error) {
                    return dateString;
                  }
                };

                return `
                  <li style="margin-bottom: 12px; color: #6B7280; line-height: 1.5;">
                    ${action.description ? `<div style="margin-bottom: 4px;"><strong style="color: #374151;">${action.description}</strong></div>` : '<div style="margin-bottom: 4px;"><strong style="color: #374151;">No description</strong></div>'}
                    <div style="margin-bottom: 4px; font-size: 14px; color: #6B7280;">👤 ${action.assignedTo || action.name || 'Unassigned'}</div>
                    <div style="font-size: 14px; color: #6B7280;">📄 From: ${action.sectionTitle} → ${action.itemTitle}</div>
                    ${action.targetDate ? `<div style="font-size: 14px; color: #6B7280;">📅 Due: ${formatDateSafely(action.targetDate)}</div>` : ''}
                    ${action.isCompleted && action.completedAt ? `<div style="font-size: 14px; color: #10B981;">✅ Completed: ${formatDateSafely(action.completedAt)}</div>` : ''}
                  </li>
                `;
              }).join('')}
            </ul>
          </div>
        `;
      };

      // Format action items with categories
      const formatActionSection = (actions: any[], title: string) => {
        if (actions.length === 0) return '';
        
        // Sort actions by due date within the group
        const sortedActions = sortActionsByDueDate([...actions]);
        
        return `
          <h4 style="color: #374151; margin: 16px 0 8px 0; font-size: 16px;">${title} (${sortedActions.length})</h4>
          <ul style="margin: 0; padding-left: 20px;">
            ${sortedActions.map((action, index) => {
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
                  ${(action.itemTitle || action.section || action.sectionTitle) ? `<div style="font-size: 14px; color: #6B7280;">📄 From: ${action.itemTitle || action.section || action.sectionTitle}</div>` : ''}
                </li>
              `;
            }).join('')}
          </ul>
        `;
      };

      // Function to generate personalized action items HTML for each attendee
      const generateActionItemsHtml = (attendeeEmail: string) => {
        // Use dashboard sections if available, otherwise fallback to legacy actions
        if (meetingData.dashboardData?.sections) {
          const currentAttendee = meetingData.attendees.find(att => att.email === attendeeEmail);
          const currentAttendeeName = currentAttendee?.name || '';
          
          console.log(`📧 Processing dashboard actions for ${attendeeEmail} (${currentAttendeeName})`);
          const processedActions = processActionsFromSections(meetingData.dashboardData.sections, currentAttendeeName);
          console.log(`📊 Processed ${processedActions.length} total actions from dashboard sections`);
          
          const myOpenActions = processedActions.filter(action => action.isMyAction && !action.isCompleted);
          const myClosedActions = processedActions.filter(action => action.isMyAction && action.isCompleted && action.isWithinLast30Days);
          const officeTeamOpenActions = processedActions.filter(action => !action.isMyAction && !action.isCompleted);
          const officeTeamClosedActions = processedActions.filter(action => !action.isMyAction && action.isCompleted && action.isWithinLast30Days);

          console.log(`📧 Dashboard Actions for ${attendeeEmail}:`, {
            myOpen: myOpenActions.length,
            myClosed: myClosedActions.length,
            officeOpen: officeTeamOpenActions.length,
            officeClosed: officeTeamClosedActions.length
          });

          if (processedActions.length === 0) {
            console.log('⚠️ No actions found in dashboard sections for email');
            return `
              <div style="margin-bottom: 30px;">
                <h3 style="color: #374151; margin-bottom: 16px;">Actions Summary</h3>
                <div style="background-color: #F9FAFB; padding: 16px; border-radius: 8px; border-left: 4px solid #3B82F6;">
                  <p style="color: #6B7280; font-style: italic;">No action items at this time</p>
                </div>
              </div>
            `;
          }

          return `
            <div style="margin-bottom: 30px;">
              <h3 style="color: #374151; margin-bottom: 16px;">Actions Summary</h3>
              <div style="background-color: #F9FAFB; padding: 16px; border-radius: 8px; border-left: 4px solid #3B82F6;">
                ${formatDashboardActionSection(myOpenActions, 'My Open Actions')}
                ${formatDashboardActionSection(myClosedActions, 'My Closed Actions (Last 30 Days)')}
                ${formatDashboardActionSection(officeTeamOpenActions, 'Office Team Open Actions')}
                ${formatDashboardActionSection(officeTeamClosedActions, 'Office Team Closed Actions (Last 30 Days)')}
              </div>
            </div>
          `;
        }

        // Fallback to legacy action processing
        const completedRecent = getRecentCompletedActions(meetingData.actions, 30);
        const openActions = meetingData.actions.filter(a => !isActionCompleted(a));

        // Get actions for current user and office team - only from OPEN actions
        const myOpenActions = getCurrentUserActions(attendeeEmail, openActions);
        const officeTeamOpenActions = getOfficeTeamActions(attendeeEmail, openActions);

        console.log(`📧 Legacy Actions for ${attendeeEmail}:`, {
          myOpenActions: myOpenActions.length,
          officeTeamOpenActions: officeTeamOpenActions.length,
          completedRecent: completedRecent.length,
          companyServices: meetingData.companyServices,
          myActionsList: myOpenActions.map(a => ({ text: a.action || a.actionText, assignee: a.mentionedAttendee || a.assignee })),
          officeActionsList: officeTeamOpenActions.map(a => ({ text: a.action || a.actionText, assignee: a.mentionedAttendee || a.assignee }))
        });

        let actionItemsHtml = '';
        
        // Only show open action items if there are any
        if (openActions.length > 0) {
          actionItemsHtml = `
            <h3 style="color: #374151; margin-bottom: 16px;">Action Items (${openActions.length} total):</h3>
            ${formatActionSection(myOpenActions, 'My Actions')}
            ${formatActionSection(officeTeamOpenActions, 'Office Team')}
          `;
        }

        // Add completed actions section if there are any recent completions
        if (completedRecent.length > 0) {
          actionItemsHtml += `
            <h3 style="color: #374151; margin-bottom: 16px; margin-top: 30px;">Completed Actions (Last 30 Days):</h3>
            ${formatActionSection(completedRecent, 'Recently Completed')}
          `;
        }

        // If no actions at all
        if (openActions.length === 0 && completedRecent.length === 0) {
          actionItemsHtml = '<h3 style="color: #374151; margin-bottom: 16px;">Action Items:</h3><p style="color: #6B7280;">No action items recorded.</p>';
        }

        return actionItemsHtml;
      };

      // Send emails to all attendees with rate limiting
      console.log('📤 Starting to send emails to:', attendeeEmails.length, 'recipients');
      
      const results = [];
      
      for (let i = 0; i < attendeeEmails.length; i++) {
        const email = attendeeEmails[i];
        
        try {
          console.log(`📧 Sending email ${i + 1}/${attendeeEmails.length} to: ${email}`);
          
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
              
              ${generateStatusSummary()}
              
              ${shouldIncludeSummary ? `
              <div style="margin-bottom: 30px;">
                <h3 style="color: #374151; margin-bottom: 16px;">Meeting Summary:</h3>
                <div style="background-color: #F9FAFB; padding: 16px; border-radius: 8px; border-left: 4px solid #3B82F6;">
                  <p style="color: #6B7280; margin: 0; line-height: 1.6;">${meetingSummaryText}</p>
                </div>
              </div>
              ` : `
              <div style="margin-bottom: 30px;">
                <h3 style="color: #374151; margin-bottom: 16px;">Meeting Summary:</h3>
                <div style="background-color: #F9FAFB; padding: 16px; border-radius: 8px; border-left: 4px solid #3B82F6;">
                  <p style="color: #9CA3AF; margin: 0; line-height: 1.6; font-style: italic;">No meeting summary provided</p>
                </div>
              </div>
              `}

              <div style="margin-bottom: 30px;">
                ${personalizedActionItemsHtml}
              </div>

              <div style="margin-bottom: 30px; text-align: center;">
                <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; border: 1px solid #D1D5DB;">
                  <p style="color: #374151; margin: 0 0 12px 0; font-size: 16px;">You can view the dashboard by using the 
                    <a href="https://ccmd.co.uk" 
                       style="color: #3B82F6; text-decoration: none; font-weight: bold;">LINK</a>
                  </p>
                </div>
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
              subject: `${meetingData.companyName ? meetingData.companyName + ' - ' : ''}${meetingData.title} - ${new Date(meetingData.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
              html: emailHtml,
              from: 'CCMD <noreply@ccmd.co.uk>'
            }
          });

          console.log(`📧 Email response for ${email}:`, { data, error });

          if (error) {
            console.error(`❌ Failed to send email to ${email}:`, error);
            results.push({ email, success: false, error: error.message });
          } else {
            console.log(`✅ Email sent successfully to ${email}`);
            results.push({ email, success: true });
          }
        } catch (error) {
          console.error(`❌ Error sending email to ${email}:`, error);
          results.push({ email, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }

        // Add delay between emails to respect Resend's rate limit (2 requests per second)
        // Wait 600ms between emails to stay safely under the limit
        if (i < attendeeEmails.length - 1) {
          console.log('⏳ Waiting 600ms before next email to respect rate limits...');
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      }
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      // If emails were sent successfully, create a follow-up tracking record
      if (successCount > 0) {
        try {
          console.log('📝 Creating follow-up tracking record...');
          
          // Calculate follow-up date (3.5 days from now)
          const followUpDate = new Date();
          followUpDate.setDate(followUpDate.getDate() + 3);
          followUpDate.setHours(followUpDate.getHours() + 12); // Add 12 hours for 3.5 days
          
          // Get company_id from profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
            .single();
          
          if (profileData?.company_id) {
            // Prepare attendees data with emails only for those who received emails
            const attendeesWithEmails = meetingData.attendees
              .filter(attendee => results.some(r => r.email === attendee.email && r.success))
              .map(attendee => ({
                name: attendee.name,
                email: attendee.email
              }));

            const { error: trackingError } = await supabase
              .from('meeting_email_tracking')
              .insert({
                company_id: profileData.company_id,
                meeting_date: meetingData.date,
                meeting_title: meetingData.title,
                follow_up_scheduled_for: followUpDate.toISOString(),
                attendees: attendeesWithEmails,
                dashboard_data: meetingData.dashboardData
              });

            if (trackingError) {
              console.error('❌ Failed to create follow-up tracking record:', trackingError);
            } else {
              console.log('✅ Follow-up reminder scheduled for:', followUpDate.toISOString());
            }
          }
        } catch (trackingError) {
          console.error('❌ Error creating follow-up tracking:', trackingError);
          // Don't fail the whole operation if tracking fails
        }
      }

      if (successCount === totalCount) {
        toast({
          title: "Emails Sent",
          description: `Meeting summary sent to all ${totalCount} attendees. Follow-up reminder scheduled for 3.5 days.`,
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