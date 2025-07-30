import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Attendee } from "@/components/MeetingAttendeesManager";
import { DashboardSection } from "@/components/DashboardSection";
import { ActionsLog, ActionLogEntry } from "@/components/ActionsLog";
import { MeetingSummaryPanel } from "@/components/MeetingSummaryPanel";
import { KeyDocumentTracker, DocumentData } from "@/components/KeyDocumentTracker";
import { StatusItemData } from "@/components/StatusItem";
import { ActionItem } from "@/components/ActionForm";
import { SubsectionMetadata } from "@/components/SubsectionMetadataDialog";
import { StatusType } from "@/components/StatusBadge";
import { Users, Target, BarChart3, FileText, Heart, Shield, Calendar, UserCheck, ClipboardList, HeartHandshake, TrendingUp, Save, Download, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Index = () => {
  const { profile } = useAuth();
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);
  const [tempMeetingId, setTempMeetingId] = useState<string>(() => {
    // Use a company-specific persistent ID for continuous data storage
    if (!profile?.company_id) return crypto.randomUUID();
    
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
  const [allSectionsExpanded, setAllSectionsExpanded] = useState<boolean | undefined>(undefined);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [panelStateTracker, setPanelStateTracker] = useState<number>(0); // Force re-render when panels change

  // Function to update temporary analytics data with real meeting ID
  const updateTemporaryAnalyticsData = async (tempId: string, realId: string) => {
    try {
      // Update dashboard_data records that were stored with the temporary session ID
      const { data: tempData, error: fetchError } = await (supabase as any)
        .from('dashboard_data')
        .select('*')
        .eq('meeting_id', tempId);
      
      if (fetchError) {
        console.error('Error fetching temporary dashboard data:', fetchError);
        return;
      }
      
      if (tempData && tempData.length > 0) {
        console.log(`Found ${tempData.length} temporary dashboard data records to update`);
        
        // Update each record with the real meeting ID
        for (const record of tempData) {
          const { id, ...recordWithoutId } = record;
          const { error: updateError } = await (supabase as any)
            .from('dashboard_data')
            .update({ meeting_id: realId })
            .eq('id', id);
          
          if (updateError) {
            console.error('Error updating dashboard data record:', updateError);
          }
        }
        
        console.log('Successfully updated temporary analytics data with real meeting ID');
      } else {
        console.log('No temporary analytics data found to update');
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

  // Auto-save header data with the custom hook
  useAutoSave({
    table: 'meeting_headers',
    data: {
      meeting_date: (() => {
        try {
          const parts = headerData.date.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
          if (parts) {
            const [, day, month, year, hour, minute] = parts;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute)).toISOString();
          }
          return new Date(headerData.date).toISOString();
        } catch (error) {
          return new Date().toISOString();
        }
      })(),
      title: headerData.title,
      attendees: headerData.attendees,
      purpose: headerData.purpose
    },
    dependencies: [headerData],
    onError: (error) => console.error('Auto-save error for meeting headers:', error)
  });

  // Load header data from database on component mount
  useEffect(() => {
    const loadHeaderData = async () => {
      if (!profile?.company_id) return;

      try {
        const { data, error } = await supabase
          .from('meeting_headers')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error loading header data:', error);
          return;
        }

        if (data && data.length > 0) {
          const headerRecord = data[0];
          console.log('Loading header data from database:', headerRecord);
          setHeaderData({
            date: new Date(headerRecord.meeting_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
                  new Date(headerRecord.meeting_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
            title: headerRecord.title || '',
            attendees: Array.isArray(headerRecord.attendees) ? headerRecord.attendees as unknown as Attendee[] : [],
            purpose: headerRecord.purpose || ''
          });
        }
      } catch (error) {
        console.error('Failed to load header data:', error);
      }
    };

    loadHeaderData();
  }, [profile?.company_id]);

  // Load actions log from database on component mount
  useEffect(() => {
    const loadActionsLog = async () => {
      if (!profile?.company_id) return;

      try {
        const { data, error } = await supabase
          .from('actions_log')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading actions log:', error);
          return;
        }

        if (data && data.length > 0) {
          const actions = data.map(record => ({
            id: record.action_id,
            timestamp: record.timestamp,
            itemTitle: record.item_title,
            mentionedAttendee: record.mentioned_attendee,
            comment: record.comment,
            action: record.action_text,
            dueDate: record.due_date,
            status: record.status as "green" | "amber" | "red",
            closed: record.closed,
            closedDate: record.closed_date || undefined,
            sourceType: record.source_type as "manual" | "document",
            sourceId: record.source_id || undefined,
            auditTrail: record.audit_trail as any || []
          }));
          setActionsLog(actions);
        }
      } catch (error) {
        console.error('Failed to load actions log:', error);
      }
    };

    loadActionsLog();
  }, [profile?.company_id]);

  // Load key documents from database on component mount
  useEffect(() => {
    const loadKeyDocuments = async () => {
      if (!profile?.company_id) return;

      try {
        const { data, error } = await supabase
          .from('key_documents')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading key documents:', error);
          return;
        }

        if (data && data.length > 0) {
          const documents = data.map(record => {
            // Parse the notes field to restore saved data
            const notesParts = record.notes ? record.notes.split(' | ') : ['', '', '', '', ''];
            const [owner = '', category = '', lastReviewDate = '', reviewFrequency = '', updatedAt = ''] = notesParts;
            
            return {
              id: record.id,
              name: record.name,
              owner,
              category,
              lastReviewDate,
              reviewFrequency,
              reviewFrequencyNumber: reviewFrequency.split(' ')[0] || '',
              reviewFrequencyPeriod: reviewFrequency.split(' ')[1] || '',
              nextReviewDate: record.due_date || null,
              updatedAt: updatedAt || undefined
            };
          });
          setKeyDocuments(documents);
        }
      } catch (error) {
        console.error('Failed to load key documents:', error);
      }
    };

    loadKeyDocuments();
  }, [profile?.company_id]);

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
      if (!profile?.company_id) {
        setIsDataLoaded(true); // Set as loaded even if no company_id
        return;
      }

      try {
        const { data, error } = await supabase
          .from('subsection_data')
          .select('*')
          .eq('company_id', profile.company_id);

        if (error) {
          console.error('Error loading subsection data:', error);
          setIsDataLoaded(true); // Mark as loaded even on error to prevent infinite loading
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
                    status: savedData.status as StatusType || item.status,
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
        
        setIsDataLoaded(true); // Mark data as loaded
      } catch (error) {
        console.error('Failed to load subsection data:', error);
        setIsDataLoaded(true); // Mark as loaded even on error
      }
    };

    loadSubsectionData();
  }, [profile?.company_id]);

  const handleDataChange = async (field: string, value: string) => {
    setHeaderData(prev => ({
      ...prev,
      [field]: value
    }));

    // Save header data to database immediately
    if (profile?.company_id) {
      try {
        const updatedHeaderData = { ...headerData, [field]: value };
        const parseDateString = (dateString: string) => {
          try {
            const parts = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
            if (parts) {
              const [, day, month, year, hour, minute] = parts;
              return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
            }
            return new Date(dateString);
          } catch (error) {
            return new Date();
          }
        };

        const meetingDate = field === 'date' ? parseDateString(value) : parseDateString(updatedHeaderData.date);
        
        const { error } = await supabase
          .from('meeting_headers')
          .upsert({
            company_id: profile.company_id,
            meeting_date: meetingDate.toISOString(),
            title: field === 'title' ? value : updatedHeaderData.title,
            attendees: JSON.parse(JSON.stringify(updatedHeaderData.attendees)),
            purpose: field === 'purpose' ? value : updatedHeaderData.purpose
          }, {
            onConflict: 'company_id'
          });
        
        if (error) {
          console.error('Error saving header data:', error);
        }
      } catch (error) {
        console.error('Failed to save header data to database:', error);
      }
    }

    toast({
      title: "Field Updated",
      description: `${field.charAt(0).toUpperCase() + field.slice(1)} has been updated and saved`
    });
  };

  const handleAttendeesChange = async (attendees: Attendee[]) => {
    setHeaderData(prev => ({
      ...prev,
      attendees
    }));

    // Save attendees to database immediately
    if (profile?.company_id) {
      try {
        const parseDateString = (dateString: string) => {
          try {
            const parts = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
            if (parts) {
              const [, day, month, year, hour, minute] = parts;
              return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
            }
            return new Date(dateString);
          } catch (error) {
            return new Date();
          }
        };

        const meetingDate = parseDateString(headerData.date);
        
        const { error } = await supabase
          .from('meeting_headers')
          .upsert({
            company_id: profile.company_id,
            meeting_date: meetingDate.toISOString(),
            title: headerData.title,
            attendees: JSON.parse(JSON.stringify(attendees)),
            purpose: headerData.purpose
          }, {
            onConflict: 'company_id'
          });
        
        console.log('Saving attendees to database:', attendees);
        console.log('Company ID:', profile.company_id);
        
        if (error) {
          console.error('Error saving attendees:', error);
        }
      } catch (error) {
        console.error('Failed to save attendees to database:', error);
      }
    }

    toast({
      title: "Attendees Updated",
      description: "Meeting attendees have been updated and saved"
    });
  };
  
  const handleStatusChange = async (sectionId: string, itemId: string, newStatus: StatusType) => {
    const lastReviewed = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });

    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? {
          ...section,
          items: section.items.map(item => 
            item.id === itemId ? {
              ...item,
              status: newStatus,
              lastReviewed
            } : item
          )
        } : section
      )
    }));

    // Save status change to database immediately
    if (profile?.company_id) {
      try {
        const { error } = await supabase
          .from('subsection_data')
          .upsert({
            company_id: profile.company_id,
            section_id: sectionId,
            item_id: itemId,
            status: newStatus,
            last_reviewed: lastReviewed
          }, {
            onConflict: 'company_id,section_id,item_id'
          });
        
        if (error) {
          console.error('Error saving status:', error);
        }
      } catch (error) {
        console.error('Failed to save status to database:', error);
      }
    }

    toast({
      title: "Status Updated",
      description: `Item status changed to ${newStatus} and saved`
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
  
  const handleActionCreated = async (itemTitle: string, mentionedAttendee: string, comment: string, action: string, dueDate: string, subsectionActionId?: string) => {
    console.log('Index: handleActionCreated called with meetingIds:', { currentMeetingId, tempMeetingId });
    
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
    
    console.log('Index: Action created:', newAction);
    console.log('Index: Current actions log before adding:', actionsLog);
    
    setActionsLog(prev => {
      const newLog = [newAction, ...prev];
      console.log('Index: New actions log after adding:', newLog);
      return newLog;
    });

    console.log('Index: meetingIds after setActionsLog:', { currentMeetingId, tempMeetingId });

    // Save action to database immediately
    if (profile?.company_id) {
      try {
        const { error } = await supabase
          .from('actions_log')
          .upsert({
            company_id: profile.company_id,
            action_id: actionId,
            timestamp: newAction.timestamp,
            item_title: itemTitle,
            mentioned_attendee: mentionedAttendee,
            comment: comment,
            action_text: action,
            due_date: dueDate,
            status: "green",
            closed: false,
            source_type: "manual",
            source_id: subsectionActionId ? `subsection-${itemTitle}` : ''
          }, {
            onConflict: 'company_id,action_id'
          });
        
        if (error) {
          console.error('Error saving action to database:', error);
        }
      } catch (error) {
        console.error('Failed to save action to database:', error);
      }
    }
    
    toast({
      title: "Action Created",
      description: `Action assigned to @${mentionedAttendee} for ${itemTitle} and saved`
    });
  };

  const handleActionComplete = async (actionId: string) => {
    // Mark action as complete in actions log
    setActionsLog(prev => prev.map(action => 
      action.id === actionId 
        ? { ...action, closed: true, closedDate: new Date().toISOString() }
        : action
    ));

    // Also remove the same action from subsections (actions disappear when completed)
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

    // Update action in database immediately
    if (profile?.company_id) {
      try {
        const { error } = await supabase
          .from('actions_log')
          .update({
            closed: true,
            closed_date: new Date().toISOString()
          })
          .eq('company_id', profile.company_id)
          .eq('action_id', actionId);
        
        if (error) {
          console.error('Error updating action completion in database:', error);
        }
      } catch (error) {
        console.error('Failed to update action completion in database:', error);
      }
    }
    
    toast({
      title: "Action Completed",
      description: "Action has been marked as complete and removed from subsection"
    });
  };

  const handleActionDelete = async (actionId: string) => {
    // Remove action from actions log
    setActionsLog(prev => prev.filter(action => action.id !== actionId));

    // Also remove the same action from subsections
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

    // Delete action from database immediately
    if (profile?.company_id) {
      try {
        const { error } = await supabase
          .from('actions_log')
          .delete()
          .eq('company_id', profile.company_id)
          .eq('action_id', actionId);
        
        if (error) {
          console.error('Error deleting action from database:', error);
        }
      } catch (error) {
        console.error('Failed to delete action from database:', error);
      }
    }
    
    toast({
      title: "Action Deleted",
      description: "Action has been removed from both Actions Log and subsections"
    });
  };


  const handleActionEdit = async (actionId: string, updates: { comment?: string; dueDate?: string; owner?: string }) => {
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

    // Update action in database immediately
    if (profile?.company_id) {
      try {
        const updateData: any = {};
        
        if (updates.dueDate) {
          updateData.due_date = updates.dueDate;
        }
        
        if (updates.owner) {
          updateData.mentioned_attendee = updates.owner;
        }

        // Add audit trail update
        const currentAction = actionsLog.find(a => a.id === actionId);
        const newAuditTrail = [...(currentAction?.auditTrail || [])];
        
        if (updates.comment) {
          newAuditTrail.push({
            timestamp,
            change: `Comment added: ${updates.comment}`
          });
        }
        
        if (updates.dueDate && currentAction && updates.dueDate !== currentAction.dueDate) {
          newAuditTrail.push({
            timestamp,
            change: `Due date changed from ${currentAction.dueDate} to ${updates.dueDate}`
          });
        }
        
        if (updates.owner && currentAction && updates.owner !== currentAction.mentionedAttendee) {
          newAuditTrail.push({
            timestamp,
            change: `Action owner changed to ${updates.owner}`
          });
        }
        
        updateData.audit_trail = newAuditTrail;

        const { error } = await supabase
          .from('actions_log')
          .update(updateData)
          .eq('company_id', profile.company_id)
          .eq('action_id', actionId);
        
        if (error) {
          console.error('Error updating action in database:', error);
        }
      } catch (error) {
        console.error('Failed to update action in database:', error);
      }
    }

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
      description: "Action has been updated and saved to database"
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

  const handleSubsectionActionComplete = async (actionId: string) => {
    // Mark action as complete in main Actions Log
    setActionsLog(prev => prev.map(action => 
      action.id === actionId 
        ? { ...action, closed: true, closedDate: new Date().toISOString() }
        : action
    ));

    // Update action in database immediately
    if (profile?.company_id) {
      try {
        const { error } = await supabase
          .from('actions_log')
          .update({
            closed: true,
            closed_date: new Date().toISOString()
          })
          .eq('company_id', profile.company_id)
          .eq('action_id', actionId);
        
        if (error) {
          console.error('Error updating action completion in database:', error);
        }
      } catch (error) {
        console.error('Failed to update action completion in database:', error);
      }
    }
    
    toast({
      title: "Action Completed",
      description: "Action has been marked as complete and saved to database"
    });
  };

  const handleSubsectionActionDelete = async (actionId: string) => {
    // Remove action from main Actions Log
    setActionsLog(prev => prev.filter(action => action.id !== actionId));

    // Delete action from database immediately
    if (profile?.company_id) {
      try {
        const { error } = await supabase
          .from('actions_log')
          .delete()
          .eq('company_id', profile.company_id)
          .eq('action_id', actionId);
        
        if (error) {
          console.error('Error deleting action from database:', error);
        }
      } catch (error) {
        console.error('Failed to delete action from database:', error);
      }
    }
    
    toast({
      title: "Action Deleted",
      description: "Action has been removed from Actions Log and database"
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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000); // Reset after 2 seconds
      
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
    try {
      // Force expand all sections first
      setAllSectionsExpanded(true);
      
      // Wait for expansion to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const element = document.getElementById('dashboard-container');
      if (!element) {
        throw new Error('Dashboard container not found');
      }

      // Ensure all collapsible sections are expanded
      const collapsedElements = element.querySelectorAll('[data-state="closed"]');
      collapsedElements.forEach(el => {
        const button = el.querySelector('button[aria-expanded="false"]');
        if (button) {
          (button as HTMLElement).click();
        }
      });

      // Wait for all expansions to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture the expanded dashboard
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f3f4f6', // gray-100 background
        width: element.scrollWidth,
        height: element.scrollHeight,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF with 10mm margins
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // A4 dimensions with 10mm margins
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 10; // 10mm margin
      const contentWidth = pageWidth - (margin * 2); // 190mm
      const contentHeight = pageHeight - (margin * 2); // 277mm
      
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let yPosition = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      heightLeft -= contentHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        yPosition = -(imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, margin + yPosition, imgWidth, imgHeight);
        heightLeft -= contentHeight;
      }

      // Generate filename with current date
      const filename = `dashboard-${headerData.title || 'meeting'}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      toast({
        title: "PDF Exported",
        description: "Dashboard has been exported as PDF with all sections expanded"
      });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export dashboard as PDF",
        variant: "destructive"
      });
    }
  };

  console.log('Rendering Index with actionsLog length:', actionsLog.length, 'actionsLog:', actionsLog);
  
  // Function to trigger re-evaluation of panel states
  const triggerPanelStateUpdate = () => {
    setPanelStateTracker(prev => prev + 1);
  };
  
  // Check if any individual panels are open
  const areAnyPanelsOpen = () => {
    const actionsLogExpanded = JSON.parse(sessionStorage.getItem('actions_log_expanded') || 'false');
    const keyDocsExpanded = JSON.parse(sessionStorage.getItem('key_documents_expanded') || 'false');
    
    // Check if any dashboard sections are open - they default to TRUE when no storage value exists
    const sectionKeys = dashboardData.sections.filter(section => section.id !== "meeting-overview").map(section => 
      `section_${section.title.replace(/\s+/g, '_').toLowerCase()}_open`
    );
    const anySectionOpen = sectionKeys.some(key => {
      const stored = sessionStorage.getItem(key);
      // If no value stored, it defaults to true (open), otherwise use stored value
      return stored !== null ? JSON.parse(stored) : true;
    });
    
    return actionsLogExpanded || keyDocsExpanded || anySectionOpen;
  };
  
  const areAllPanelsClosed = () => {
    const actionsLogExpanded = JSON.parse(sessionStorage.getItem('actions_log_expanded') || 'false');
    const keyDocsExpanded = JSON.parse(sessionStorage.getItem('key_documents_expanded') || 'false');
    
    // Check if all dashboard sections are closed
    const sectionKeys = dashboardData.sections.filter(section => section.id !== "meeting-overview").map(section => 
      `section_${section.title.replace(/\s+/g, '_').toLowerCase()}_open`
    );
    const allSectionsClosed = sectionKeys.every(key => {
      const stored = sessionStorage.getItem(key);
      // If no value stored, it defaults to true (open), otherwise use stored value
      return stored !== null ? !JSON.parse(stored) : false; // If no storage, section is open by default
    });
    
    return !actionsLogExpanded && !keyDocsExpanded && allSectionsClosed;
  };
  
  const handleToggleAll = () => {
    if (allSectionsExpanded === true) {
      // Currently expanded, so collapse all
      setAllSectionsExpanded(false);
    } else if (allSectionsExpanded === false) {
      // Currently collapsed, so expand all
      setAllSectionsExpanded(true);
    } else {
      // undefined state - check current panel states and toggle accordingly
      if (areAllPanelsClosed()) {
        setAllSectionsExpanded(true); // Expand all
      } else {
        setAllSectionsExpanded(false); // Collapse all
      }
    }
  };
  
  const getToggleButtonText = () => {
    if (allSectionsExpanded === true) return 'Collapse All';
    if (allSectionsExpanded === false) return 'Expand All';
    // When undefined, check individual states dynamically
    if (areAllPanelsClosed()) return 'Expand All';
    return 'Collapse All';
  };
  
  // Early returns for loading states
  if (!profile?.company_id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Please select a company to continue.</p>
        </div>
      </div>
    );
  }

  // Show loading state until data is loaded from database
  if (!isDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8">
      <div className="w-[90%] mx-auto space-y-6">
        <div className="flex justify-end gap-4 mb-6">
          <Button 
            onClick={handleToggleAll}
            variant="outline"
            className="gap-2"
          >
            {allSectionsExpanded === true ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {getToggleButtonText()}
          </Button>
          <Button 
            onClick={saveMeetingToDatabase}
            variant="outline"
            className="gap-2"
          >
            <Save className={`w-4 h-4 transition-all duration-300 ${saveSuccess ? 'animate-scale-in text-green-600' : ''}`} />
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
          
          <MeetingSummaryPanel 
            purpose={headerData.purpose}
            onPurposeChange={(value) => handleDataChange("purpose", value)}
          />
          
          <ActionsLog
            actions={actionsLog} 
            onActionComplete={handleActionComplete} 
            onActionDelete={handleActionDelete} 
            onResetActions={resetActionsLog}
            onActionEdit={handleActionEdit}
            attendees={getAttendeesList()}
            forceOpen={allSectionsExpanded}
            onPanelStateChange={triggerPanelStateUpdate}
          />
          
          <KeyDocumentTracker 
            documents={keyDocuments}
            onDocumentsChange={async (newDocuments) => {
              setKeyDocuments(newDocuments);
              
              // Save key documents to database immediately
              if (profile?.company_id) {
                try {
                  // Clear existing documents for this company
                  await supabase
                    .from('key_documents')
                    .delete()
                    .eq('company_id', profile.company_id);
                  
                  // Insert new documents
                  if (newDocuments.length > 0) {
                    const documentsToInsert = newDocuments.map(doc => ({
                      company_id: profile.company_id,
                      name: doc.name,
                      status: 'missing', // Default status since KeyDocumentTracker doesn't use the status we stored
                      due_date: doc.nextReviewDate || '',
                      notes: `${doc.owner} | ${doc.category} | ${doc.lastReviewDate} | ${doc.reviewFrequencyNumber} ${doc.reviewFrequencyPeriod} | ${doc.updatedAt || ''}`
                    }));
                    
                    const { error } = await supabase
                      .from('key_documents')
                      .insert(documentsToInsert);
                    
                    if (error) {
                      console.error('Error saving key documents:', error);
                    }
                  }
                } catch (error) {
                  console.error('Failed to save key documents to database:', error);
                }
              }
            }}
            attendees={getAttendeesList()}
            forceOpen={allSectionsExpanded}
            onPanelStateChange={triggerPanelStateUpdate}
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
                   onSubsectionActionComplete={handleSubsectionActionComplete}
                   onSubsectionActionDelete={handleSubsectionActionDelete}
                    attendees={getAttendeesList()}
                    meetingDate={meetingDate}
                    meetingId={currentMeetingId || tempMeetingId}
                    forceOpen={allSectionsExpanded}
                    onPanelStateChange={triggerPanelStateUpdate}
                 />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;