import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { Attendee } from "@/components/MeetingAttendeesManager";
import { DashboardSection } from "@/components/DashboardSection";
import { ActionsLog, ActionLogEntry } from "@/components/ActionsLog";
import { KeyDocumentTracker, DocumentData } from "@/components/KeyDocumentTracker";
import { StatusItemData } from "@/components/StatusItem";
import { ActionItem } from "@/components/ActionForm";
import { StatusType } from "@/components/StatusBadge";
import { Users, Target, BarChart3, FileText, Heart, Shield, Calendar, UserCheck, ClipboardList, HeartHandshake, TrendingUp, Save, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Index = () => {
  const [actionsLog, setActionsLog] = useState<ActionLogEntry[]>([]);

  // Reset actions log function
  const resetActionsLog = async () => {
    try {
      // Clear local state
      setActionsLog([]);
      
      // Clear from database by updating all meetings to have empty actions_log
      const { error } = await supabase
        .from('meetings')
        .update({ actions_log: [] })
        .not('id', 'is', null);
      
      if (error) throw error;
      
      toast({
        title: "Actions Log Reset",
        description: "All actions have been cleared successfully"
      });
    } catch (error) {
      console.error('Error resetting actions log:', error);
      toast({
        title: "Error",
        description: "Failed to reset actions log",
        variant: "destructive"
      });
    }
  };
  const [keyDocuments, setKeyDocuments] = useState<DocumentData[]>([]);
  const { toast } = useToast();
  
  const [headerData, setHeaderData] = useState({
    date: (() => {
      const now = new Date();
      now.setMinutes(0, 0, 0); // Set to beginning of current hour
      return now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
             now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    })(),
    title: "Strategic Planning Session",
    attendees: [
      { id: "1", name: "John Smith", email: "john.smith@company.com" },
      { id: "2", name: "Sarah Johnson", email: "sarah.johnson@company.com" },
      { id: "3", name: "Mike Chen", email: "mike.chen@company.com" },
      { id: "4", name: "Lisa Rodriguez", email: "lisa.rodriguez@company.com" }
    ] as Attendee[],
    purpose: "Review Q4 performance and set strategic priorities for 2025"
  });

  const [dashboardData, setDashboardData] = useState({
    date: "24/07/2025",
    title: "Management Meeting (Weekly)",
    attendees: "Manager, Team Leader, Senior Carer",
    purpose: "Weekly review of care quality and operational matters",
    sections: [{
      id: "meeting-overview",
      title: "Meeting Overview",
      icon: <Calendar className="w-6 h-6 text-blue-600" />,
      items: [{
        id: "meeting-date",
        title: "Meeting Date",
        status: "green" as StatusType,
        lastReviewed: "24-Jul-25",
        observation: "24/07/2025",
        actions: [],
        details: "Current meeting date"
      }, {
        id: "meeting-attendees",
        title: "Meeting Attendees",
        status: "green" as StatusType,
        lastReviewed: "24-Jul-25",
        observation: "Manager, Team Leader, Senior Carer",
        actions: [],
        details: "Key staff members present"
      }, {
        id: "meeting-purpose",
        title: "Meeting Purpose",
        status: "green" as StatusType,
        lastReviewed: "24-Jul-25",
        observation: "Weekly review of care quality and operational matters",
        actions: [],
        details: "Meeting objectives and goals"
      }]
    }, {
      id: "staff",
      title: "Staff",
      icon: <Users className="w-6 h-6 text-purple-600" />,
      items: [{
        id: "recruitment",
        title: "Resourcing",
        status: "amber" as StatusType,
        lastReviewed: "23-Jul-25",
        observation: "Recruitment to be paused.",
        actions: [],
        details: "Several positions still vacant. Need to review strategy and budget allocation."
      }, {
        id: "staff-documents",
        title: "Staff Documents",
        status: "amber" as StatusType,
        lastReviewed: "23-Jul-25",
        observation: "Currently processing 3 starters. Employment History - Callista working on 2 remaining staff.",
        actions: [],
        details: "Document compliance tracking ongoing. Priority focus on completing outstanding employment history checks."
      }, {
        id: "training",
        title: "Training",
        status: "amber" as StatusType,
        lastReviewed: "23-Jul-25",
        observation: "Several staff members still have not completed mandatory training - by the 31st of July.",
        actions: [],
        details: "Training compliance deadline approaching. Need immediate action for staff completion."
      }, {
        id: "spot-checks",
        title: "Spot Checks",
        status: "amber" as StatusType,
        lastReviewed: "23-Jul-25",
        observation: "3 spot checks are due - Callista to send their names to Sam/Melissa - by 23rd",
        actions: [],
        details: "Regular quality assurance spot checks due for completion."
      }, {
        id: "staff-supervisions",
        title: "Staff Supervisions",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        observation: "1 person pending supervision, 1 person pending probation review",
        actions: [],
        details: "Supervision schedule mostly on track with minimal outstanding items."
      }, {
        id: "staff-meetings",
        title: "Staff Meetings",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        observation: "Regular team meetings scheduled and conducted",
        actions: [],
        details: "Monthly staff meetings proceeding as planned"
      }]
    }, {
      id: "care-planning",
      title: "Care Planning & Delivery",
      icon: <HeartHandshake className="w-6 h-6 text-green-600" />,
      items: [{
        id: "care-plans",
        title: "Care Plans & Risk Assessments",
        status: "red" as StatusType,
        lastReviewed: "23-Jul-25",
        observation: "4 service users do not have a care plan in place. Please check the initial visit content to determine if all service users are documented correctly.",
        actions: [],
        details: "Critical compliance issue requiring immediate attention for service user safety."
      }, {
        id: "service-user-docs",
        title: "Service User Documents",
        status: "red" as StatusType,
        lastReviewed: "23-Jul-25",
        observation: "Initial consent to deliver of all service users and documented evidence. No forms when handed goes to Denean 11/07/25",
        actions: [],
        details: "Documentation compliance critical for service delivery authorization."
      }, {
        id: "medication",
        title: "Medication Management",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        observation: "Up to date - no concerns",
        actions: [],
        details: "All medication protocols and documentation current and compliant."
      }, {
        id: "care-notes",
        title: "Care Notes",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        observation: "Daily care notes being completed consistently",
        actions: [],
        details: "Care documentation up to date and compliant"
      }, {
        id: "call-monitoring",
        title: "Call Monitoring",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        observation: "Call monitoring system functioning well",
        actions: [],
        details: "Regular monitoring of care visits and timing"
      }]
    }, {
      id: "safety",
      title: "Safety",
      icon: <Shield className="w-6 h-6 text-red-600" />,
      items: [{
        id: "incidents-accidents",
        title: "Incidents & Accidents",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        observation: "No recent incidents reported",
        actions: [],
        details: "Incident reporting system functioning well"
      }, {
        id: "risk-register",
        title: "Risk Register",
        status: "amber" as StatusType,
        lastReviewed: "23-Jul-25",
        observation: "Risk register requires quarterly review",
        actions: [],
        details: "Some risks need updating and reassessment"
      }, {
        id: "infection-control",
        title: "Infection Control",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        observation: "Infection control measures in place and effective",
        actions: [],
        details: "PPE supplies adequate, procedures being followed"
      }]
    }, {
      id: "continuous-improvement",
      title: "Continuous Improvement",
      icon: <TrendingUp className="w-6 h-6 text-indigo-600" />,
      items: [{
        id: "feedback",
        title: "Feedback",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        observation: "Number of service users due for feedback, Callista to follow up",
        actions: [],
        details: "Regular feedback collection from service users proceeding as scheduled."
      }, {
        id: "audits",
        title: "Audits",
        status: "green" as StatusType,
        lastReviewed: "23-Jul-25",
        observation: "6 completed, progress is ongoing",
        actions: [],
        details: "Audit schedule progressing well with good completion rate."
      }]
    }]
  });

  const handleDataChange = (field: string, value: string) => {
    setHeaderData(prev => ({
      ...prev,
      [field]: value
    }));
    toast({
      title: "Field Updated",
      description: `${field.charAt(0).toUpperCase() + field.slice(1)} has been updated`
    });
  };

  const handleAttendeesChange = (attendees: Attendee[]) => {
    setHeaderData(prev => ({
      ...prev,
      attendees
    }));
    toast({
      title: "Attendees Updated",
      description: "Meeting attendees have been updated"
    });
  };
  
  const handleStatusChange = (sectionId: string, itemId: string, newStatus: StatusType) => {
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? {
          ...section,
          items: section.items.map(item => 
            item.id === itemId ? {
              ...item,
              status: newStatus,
              lastReviewed: new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit'
              })
            } : item
          )
        } : section
      )
    }));
    toast({
      title: "Status Updated",
      description: `Item status changed to ${newStatus}`
    });
  };

  const handleObservationChange = (sectionId: string, itemId: string, newObservation: string) => {
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? {
          ...section,
          items: section.items.map(item => 
            item.id === itemId ? {
              ...item,
              observation: newObservation,
              lastReviewed: new Date().toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })
            } : item
          )
        } : section
      )
    }));
    toast({
      title: "Observation Updated",
      description: "Item observation has been saved"
    });
  };

  const handleActionsChange = (sectionId: string, itemId: string, newActions: ActionItem[]) => {
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? {
          ...section,
          items: section.items.map(item => 
            item.id === itemId ? {
              ...item,
              actions: newActions,
              lastReviewed: new Date().toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })
            } : item
          )
        } : section
      )
    }));
    toast({
      title: "Actions Updated",
      description: "Item actions have been saved"
    });
  };

  const handleDocumentsChange = (sectionId: string, itemId: string, newDocuments: import("@/components/StatusItem").DocumentData[]) => {
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? {
          ...section,
          items: section.items.map(item => 
            item.id === itemId ? {
              ...item,
              documents: newDocuments,
              lastReviewed: new Date().toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })
            } : item
          )
        } : section
      )
    }));
    toast({
      title: "Documents Updated",
      description: "Item documents have been saved"
    });
  };
  
  const handleActionCreated = (itemTitle: string, mentionedAttendee: string, comment: string, action: string, dueDate: string, subsectionActionId?: string) => {
    const actionId = subsectionActionId || `action-${Date.now()}`;
    const newAction: ActionLogEntry = {
      id: actionId,
      timestamp: new Date().toLocaleString(),
      itemTitle,
      mentionedAttendee,
      comment,
      action,
      dueDate,
      status: "green",
      closed: false,
      sourceType: "manual",
      sourceId: subsectionActionId ? `subsection-${itemTitle}` : undefined
    };
    
    setActionsLog(prev => [newAction, ...prev]);
    
    toast({
      title: "Action Created",
      description: `Action assigned to @${mentionedAttendee} for ${itemTitle}`
    });
  };

  const handleDocumentActionCreated = (actionData: { itemTitle: string; mentionedAttendee: string; comment: string; action: string; dueDate: string; sourceType: "document"; sourceId: string; }) => {
    const newAction: ActionLogEntry = {
      id: `action-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      itemTitle: actionData.itemTitle,
      mentionedAttendee: actionData.mentionedAttendee,
      comment: actionData.comment,
      action: actionData.action,
      dueDate: actionData.dueDate,
      status: "green",
      closed: false,
      sourceType: actionData.sourceType,
      sourceId: actionData.sourceId
    };
    
    setActionsLog(prev => [newAction, ...prev]);
    
    toast({
      title: "Action Created",
      description: `Action assigned to @${actionData.mentionedAttendee} for ${actionData.itemTitle}`
    });
  };
  
  const handleActionComplete = (actionId: string) => {
    // Mark action as complete in actions log
    setActionsLog(prev => prev.map(action => 
      action.id === actionId 
        ? { ...action, closed: true, closedDate: new Date().toISOString() }
        : action
    ));

    // Remove the completed action from section items
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => ({
        ...section,
        items: section.items.map(item => ({
          ...item,
          actions: item.actions.filter(action => action.id !== actionId)
        }))
      }))
    }));
    
    toast({
      title: "Action Completed",
      description: "Action has been marked as complete"
    });
  };

  const handleActionDelete = (actionId: string) => {
    // Remove action from actions log
    setActionsLog(prev => prev.filter(action => action.id !== actionId));

    // Remove action from section items
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => ({
        ...section,
        items: section.items.map(item => ({
          ...item,
          actions: item.actions.filter(action => action.id !== actionId)
        }))
      }))
    }));
    
    toast({
      title: "Action Deleted",
      description: "Action has been removed"
    });
  };

  const handleDocumentActionRemoved = (sourceId: string) => {
    // Remove any actions that came from this document
    setActionsLog(prev => prev.filter(action => 
      !(action.sourceType === "document" && action.sourceId === sourceId)
    ));
  };

  const handleDocumentActionUpdated = (sourceId: string, newDueDate: string, newAction: string) => {
    // Update any actions that came from this document
    setActionsLog(prev => prev.map(action => 
      (action.sourceType === "document" && action.sourceId === sourceId)
        ? { ...action, dueDate: newDueDate, action: newAction }
        : action
    ));
  };

  const handleActionEdit = (actionId: string, updates: { comment?: string; dueDate?: string }) => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Update action in Actions Log
    setActionsLog(prev => prev.map(action => {
      if (action.id !== actionId) return action;
      
      const updatedAction = { ...action };
      const auditEntries: import("@/components/ActionsLog").AuditEntry[] = action.auditTrail || [];

      // Add comment to audit trail
      if (updates.comment) {
        auditEntries.push({
          timestamp,
          change: `Comment added: ${updates.comment}`
        });
      }

      // Update due date and add to audit trail
      if (updates.dueDate && updates.dueDate !== action.dueDate) {
        auditEntries.push({
          timestamp,
          change: `Due date changed from ${action.dueDate} to ${updates.dueDate}`
        });
        updatedAction.dueDate = updates.dueDate;
      }

      updatedAction.auditTrail = auditEntries;
      return updatedAction;
    }));

    // Sync the same changes to subsection actions using the same actionId
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => ({
        ...section,
        items: section.items.map(item => ({
          ...item,
          actions: item.actions.map(action => {
            if (action.id !== actionId) return action;
            
            const updatedAction = { ...action };
            const auditEntries: import("@/components/ActionsLog").AuditEntry[] = action.auditTrail || [];

            // Add comment to audit trail
            if (updates.comment) {
              auditEntries.push({
                timestamp,
                change: `Comment added: ${updates.comment}`
              });
            }

            // Update due date and add to audit trail
            if (updates.dueDate && updates.dueDate !== action.targetDate) {
              auditEntries.push({
                timestamp,
                change: `Due date changed from ${action.targetDate} to ${updates.dueDate}`
              });
              updatedAction.targetDate = updates.dueDate;
            }

            updatedAction.auditTrail = auditEntries;
            return updatedAction;
          })
        }))
      }))
    }));

    toast({
      title: "Action Updated",
      description: "Action has been updated successfully"
    });
  };

  const handleSubsectionActionEdit = (sectionId: string, actionId: string, updates: { comment?: string; dueDate?: string }) => {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Update the action in the subsection
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? {
          ...section,
          items: section.items.map(item => ({
            ...item,
            actions: item.actions.map(action => {
              if (action.id !== actionId) return action;
              
              const updatedAction = { ...action };
              const auditEntries: import("@/components/ActionsLog").AuditEntry[] = action.auditTrail || [];

              // Add comment to audit trail
              if (updates.comment) {
                auditEntries.push({
                  timestamp,
                  change: `Comment added: ${updates.comment}`
                });
              }

              // Update due date and add to audit trail
              if (updates.dueDate && updates.dueDate !== action.targetDate) {
                auditEntries.push({
                  timestamp,
                  change: `Due date changed from ${action.targetDate} to ${updates.dueDate}`
                });
                updatedAction.targetDate = updates.dueDate;
              }

              updatedAction.auditTrail = auditEntries;
              return updatedAction;
            })
          }))
        } : section
      )
    }));

    // Update the exact same action in the main Actions Log using the same ID
    setActionsLog(prev => prev.map(action => {
      if (action.id !== actionId) return action;
      
      const updatedAction = { ...action };
      const auditEntries: import("@/components/ActionsLog").AuditEntry[] = action.auditTrail || [];

      // Add comment to audit trail
      if (updates.comment) {
        auditEntries.push({
          timestamp,
          change: `Comment added: ${updates.comment}`
        });
      }

      // Update due date and add to audit trail
      if (updates.dueDate && updates.dueDate !== action.dueDate) {
        auditEntries.push({
          timestamp,
          change: `Due date changed from ${action.dueDate} to ${updates.dueDate}`
        });
        updatedAction.dueDate = updates.dueDate;
      }

      updatedAction.auditTrail = auditEntries;
      return updatedAction;
    }));

    toast({
      title: "Action Updated",
      description: "Action has been updated in both subsection and Actions Log"
    });
  };

  const getAttendeesList = () => {
    return headerData.attendees
      .filter(attendee => attendee.name && attendee.name.trim() !== '') // Filter out empty names
      .map(attendee => attendee.name);
  };

  const calculateStats = () => {
    const allItems = dashboardData.sections.flatMap(section => section.items);
    return {
      green: allItems.filter(item => item.status === "green").length,
      amber: allItems.filter(item => item.status === "amber").length,
      red: allItems.filter(item => item.status === "red").length
    };
  };

  // NEW SAVE MEETING FUNCTIONALITY - REBUILT FROM SCRATCH
  const saveMeetingToDatabase = async () => {
    try {
      // Parse the date from the date-time picker format (dd/MM/yyyy HH:mm)
      const parseDateString = (dateString: string) => {
        try {
          // Try to parse dd/MM/yyyy HH:mm format
          const parts = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
          if (parts) {
            const [, day, month, year, hour, minute] = parts;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
          }
          
          // Fallback to direct parsing
          const directParse = new Date(dateString);
          if (!isNaN(directParse.getTime())) {
            return directParse;
          }
          
          // Last resort - use current date
          return new Date();
        } catch (error) {
          console.error('Error parsing date:', dateString, error);
          return new Date();
        }
      };

      const meetingDate = parseDateString(headerData.date);
      
      // Calculate quarter from date
      const month = meetingDate.getMonth() + 1;
      let quarter = 'Q1';
      if (month <= 3) quarter = 'Q1';
      else if (month <= 6) quarter = 'Q2';
      else if (month <= 9) quarter = 'Q3';
      else quarter = 'Q4';
      
      const year = meetingDate.getFullYear();

      // Prepare clean data for database (remove JSX elements and circular references)
      const cleanSections = dashboardData.sections.map(section => ({
        id: section.id,
        title: section.title,
        items: section.items.map(item => ({
          id: item.id,
          title: item.title,
          status: item.status,
          lastReviewed: item.lastReviewed,
          observation: item.observation,
          actions: item.actions || [],
          details: item.details
        }))
      }));

      const meetingRecord = {
        date: meetingDate.toISOString(),
        title: headerData.title,
        attendees: JSON.stringify(headerData.attendees),
        purpose: headerData.purpose || '',
        sections: JSON.stringify(cleanSections),
        actions_log: JSON.stringify(actionsLog),
        quarter,
        year
      };

      // Save to Supabase
      const { data, error } = await supabase
        .from('meetings')
        .insert([meetingRecord])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        toast({
          title: "Save Failed",
          description: `Failed to save meeting: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      // Success
      toast({
        title: "Meeting Saved",
        description: `Meeting saved successfully under ${quarter} ${year}. Check the Reports page to view it.`,
      });

      console.log('Meeting saved successfully:', data);

    } catch (error) {
      console.error('Error saving meeting:', error);
      toast({
        title: "Save Failed",
        description: "An unexpected error occurred while saving the meeting",
        variant: "destructive"
      });
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('dashboard-container');
    if (!element) return;

    try {
      // Temporarily expand all collapsed sections for PDF
      const expandButtons = element.querySelectorAll('[data-state="closed"]');
      expandButtons.forEach(button => (button as HTMLElement).click());
      
      // Wait for DOM updates
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: element.scrollHeight,
        width: element.scrollWidth
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF Exported",
        description: "Dashboard has been exported as PDF"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export dashboard as PDF",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8">
      <div className="w-[90%] mx-auto space-y-6">
        <div className="flex justify-end gap-4 mb-6">
          <Button 
            onClick={saveMeetingToDatabase}
            variant="outline"
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save Meeting
          </Button>
          <Button 
            onClick={handleExportPDF}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
        
        <div id="dashboard-container">
          <DashboardHeader 
            date={headerData.date} 
            title={headerData.title} 
            attendees={headerData.attendees}
            purpose={headerData.purpose}
            stats={calculateStats()}
            onDataChange={handleDataChange}
            onAttendeesChange={handleAttendeesChange}
          />
          
          {dashboardData.sections.filter(section => section.id !== "meeting-overview").map(section => {
            // Parse the meeting date for analytics
            const parseDateString = (dateString: string) => {
              try {
                const parts = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
                if (parts) {
                  const [, day, month, year, hour, minute] = parts;
                  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
                }
                const directParse = new Date(dateString);
                if (!isNaN(directParse.getTime())) {
                  return directParse;
                }
                return new Date();
              } catch (error) {
                return new Date();
              }
            };
            
            const meetingDate = parseDateString(headerData.date);
            
            return (
               <DashboardSection 
                 key={section.id} 
                 title={section.title} 
                 items={section.items} 
                 onItemStatusChange={(itemId, status) => handleStatusChange(section.id, itemId, status)} 
                 onItemObservationChange={(itemId, observation) => handleObservationChange(section.id, itemId, observation)}
                 onItemActionsChange={(itemId, actions) => handleActionsChange(section.id, itemId, actions)}
                 onItemDocumentsChange={(itemId, documents) => handleDocumentsChange(section.id, itemId, documents)}
                 onActionCreated={handleActionCreated}
                 onSubsectionActionEdit={handleSubsectionActionEdit}
                 attendees={getAttendeesList()}
                 meetingDate={meetingDate}
               />
            );
          })}
          
          <KeyDocumentTracker 
            documents={keyDocuments}
            onDocumentsChange={setKeyDocuments}
            attendees={getAttendeesList()}
            onActionCreated={handleDocumentActionCreated}
            onActionRemoved={handleDocumentActionRemoved}
            onActionUpdated={handleDocumentActionUpdated}
          />
          
          <ActionsLog 
            actions={actionsLog} 
            onActionComplete={handleActionComplete} 
            onActionDelete={handleActionDelete} 
            onResetActions={resetActionsLog}
            onActionEdit={handleActionEdit}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;