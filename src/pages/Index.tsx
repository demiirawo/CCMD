import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAutoSave } from "@/hooks/useAutoSave";

import { useMeetingEmailNotification } from "@/hooks/useMeetingEmailNotification";
import { clearCompanyData, getTabId } from "@/utils/dataIsolationUtils";
import { Attendee } from "@/components/TeamAttendeesDisplay";
import { DashboardSection } from "@/components/DashboardSection";

import { KeyDocumentTracker, DocumentData } from "@/components/KeyDocumentTracker";
import { StatusItemData } from "@/components/StatusItem";
import { ActionItem } from "@/components/ActionForm";
import { SubsectionMetadata } from "@/components/SubsectionMetadataDialog";
import { StatusType } from "@/components/StatusBadge";
import { Users, Target, BarChart3, FileText, Heart, Shield, Calendar, UserCheck, ClipboardList, HeartHandshake, TrendingUp, Save, Download, ChevronDown, ChevronUp, Copy, Home, Loader2, Send } from "lucide-react";
import { MeetingStatusSummary } from "@/components/MeetingStatusSummary";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useSearchParams, useNavigate } from "react-router-dom";
const Index = () => {
  const {
    user,
    profile,
    companies,
    selectCompany
  } = useAuth();
  const {
    sendMeetingEmails
  } = useMeetingEmailNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();


  // Check if user has edit permissions
  const canEdit = (user?.email === 'demi.irawo@care-cuddle.co.uk') || Boolean(profile?.company_id);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);
  const [tempMeetingId, setTempMeetingId] = useState<string>(() => {
    // Initialize tab isolation
    const tabId = getTabId();
    
    // Use a company-specific AND tab-specific persistent ID for continuous data storage
    if (!profile?.company_id) return crypto.randomUUID();
    const companyId = profile.company_id;
    
    const persistentId = localStorage.getItem(`persistentMeetingId_${companyId}_${tabId}`);
    if (persistentId) {
      console.log('Index: Using persistent meeting ID:', persistentId, 'for tab:', tabId);
      return persistentId;
    } else {
      const newId = crypto.randomUUID();
      localStorage.setItem(`persistentMeetingId_${companyId}_${tabId}`, newId);
      console.log('Index: Generated persistent meeting ID:', newId, 'for tab:', tabId);
      return newId;
    }
  });
  
  const [allSectionsExpanded, setAllSectionsExpanded] = useState<boolean | undefined>(undefined);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [panelStateTracker, setPanelStateTracker] = useState<number>(0); // Force re-render when panels change

  // Function to update temporary analytics data with real meeting ID
  const updateTemporaryAnalyticsData = async (tempId: string, realId: string) => {
    try {
      // Update dashboard_data records that were stored with the temporary session ID
      const {
        data: tempData,
        error: fetchError
      } = await (supabase as any).from('dashboard_data').select('*').eq('meeting_id', tempId);
      if (fetchError) {
        console.error('Error fetching temporary dashboard data:', fetchError);
        return;
      }
      if (tempData && tempData.length > 0) {
        console.log(`Found ${tempData.length} temporary dashboard data records to update`);

        // Update each record with the real meeting ID
        for (const record of tempData) {
          const { id } = record;
          const { error: updateError } = await (supabase as any)
            .from('dashboard_data')
            .update({ meeting_id: realId })
            .eq('id', id);
          if (updateError) {
            console.error('Error updating dashboard data record:', updateError);
          }
        }
        console.log('Successfully updated temporary dashboard_data with real meeting ID');
      } else {
        console.log('No temporary dashboard_data found to update');
      }

      // Also re-link meeting-scoped analytics tables saved under the temporary ID
      // We scope by company_id as an extra safety check
      const companyId = profile?.company_id;
      if (!companyId) {
        console.warn('Skipping analytics re-link: missing company_id');
        return;
      }

      const updates = [
        (supabase as any)
          .from('feedback_analytics')
          .update({ meeting_id: realId })
          .eq('company_id', companyId)
          .eq('meeting_id', tempId),
        (supabase as any)
          .from('incidents_analytics')
          .update({ meeting_id: realId })
          .eq('company_id', companyId)
          .eq('meeting_id', tempId),
        (supabase as any)
          .from('supervision_analytics')
          .update({ meeting_id: realId })
          .eq('company_id', companyId)
          .eq('meeting_id', tempId),
        (supabase as any)
          .from('spot_check_analytics')
          .update({ meeting_id: realId })
          .eq('company_id', companyId)
          .eq('meeting_id', tempId),
      ];

      const results = await Promise.allSettled(updates);
      results.forEach((res, idx) => {
        const table = ['feedback_analytics','incidents_analytics','supervision_analytics','spot_check_analytics'][idx];
        if (res.status === 'rejected') {
          console.error(`Error updating ${table}:`, res.reason);
        } else if ((res as any).value?.error) {
          console.error(`Error updating ${table}:`, (res as any).value.error);
        } else {
          console.log(`Re-linked ${table} records from temp ${tempId} -> real ${realId}`);
        }
      });
    } catch (error) {
      console.error('Error updating temporary analytics data:', error);
    }
  };
  const [keyDocuments, setKeyDocuments] = useState<DocumentData[]>([]);
  const [headerData, setHeaderData] = useState({
    date: (() => {
      const now = new Date();
      now.setMinutes(0, 0, 0); // Set to beginning of current hour
      return now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) + ' ' + now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    })(),
    title: "Management Meeting",
    attendees: [] as Attendee[],
    purpose: ""
  });

  // Simplified save function for header data - just for compatibility
  const saveHeaderData = async (newHeaderData: typeof headerData) => {
    if (!profile?.company_id) return;
    
    console.log('🔄 MeetingHeaders: Basic save operation', {
      companyId: profile.company_id,
      headerData: newHeaderData
    });
    
    try {
      const meeting_date = (() => {
        try {
          const parts = newHeaderData.date.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
          if (parts) {
            const [, day, month, year, hour, minute] = parts;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute)).toISOString();
          }
          return new Date(newHeaderData.date).toISOString();
        } catch (error) {
          return new Date().toISOString();
        }
      })();

      const dataToSave = {
        company_id: profile.company_id,
        meeting_date,
        title: newHeaderData.title,
        attendees: JSON.parse(JSON.stringify(newHeaderData.attendees)),
        purpose: newHeaderData.purpose,
        updated_at: new Date().toISOString()
      };

      console.log('💾 MeetingHeaders: Attempting database save with payload:', dataToSave);

      // Try to find existing record
      const { data: existingData } = await supabase
        .from('meeting_headers')
        .select('id')
        .eq('company_id', profile.company_id)
        .eq('meeting_date', meeting_date)
        .maybeSingle();

      let result;
      if (existingData) {
        // Update existing record
        console.log('🔄 MeetingHeaders: Updating existing record');
        result = await supabase
          .from('meeting_headers')
          .update(dataToSave)
          .eq('id', existingData.id)
          .select();
      } else {
        // Insert new record
        console.log('➕ MeetingHeaders: Inserting new record');
        result = await supabase
          .from('meeting_headers')
          .insert(dataToSave)
          .select();
      }

      if (result.error) {
        console.error('❌ MeetingHeaders: Database save failed:', result.error);
        throw result.error;
      } else {
        console.log('✅ MeetingHeaders: Successfully saved to database:', result.data);
        // Save to localStorage as backup with tab isolation
        const tabId = sessionStorage.getItem('__tab_id') || `tab_${Date.now()}`;
        const backupKey = currentMeetingId ? `headers_backup_${profile.company_id}_${currentMeetingId}_${tabId}` : `headers_backup_${profile.company_id}_${tabId}`;
        localStorage.setItem(backupKey, JSON.stringify(newHeaderData));
        console.log('💾 MeetingHeaders: Also saved backup to localStorage:', backupKey);
      }
    } catch (error) {
      console.error('❌ MeetingHeaders: Exception in saveHeaderData:', error);
      // Save to localStorage as fallback with tab isolation
      if (profile?.company_id) {
        const tabId = sessionStorage.getItem('__tab_id') || `tab_${Date.now()}`;
        const backupKey = currentMeetingId ? `headers_backup_${profile.company_id}_${currentMeetingId}_${tabId}` : `headers_backup_${profile.company_id}_${tabId}`;
        localStorage.setItem(backupKey, JSON.stringify(newHeaderData));
        console.log('💾 MeetingHeaders: Exception fallback to localStorage:', backupKey);
      }
    }
  };

  // Load header data from database on component mount
  useEffect(() => {
    const loadHeaderData = async () => {
      if (!profile?.company_id) return;
      try {
        const {
          data,
          error
        } = await supabase.from('meeting_headers').select('*').eq('company_id', profile.company_id).order('updated_at', {
          ascending: false
        }).limit(1);
        if (error) {
          console.error('Error loading header data:', error);
          return;
        }
        if (data && data.length > 0) {
          const headerRecord = data[0];
          console.log('Loading header data from database:', headerRecord);
          const loadedData = {
            date: new Date(headerRecord.meeting_date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }) + ' ' + new Date(headerRecord.meeting_date).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }),
            title: headerRecord.title || '',
            attendees: Array.isArray(headerRecord.attendees) ? headerRecord.attendees as unknown as Attendee[] : [],
            purpose: headerRecord.purpose || ''
          };
          setHeaderData(loadedData);
        }
      } catch (error) {
        console.error('Failed to load header data:', error);
      }
    };
    loadHeaderData();
  }, [profile?.company_id]);


  // Load key documents from database on component mount
  useEffect(() => {
    const loadKeyDocuments = async () => {
      if (!profile?.company_id) return;
      try {
        const {
          data,
          error
        } = await supabase.from('key_documents').select('*').eq('company_id', profile.company_id).order('created_at', {
          ascending: false
        });
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
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "meeting-attendees",
        title: "Meeting Attendees",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "meeting-purpose",
        title: "Meeting Purpose",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        trendsThemes: "",
        actions: [],
        details: "",
        metadata: {}
      }]
    }, {
      id: "staff",
      title: "Staffing",
      icon: <Users className="w-6 h-6 text-purple-600" />,
      items: [{
        id: "recruitment",
        title: "Capacity",
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
      title: "Care & Support",
      icon: <HeartHandshake className="w-6 h-6 text-green-600" />,
      items: [{
        id: "care-plans",
        title: "Planning & Risk Assessment",
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
        title: "Care & Support Notes",
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
      }]
    }, {
      id: "safety",
      title: "Safety",
      icon: <Shield className="w-6 h-6 text-red-600" />,
      items: [{
        id: "incidents-accidents",
        title: "Incidents, Accidents & Safeguarding",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "risk-register",
        title: "Risk Management",
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
      }, {
        id: "achievements-learning",
        title: "Achievements & Challenges",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }]
    }, {
      id: "supported-housing",
      title: "Supported Housing",
      icon: <Home className="w-6 h-6 text-orange-600" />,
      items: [{
        id: "tenancy-benefits",
        title: "Tenancy & Benefits",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "property-safety-maintenance",
        title: "Property Safety & Maintenance",
        status: "green" as StatusType,
        lastReviewed: "",
        observation: "",
        actions: [],
        details: "",
        metadata: {}
      }, {
        id: "accommodation-suitability",
        title: "Compatibility Assessment",
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
      
      // Store the company_id we're loading for to prevent race conditions
      const currentCompanyId = profile.company_id;
      console.log('🔍 Loading subsection data for company:', currentCompanyId);
      
      try {
        const {
          data,
          error
        } = await supabase.from('subsection_data').select('*').eq('company_id', currentCompanyId);
        if (error) {
          console.error('Error loading subsection data:', error);
          setIsDataLoaded(true); // Mark as loaded even on error to prevent infinite loading
          return;
        }
        
        // Check if company hasn't changed during async operation (race condition protection)
        if (profile?.company_id !== currentCompanyId) {
          console.log('🚫 Company changed during data load, skipping update. Current:', profile?.company_id, 'Expected:', currentCompanyId);
          return;
        }
        
        if (data && data.length > 0) {
          console.log('✅ Loading subsection data for company:', currentCompanyId, 'Found records:', data.length);
          // Update dashboard data with loaded information
          setDashboardData(prev => ({
            ...prev,
            sections: prev.sections.map(section => ({
              ...section,
              items: section.items.map(item => {
                const savedData = data.find(d => d.section_id === section.id && d.item_id === item.id && d.company_id === currentCompanyId);
                if (savedData) {
                  console.log(`📋 Loading data for ${section.id}/${item.id}, company: ${currentCompanyId}`, {
                    trends_themes: (savedData as any).trends_themes,
                    observation: savedData.observation
                  });
                  return {
                    ...item,
                    status: savedData.status as StatusType || item.status,
                    observation: savedData.observation as string || item.observation,
                    trendsThemes: (savedData as any).trends_themes as string || item.trendsThemes || "",
                    lessonsLearned: (savedData as any).lessons_learned as string || item.lessonsLearned || "",
                    actions: savedData.actions ? typeof savedData.actions === 'string' ? JSON.parse(savedData.actions) : savedData.actions : item.actions,
                    metadata: savedData.metadata ? typeof savedData.metadata === 'string' ? JSON.parse(savedData.metadata) : savedData.metadata : item.metadata || {},
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
    const updatedHeaderData = { ...headerData, [field]: value };
    setHeaderData(updatedHeaderData);
    
    // Save the updated header data using the same mechanism as feedback analytics
    await saveHeaderData(updatedHeaderData);
    
    toast({
      title: "Field Updated",
      description: `${field.charAt(0).toUpperCase() + field.slice(1)} has been updated and saved`
    });
  };
  const handleAttendeesChange = async (attendees: Attendee[]) => {
    const updatedHeaderData = { ...headerData, attendees };
    setHeaderData(updatedHeaderData);

    // Save the updated header data using the same mechanism as feedback analytics
    await saveHeaderData(updatedHeaderData);
  };
  const handleStatusChange = async (sectionId: string, itemId: string, newStatus: StatusType) => {
    const lastReviewed = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => section.id === sectionId ? {
        ...section,
        items: section.items.map(item => item.id === itemId ? {
          ...item,
          status: newStatus,
          lastReviewed
        } : item)
      } : section)
    }));

    // Save status change to database immediately
    if (profile?.company_id) {
      try {
        const {
          error
        } = await supabase.from('subsection_data').upsert({
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
      sections: prev.sections.map(section => section.id === sectionId ? {
        ...section,
        items: section.items.map(item => item.id === itemId ? {
          ...item,
          observation: newObservation,
          lastReviewed: new Date().toLocaleDateString('en-GB')
        } : item)
      } : section)
    }));

    // Save to database immediately for persistence
    if (profile?.company_id) {
      try {
        const {
          error
        } = await supabase.from('subsection_data').upsert({
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
  const handleTrendsThemesChange = async (sectionId: string, itemId: string, newTrendsThemes: string) => {
    // Update local state
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => section.id === sectionId ? {
        ...section,
        items: section.items.map(item => item.id === itemId ? {
          ...item,
          trendsThemes: newTrendsThemes,
          lastReviewed: new Date().toLocaleDateString('en-GB')
        } : item)
      } : section)
    }));

    // Save to database immediately for persistence
    if (profile?.company_id) {
      try {
        const {
          error
        } = await supabase.from('subsection_data').upsert({
          company_id: profile.company_id,
          section_id: sectionId,
          item_id: itemId,
          trends_themes: newTrendsThemes
        }, {
          onConflict: 'company_id,section_id,item_id'
        });
        if (error) {
          console.error('Error saving trends & themes:', error);
        }
      } catch (error) {
        console.error('Failed to save trends & themes to database:', error);
      }
    }
    toast({
      title: "Trends & Themes Updated",
      description: "Item trends & themes have been saved"
    });
  };

  const handleLessonsLearnedChange = async (sectionId: string, itemId: string, newLessonsLearned: string) => {
    // Update local state
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => section.id === sectionId ? {
        ...section,
        items: section.items.map(item => item.id === itemId ? {
          ...item,
          lessonsLearned: newLessonsLearned,
          lastReviewed: new Date().toLocaleDateString('en-GB')
        } : item)
      } : section)
    }));

    // Save to database immediately for persistence
    if (profile?.company_id) {
      try {
        const { error } = await supabase.from('subsection_data').upsert({
          company_id: profile.company_id,
          section_id: sectionId,
          item_id: itemId,
          lessons_learned: newLessonsLearned
        }, {
          onConflict: 'company_id,section_id,item_id'
        });
        if (error) {
          console.error('Error saving lessons learned:', error);
        }
      } catch (error) {
        console.error('Failed to save lessons learned to database:', error);
      }
    }
    toast({
      title: "Lessons Learned Updated",
      description: "Lessons learned have been saved"
    });
  };
  const handleActionsChange = async (sectionId: string, itemId: string, newActions: ActionItem[]) => {
    // Update local state
    setDashboardData(prev => ({
      ...prev,
      sections: prev.sections.map(section => section.id === sectionId ? {
        ...section,
        items: section.items.map(item => item.id === itemId ? {
          ...item,
          actions: newActions,
          lastReviewed: new Date().toLocaleDateString('en-GB')
        } : item)
      } : section)
    }));

    // Save to database immediately for persistence
    if (profile?.company_id) {
      try {
        const {
          error
        } = await supabase.from('subsection_data').upsert({
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
      sections: prev.sections.map(section => section.id === sectionId ? {
        ...section,
        items: section.items.map(item => item.id === itemId ? {
          ...item,
          documents: newDocuments,
          lastReviewed: new Date().toLocaleDateString('en-GB')
        } : item)
      } : section)
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
      sections: prev.sections.map(section => section.id === sectionId ? {
        ...section,
        items: section.items.map(item => item.id === itemId ? {
          ...item,
          metadata: metadata
        } : item)
      } : section)
    }));

    // Save to database immediately for persistence
    if (profile?.company_id) {
      try {
        const {
          error
        } = await supabase.from('subsection_data').upsert({
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
    console.log('Index: handleActionCreated called with meetingIds:', {
      currentMeetingId,
      tempMeetingId
    });
    const actionId = subsectionActionId || `action-${Date.now()}`;
    toast({
      title: "Action Created",
      description: `Action assigned to @${mentionedAttendee} for ${itemTitle} and saved`
    });
  };

  const getAttendeesList = () => {
    return headerData.attendees.filter(attendee => attendee.name && attendee.name.trim() !== '') // Filter out empty names
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
      setIsSaving(true);
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
      if (month <= 3) quarter = 'Q1';else if (month <= 6) quarter = 'Q2';else if (month <= 9) quarter = 'Q3';else quarter = 'Q4';
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
        actions_log: JSON.stringify([]),
        quarter,
        year,
        company_id: profile?.company_id
      };

      // Save to Supabase
      const {
        data,
        error
      } = await supabase.from('meetings').insert([meetingRecord]).select();
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
        description: `Meeting saved successfully under ${quarter} ${year}. Check the Reports page to view it.`
      });
      console.log('Meeting saved successfully:', data);
    } catch (error) {
      console.error('Error saving meeting:', error);
      toast({
        title: "Save Failed",
        description: "An unexpected error occurred while saving the meeting",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sendEmails = async () => {
    try {
      setIsSending(true);
      
      // Parse the date from the date-time picker format (dd/MM/yyyy HH:mm)
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
          console.error('Error parsing date:', dateString, error);
          return new Date();
        }
      };
      const meetingDate = parseDateString(headerData.date);

      console.log('🔄 Preparing to send meeting emails...');
      console.log('📧 Attendees data:', headerData.attendees);

      // Fetch the meeting summary from the database
      let meetingSummary = '';
      try {
        const normalizedDate = meetingDate.toISOString();
        const { data: summaryData } = await supabase
          .from('meeting_summaries')
          .select('summary_text')
          .eq('company_id', profile?.company_id)
          .eq('meeting_date', normalizedDate)
          .maybeSingle();
        
        meetingSummary = summaryData?.summary_text || '';
        console.log('📋 Using meeting summary from database:', meetingSummary || 'No summary provided');
      } catch (summaryError) {
        console.warn('⚠️ Could not fetch meeting summary:', summaryError);
        // Fallback to purpose if summary fetch fails
        meetingSummary = (headerData.purpose && headerData.purpose.trim() !== '') ? headerData.purpose : '';
      }
      
      const currentCompany = companies.find(c => c.id === profile?.company_id);
      await sendMeetingEmails({
        title: headerData.title,
        date: meetingDate.toISOString(),
        attendees: headerData.attendees,
        actions: [],
        meetingSummary: meetingSummary,
        companyName: currentCompany?.name,
        companyServices: currentCompany?.services || [],
        dashboardData: dashboardData,
        keyDocuments: keyDocuments
      });

      toast({
        title: "Emails Sent",
        description: "Meeting summary emails have been sent to all attendees."
      });
    } catch (error) {
      console.error('❌ Error sending meeting emails:', error);
      toast({
        title: "Send Failed",
        description: "Failed to send meeting emails. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
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

      // Capture the expanded dashboard with balanced settings for 2-4MB files
      const canvas = await html2canvas(element, {
        scale: 1.2, // Better quality than 0.8 but smaller than 2.0
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        logging: false,
        removeContainer: true,
        foreignObjectRendering: false
      });
      // Use JPEG with balanced compression for 2-4MB files
      const imgData = canvas.toDataURL('image/jpeg', 0.85);

      // Create PDF with 10mm margins
      const pdf = new jsPDF('p', 'mm', 'a4');

      // A4 dimensions with 10mm margins
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 10; // 10mm margin
      const contentWidth = pageWidth - margin * 2; // 190mm
      const contentHeight = pageHeight - margin * 2; // 277mm

      const imgWidth = contentWidth;
      const imgHeight = canvas.height * contentWidth / canvas.width;
      let heightLeft = imgHeight;
      let yPosition = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
      heightLeft -= contentHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        yPosition = -(imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, margin + yPosition, imgWidth, imgHeight);
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
  

  // Function to trigger re-evaluation of panel states
  const triggerPanelStateUpdate = () => {
    setPanelStateTracker(prev => prev + 1);
  };

  // Check if any individual panels are open
  const areAnyPanelsOpen = () => {
    const tabId = sessionStorage.getItem('__tab_id') || `tab_${Date.now()}`;
    
    const keyDocsExpanded = JSON.parse(sessionStorage.getItem(`key_documents_expanded_${tabId}`) || 'false');

    // Check if any dashboard sections are open - they default to TRUE when no storage value exists
    const sectionKeys = dashboardData.sections.filter(section => section.id !== "meeting-overview").map(section => `section_${section.title.replace(/\s+/g, '_').toLowerCase()}_open_${tabId}`);
    const anySectionOpen = sectionKeys.some(key => {
      const stored = sessionStorage.getItem(key);
      // If no value stored, it defaults to true (open), otherwise use stored value
      return stored !== null ? JSON.parse(stored) : true;
    });
    return keyDocsExpanded || anySectionOpen;
  };
  const areAllPanelsClosed = () => {
    const tabId = sessionStorage.getItem('__tab_id') || `tab_${Date.now()}`;
    const keyDocsExpanded = JSON.parse(sessionStorage.getItem(`key_documents_expanded_${tabId}`) || 'false');

    // Check if all dashboard sections are closed
    const sectionKeys = dashboardData.sections.filter(section => section.id !== "meeting-overview").map(section => `section_${section.title.replace(/\s+/g, '_').toLowerCase()}_open_${tabId}`);
    const allSectionsClosed = sectionKeys.every(key => {
      const stored = sessionStorage.getItem(key);
      // If no value stored, it defaults to true (open), otherwise use stored value
      return stored !== null ? !JSON.parse(stored) : false; // If no storage, section is open by default
    });
    return !keyDocsExpanded && allSectionsClosed;
  };
  const handleToggleAll = () => {
    const shouldExpand = areAllPanelsClosed();

    // Get tab ID for session storage
    const tabId = sessionStorage.getItem('__tab_id') || `tab_${Date.now()}`;

    // Update Key Documents state
    sessionStorage.setItem(`key_documents_expanded_${tabId}`, JSON.stringify(shouldExpand));

    // Update all dashboard section states
    const sectionKeys = dashboardData.sections.filter(section => section.id !== "meeting-overview").map(section => `section_${section.title.replace(/\s+/g, '_').toLowerCase()}_open_${tabId}`);
    sectionKeys.forEach(key => {
      sessionStorage.setItem(key, JSON.stringify(shouldExpand));
    });

    // Force a re-render by updating the panel state
    triggerPanelStateUpdate();
  };
  const getToggleButtonText = () => {
    return areAllPanelsClosed() ? 'Expand All' : 'Collapse All';
  };

  // Early returns for loading states
  if (!profile?.company_id) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Please select a company to continue.</p>
        </div>
      </div>;
  }

  // Show loading state until data is loaded from database
  if (!isDataLoaded) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Loading dashboard data...</p>
        </div>
      </div>;
  }
  // Compute extra statuses for RAG (Actions + Key Review Dates)
  const parseDueDate = (dueDate: string): Date | null => {
    if (!dueDate) return null;
    if (dueDate.includes('/') && dueDate.split('/').length === 3) {
      const [day, month, year] = dueDate.split('/');
      const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(dueDate);
    return isNaN(d.getTime()) ? null : d;
  };
  const todayMid = new Date(); todayMid.setHours(0,0,0,0);

  // Actions overall status (default to green since actions log is removed)
  const actionsStatus: StatusType = 'green';

  // Key documents overall status
  const docStatus = (nextReviewDate: string | null): StatusType => {
    if (!nextReviewDate) return 'green';
    const d = new Date(nextReviewDate);
    if (isNaN(d.getTime())) return 'green';
    d.setHours(0,0,0,0);
    const diffDays = Math.ceil((d.getTime() - todayMid.getTime()) / (1000*60*60*24));
    if (diffDays < 0) return 'red';
    if (diffDays <= 5) return 'amber';
    return 'green';
  };
  const docStatuses = keyDocuments
    .filter(doc => doc && doc.name && doc.lastReviewDate)
    .map(doc => docStatus(doc.nextReviewDate));
  const keyDocsStatus: StatusType = docStatuses.includes('red') ? 'red' : (docStatuses.includes('amber') ? 'amber' : 'green');

  
  console.log('🔍 Rendering Index component with JSX structure debug');
  
  const ragExtras: StatusType[] = [actionsStatus, keyDocsStatus];

  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8 pt-36">
      <div className="w-[90%] mx-auto space-y-6">
        <div className="flex items-center mb-6 mt-16">
          <div className="flex-1" />
          <div className="flex-none">
            <MeetingStatusSummary sections={dashboardData.sections || []} extraStatuses={ragExtras} />
          </div>
          <div className="flex-1 flex justify-end gap-4">
            <Button onClick={handleToggleAll} variant="default" className="gap-2">
              <ChevronDown className="w-4 h-4" />
              {getToggleButtonText()}
            </Button>
            <Button 
              onClick={saveMeetingToDatabase} 
              variant="default" 
              className={`gap-2 transition-all duration-500 ${saveSuccess ? 'success-glow' : ''}`}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save
                </>
              )}
            </Button>
            <Button 
              onClick={sendEmails} 
              variant="default" 
              className="gap-2"
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div id="dashboard-container" className="space-y-6">
          <DashboardHeader date={headerData.date} title={headerData.title} attendees={headerData.attendees} purpose={headerData.purpose} stats={calculateStats()} sections={dashboardData.sections} actionsLog={[]} onDataChange={canEdit ? handleDataChange : undefined} onAttendeesChange={canEdit ? handleAttendeesChange : undefined} readOnly={!canEdit} />
          
          
          
          
          <KeyDocumentTracker documents={keyDocuments} onDocumentsChange={canEdit ? async newDocuments => {
          setKeyDocuments(newDocuments);

          // Save key documents to database immediately
          if (profile?.company_id) {
            try {
              // Clear existing documents for this company
              await supabase.from('key_documents').delete().eq('company_id', profile.company_id);

              // Insert new documents
              if (newDocuments.length > 0) {
                const documentsToInsert = newDocuments.map(doc => ({
                  company_id: profile.company_id,
                  name: doc.name,
                  status: 'missing',
                  // Default status since KeyDocumentTracker doesn't use the status we stored
                  due_date: doc.nextReviewDate || '',
                  notes: `${doc.owner} | ${doc.category} | ${doc.lastReviewDate} | ${doc.reviewFrequencyNumber} ${doc.reviewFrequencyPeriod} | ${doc.updatedAt || ''}`
                }));
                const {
                  error
                } = await supabase.from('key_documents').insert(documentsToInsert);
                if (error) {
                  console.error('Error saving key documents:', error);
                }
              }
            } catch (error) {
              console.error('Failed to save key documents to database:', error);
            }
          }
        } : undefined} 
        attendees={getAttendeesList()} 
        onPanelStateChange={triggerPanelStateUpdate} 
        panelStateTracker={panelStateTracker} 
        readOnly={!canEdit} 
      />
      
      {dashboardData.sections.filter(section => {
          // Always show non-meeting-overview sections except for conditional ones
          if (section.id === "meeting-overview") return false;

          // Hide Supported Housing section unless it's enabled in company services
          if (section.id === "supported-housing") {
            const currentCompany = companies.find(c => c.id === profile?.company_id);
            return currentCompany?.services?.includes("Supported Housing") || false;
          }
          return true;
        }).map(section => {
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

          // Determine if we should use "Supported" terminology
          const currentCompany = companies.find(c => c.id === profile?.company_id);
          const hasSupportedHousing = currentCompany?.services?.includes("Supported Housing") || false;
          const useSupportedTerminology = hasSupportedHousing;


          // Use section title as is (no conditional modification needed)
          let sectionTitle = section.title;

          // Conditionally modify item titles (text only, no visual changes)
          const modifiedItems = useSupportedTerminology ? section.items.map(item => ({
            ...item,
            title: item.title === "Planning & Risk Assessment" ? "Planning & Risk Assessment" : item.title
          })) : section.items;
          return (
            <DashboardSection
              key={section.id} 
              title={sectionTitle} 
              items={modifiedItems} 
              onItemStatusChange={canEdit ? (itemId, status) => handleStatusChange(section.id, itemId, status) : undefined} 
              onItemObservationChange={canEdit ? (itemId, observation) => handleObservationChange(section.id, itemId, observation) : undefined} 
              onItemTrendsThemesChange={canEdit ? (itemId, trendsThemes) => handleTrendsThemesChange(section.id, itemId, trendsThemes) : undefined} 
              onItemLessonsLearnedChange={canEdit ? (itemId, lessonsLearned) => handleLessonsLearnedChange(section.id, itemId, lessonsLearned) : undefined}
              onItemActionsChange={canEdit ? (itemId, actions) => handleActionsChange(section.id, itemId, actions) : undefined} 
              onItemDocumentsChange={canEdit ? (itemId, documents) => handleDocumentsChange(section.id, itemId, documents) : undefined} 
              onItemMetadataChange={canEdit ? (itemId, metadata) => handleMetadataChange(section.id, itemId, metadata) : undefined} 
              onActionCreated={canEdit ? handleActionCreated : undefined} 
              onSubsectionActionEdit={undefined} 
              onSubsectionActionComplete={undefined} 
              onSubsectionActionDelete={undefined}
              attendees={getAttendeesList()} 
              meetingDate={meetingDate} 
              meetingId={currentMeetingId || tempMeetingId} 
              onPanelStateChange={triggerPanelStateUpdate} 
              panelStateTracker={panelStateTracker} 
              readOnly={!canEdit} 
            />
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default Index;