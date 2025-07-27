import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Attendee } from "@/components/MeetingAttendeesManager";
import { DashboardSection } from "@/components/DashboardSection";
import { ActionsLog, ActionLogEntry } from "@/components/ActionsLog";
import { KeyDocumentTracker, DocumentData } from "@/components/KeyDocumentTracker";
import { StatusItemData } from "@/components/StatusItem";
import { ActionItem } from "@/components/ActionForm";
import { SubsectionMetadata } from "@/components/SubsectionMetadataDialog";
import { StatusType } from "@/components/StatusBadge";
import { Users, Target, BarChart3, FileText, Heart, Shield, Calendar, UserCheck, ClipboardList, HeartHandshake, TrendingUp, Save, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Index = () => {
  const { profile } = useAuth();
  
  if (!profile?.company_id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Please select a company to continue.</p>
        </div>
      </div>
    );
  }

  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);
  const [tempMeetingId, setTempMeetingId] = useState<string>(() => {
    // Use a company-specific persistent ID for continuous data storage
    const companyId = profile.company_id;
    const persistentId = localStorage.getItem(`persistentMeetingId_${companyId}`);
    if (persistentId) {
      console.log('Index: Using persistent meeting ID:', persistentId);
      return persistentId;
    } else {
      const newId = crypto.randomUUID();
      localStorage.setItem(`persistentMeetingId_${companyId}`, newId);
      console.log('Index: Generated persistent meeting ID:', newId);
      return newId;
    }
  });
  const [actionsLog, setActionsLog] = useState<ActionLogEntry[]>([]);

  // Function to update temporary analytics data with real meeting ID
  const updateTemporaryAnalyticsData = async (tempId: string, realId: string) => {
    try {
      // List of all analytics tables to update
      const analyticsTabels = [
        'resourcing_analytics',
        'care_plan_analytics', 
        'spot_check_analytics',
        'staff_documents_analytics',
        'staff_training_analytics',
        'supervision_analytics'
      ];

      for (const tableName of analyticsTabels) {
        // Get all temporary analytics data for this table
        const { data: tempData } = await supabase
          .from(tableName as any)
          .select('*')
          .eq('meeting_id', tempId);
        
        if (tempData && tempData.length > 0) {
          // Update each record with the real meeting ID
          for (const record of tempData) {
            if (record && typeof record === 'object') {
              const { id, ...recordWithoutId } = record as any;
              await supabase
                .from(tableName as any)
                .upsert({
                  ...recordWithoutId,
                  meeting_id: realId
                });
            }
          }
          
          // Delete the temporary records
          await supabase
            .from(tableName as any)
            .delete()
            .eq('meeting_id', tempId);
        }
      }
    } catch (error) {
      console.error('Error updating temporary analytics data:', error);
    }
  };

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
    title: "",
    attendees: [] as Attendee[],
    purpose: ""
  });

  const [dashboardData, setDashboardData] = useState({
    date: "",
    title: "",
    attendees: "",
    purpose: "",
    sections: [{
      id: "meeting-overview",
      title: "Meeting Overview",
      icon: <Calendar className="w-6 h-6 text-blue-600" />,
      items: [{
        id: "meeting-date",
        title: "Meeting Date",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "meeting-attendees",
        title: "Meeting Attendees",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "meeting-purpose",
        title: "Meeting Purpose",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }]
    }, {
      id: "staff",
      title: "Staff",
      icon: <Users className="w-6 h-6 text-purple-600" />,
      items: [{
        id: "recruitment",
        title: "Resourcing",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "staff-documents",
        title: "Staff Documents",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "training",
        title: "Training",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "spot-checks",
        title: "Spot Checks",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "staff-supervisions",
        title: "Staff Supervisions",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "staff-meetings",
        title: "Staff Meetings",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }]
    }, {
      id: "care-planning",
      title: "Care Planning & Delivery",
      icon: <HeartHandshake className="w-6 h-6 text-green-600" />,
      items: [{
        id: "care-plans",
        title: "Care Plans & Risk Assessments",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "service-user-docs",
        title: "Service User Documents",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "medication",
        title: "Medication Management",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "care-notes",
        title: "Care Notes",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "call-monitoring",
        title: "Call Monitoring",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "transportation",
        title: "Transportation",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }]
    }, {
      id: "safety",
      title: "Safety",
      icon: <Shield className="w-6 h-6 text-red-600" />,
      items: [{
        id: "incidents-accidents",
        title: "Incidents & Accidents",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "risk-register",
        title: "Risk Register",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "infection-control",
        title: "Infection Control",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "information-governance",
        title: "Information Governance",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }]
    }, {
      id: "continuous-improvement",
      title: "Continuous Improvement",
      icon: <TrendingUp className="w-6 h-6 text-indigo-600" />,
      items: [{
        id: "feedback",
        title: "Feedback",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "audits",
        title: "Audits",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }]
    }]
  });

  // Load existing subsection data from database on component mount
  useEffect(() => {
    const loadSubsectionData = async () => {
      if (!profile?.company_id) return;

      try {
        const { data, error } = await supabase
          .from('subsection_data')
          .select('*')
          .eq('company_id', profile.company_id);

        if (error) {
          console.error('Error loading subsection data:', error);
          return;
        }

        if (data && data.length > 0) {
          // Update dashboard data with loaded information
          setDashboardData(prev => ({
            ...prev,
            sections: prev.sections.map(section => ({
              ...section,
              items: section.items.map(item => {
                const savedData = data.find(d => 
                  d.section_id === section.id && d.item_id === item.id
                );
                
                if (savedData) {
                  return {
                    ...item,
                    observation: (savedData.observation as string) || item.observation,
                    actions: savedData.actions ? (typeof savedData.actions === 'string' ? JSON.parse(savedData.actions) : savedData.actions) : item.actions,
                    metadata: savedData.metadata ? (typeof savedData.metadata === 'string' ? JSON.parse(savedData.metadata) : savedData.metadata) : (item.metadata || {}),
                    lastReviewed: savedData.updated_at ? new Date(savedData.updated_at).toLocaleDateString('en-GB') : item.lastReviewed
                  };
                }
                return item;
              })
            }))
          }));
        }
      } catch (error) {
        console.error('Failed to load subsection data:', error);
      }
    };

    loadSubsectionData();
  }, [profile?.company_id]);

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

  const handleObservationChange = async (sectionId: string, itemId: string, newObservation: string) => {
    // Update local state
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? {
          ...section,
          items: section.items.map(item => 
            item.id === itemId ? {
              ...item,
              observation: newObservation,
              lastReviewed: new Date().toLocaleDateString('en-GB')
            } : item
          )
        } : section
      )
    }));

    // Save to database immediately for persistence
    if (profile?.company_id) {
      try {
        const { error } = await supabase
          .from('subsection_data')
          .upsert({
            company_id: profile.company_id,
            section_id: sectionId,
            item_id: itemId,
            observation: newObservation
          }, {
            onConflict: 'company_id,section_id,item_id'
          });
        
        if (error) {
          console.error('Error saving observation:', error);
        }
      } catch (error) {
        console.error('Failed to save observation to database:', error);
      }
    }

    toast({
      title: "Observation Updated",
      description: "Item observation has been saved"
    });
  };

  const handleActionsChange = async (sectionId: string, itemId: string, newActions: ActionItem[]) => {
    // Update local state
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? {
          ...section,
          items: section.items.map(item => 
            item.id === itemId ? {
              ...item,
              actions: newActions,
              lastReviewed: new Date().toLocaleDateString('en-GB')
            } : item
          )
        } : section
      )
    }));

    // Save to database immediately for persistence
    if (profile?.company_id) {
      try {
        const { error } = await supabase
          .from('subsection_data')
          .upsert({
            company_id: profile.company_id,
            section_id: sectionId,
            item_id: itemId,
            actions: JSON.stringify(newActions)
          }, {
            onConflict: 'company_id,section_id,item_id'
          });
        
        if (error) {
          console.error('Error saving actions:', error);
        }
      } catch (error) {
        console.error('Failed to save actions to database:', error);
      }
    }

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
              lastReviewed: new Date().toLocaleDateString('en-GB')
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

  const handleMetadataChange = async (sectionId: string, itemId: string, metadata: SubsectionMetadata) => {
    // Update local state
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? {
          ...section,
          items: section.items.map(item => 
            item.id === itemId ? {
              ...item,
              metadata: metadata,
            } : item
          )
        } : section
      )
    }));

    // Save to database immediately for persistence
    if (profile?.company_id) {
      try {
        const { error } = await supabase
          .from('subsection_data')
          .upsert({
            company_id: profile.company_id,
            section_id: sectionId,
            item_id: itemId,
            metadata: JSON.stringify(metadata)
          }, {
            onConflict: 'company_id,section_id,item_id'
          });
        
        if (error) {
          console.error('Error saving metadata:', error);
        }
      } catch (error) {
        console.error('Failed to save metadata to database:', error);
      }
    }
    
    toast({
      title: "Subsection Updated",
      description: "Subsection details have been saved"
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

  const handleActionComplete = (actionId: string) => {
    // Mark action as complete in actions log
    setActionsLog(prev => prev.map(action => 
      action.id === actionId 
        ? { ...action, closed: true, closedDate: new Date().toISOString() }
        : action
    ));
    
    toast({
      title: "Action Completed",
      description: "Action has been marked as complete"
    });
  };

  const handleActionDelete = (actionId: string) => {
    // Remove action from actions log
    setActionsLog(prev => prev.filter(action => action.id !== actionId));
    
    toast({
      title: "Action Deleted",
      description: "Action has been removed"
    });
  };


  const handleActionEdit = (actionId: string, updates: { comment?: string; dueDate?: string; owner?: string }) => {
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

      // Update owner and add to audit trail
      if (updates.owner && updates.owner !== action.mentionedAttendee) {
        auditEntries.push({
          timestamp,
          change: `Action owner changed to ${updates.owner}`
        });
        updatedAction.mentionedAttendee = updates.owner;
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

            // Update owner and add to audit trail
            if (updates.owner && updates.owner !== action.name) {
              auditEntries.push({
                timestamp,
                change: `Action owner changed to ${updates.owner}`
              });
              updatedAction.name = updates.owner;
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

  const handleSubsectionActionEdit = (sectionId: string, actionId: string, updates: { comment?: string; dueDate?: string; owner?: string }) => {
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

              // Update owner and add to audit trail
              if (updates.owner && updates.owner !== action.name) {
                auditEntries.push({
                  timestamp,
                  change: `Action owner changed to ${updates.owner}`
                });
                updatedAction.name = updates.owner;
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

      // Update owner and add to audit trail
      if (updates.owner && updates.owner !== action.mentionedAttendee) {
        auditEntries.push({
          timestamp,
          change: `Action owner changed to ${updates.owner}`
        });
        updatedAction.mentionedAttendee = updates.owner;
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
        year,
        company_id: profile?.company_id
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

      // Set the current meeting ID for data persistence
      if (data && data[0]) {
        const realMeetingId = data[0].id;
        setCurrentMeetingId(realMeetingId);
        
        // Link the persistent analytics data to this official meeting record
        await updateTemporaryAnalyticsData(tempMeetingId, realMeetingId);
        
        // Keep using the same persistent ID for continuous data storage
        // DO NOT clear localStorage - data should persist across all meetings
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
        
        <div id="dashboard-container" className="space-y-6">
          <DashboardHeader 
            date={headerData.date} 
            title={headerData.title} 
            attendees={headerData.attendees}
            purpose={headerData.purpose}
            stats={calculateStats()}
            onDataChange={handleDataChange}
            onAttendeesChange={handleAttendeesChange}
          />
          
          <ActionsLog 
            actions={actionsLog} 
            onActionComplete={handleActionComplete} 
            onActionDelete={handleActionDelete} 
            onResetActions={resetActionsLog}
            onActionEdit={handleActionEdit}
            attendees={getAttendeesList()}
          />
          
          <KeyDocumentTracker 
            documents={keyDocuments}
            onDocumentsChange={setKeyDocuments}
            attendees={getAttendeesList()}
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
                  onItemMetadataChange={(itemId, metadata) => handleMetadataChange(section.id, itemId, metadata)}
                  onActionCreated={handleActionCreated}
                  onSubsectionActionEdit={handleSubsectionActionEdit}
                  attendees={getAttendeesList()}
                   meetingDate={meetingDate}
                   meetingId={currentMeetingId || tempMeetingId}
                   defaultOpen={false}
                />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;