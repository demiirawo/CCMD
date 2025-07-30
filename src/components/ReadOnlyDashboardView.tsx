import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MeetingSummaryPanel } from "@/components/MeetingSummaryPanel";
import { ActionsLog, ActionLogEntry } from "@/components/ActionsLog";
import { KeyDocumentTracker, DocumentData } from "@/components/KeyDocumentTracker";
import { DashboardSection } from "@/components/DashboardSection";
import { StatusItemData } from "@/components/StatusItem";
import { Attendee } from "@/components/MeetingAttendeesManager";
import { StatusType } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, HeartHandshake, Shield, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ReadOnlyDashboardViewProps {
  meetingId: string;
}

interface ParsedMeeting {
  id: string;
  date: string;
  title: string;
  attendees: Attendee[];
  sections: Array<{
    id: string;
    title: string;
    items: StatusItemData[];
  }>;
  actions_log: ActionLogEntry[];
  purpose: string;
  quarter: string;
  year: number;
  created_at: string;
}

export const ReadOnlyDashboardView = ({ meetingId }: ReadOnlyDashboardViewProps) => {
  const { profile } = useAuth();
  const [meeting, setMeeting] = useState<ParsedMeeting | null>(null);
  const [keyDocuments, setKeyDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetingData();
    loadKeyDocuments();
  }, [meetingId, profile?.company_id]);

  const loadMeetingData = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .eq('company_id', profile.company_id)
        .single();

      if (error) {
        console.error('Error loading meeting:', error);
        toast({
          title: "Error",
          description: "Failed to load meeting data",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        const parsedMeeting: ParsedMeeting = {
          ...data,
          attendees: typeof data.attendees === 'string' ? JSON.parse(data.attendees) : (data.attendees || []),
          sections: typeof data.sections === 'string' ? JSON.parse(data.sections) : (data.sections || []),
          actions_log: typeof data.actions_log === 'string' ? JSON.parse(data.actions_log) : (data.actions_log || [])
        };
        
        setMeeting(parsedMeeting);
      }
    } catch (error) {
      console.error('Error loading meeting:', error);
      toast({
        title: "Error",
        description: "Failed to load meeting data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
        const documents = data.map(record => ({
          id: record.id,
          name: record.name,
          owner: '', 
          category: '', 
          lastReviewDate: '',
          reviewFrequency: '',
          reviewFrequencyNumber: '',
          reviewFrequencyPeriod: '',
          nextReviewDate: null as string | null
        }));
        setKeyDocuments(documents);
      }
    } catch (error) {
      console.error('Failed to load key documents:', error);
    }
  };

  // Dummy handlers for read-only mode
  const dummyHandler = () => {};
  const dummyAsyncHandler = async () => {};
  const dummyActionHandler = async (actionId: string, updates: any) => {};

  const getAttendeesList = () => {
    if (!meeting) return [];
    return meeting.attendees
      .filter(attendee => attendee.name && attendee.name.trim() !== '')
      .map(attendee => attendee.name);
  };

  const calculateStats = () => {
    if (!meeting) return { green: 0, amber: 0, red: 0 };
    
    const allItems = meeting.sections.flatMap(section => section.items || []);
    return {
      green: allItems.filter(item => item.status === "green").length,
      amber: allItems.filter(item => item.status === "amber").length,
      red: allItems.filter(item => item.status === "red").length
    };
  };

  const formatHeaderDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
           date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getSectionIcon = (sectionId: string) => {
    switch (sectionId) {
      case "staff":
        return <Users className="w-6 h-6 text-purple-600" />;
      case "care-planning":
        return <HeartHandshake className="w-6 h-6 text-green-600" />;
      case "safety":
        return <Shield className="w-6 h-6 text-red-600" />;
      case "continuous-improvement":
        return <TrendingUp className="w-6 h-6 text-indigo-600" />;
      default:
        return <Users className="w-6 h-6 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading meeting data...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Meeting not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8">
      <div className="w-[90%] mx-auto space-y-6">
        {/* Read-only banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-blue-800">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-sm font-medium">Read-Only View - This is a saved meeting report</span>
          </div>
        </div>
        
        <div id="readonly-dashboard-container" className="space-y-6">
          <DashboardHeader 
            date={formatHeaderDate(meeting.date)} 
            title={meeting.title} 
            attendees={meeting.attendees}
            purpose={meeting.purpose}
            stats={calculateStats()}
            onDataChange={dummyHandler}
            onAttendeesChange={dummyHandler}
          />
          
          <MeetingSummaryPanel 
            purpose={meeting.purpose}
            onPurposeChange={dummyHandler}
          />
          
          <ActionsLog
            actions={meeting.actions_log || []} 
            onActionComplete={dummyAsyncHandler} 
            onActionDelete={dummyAsyncHandler} 
            onResetActions={dummyAsyncHandler}
            onActionEdit={dummyActionHandler}
            attendees={getAttendeesList()}
            forceOpen={true} // Always expanded for read-only view
            onPanelStateChange={dummyHandler}
          />
          
          <KeyDocumentTracker 
            documents={keyDocuments}
            onDocumentsChange={dummyAsyncHandler}
            attendees={getAttendeesList()}
            forceOpen={true} // Always expanded for read-only view
            onPanelStateChange={dummyHandler}
          />
          
          {meeting.sections.filter(section => section.id !== "meeting-overview").map(section => {
            const meetingDate = new Date(meeting.date);
            
            return (
              <DashboardSection 
                key={section.id} 
                title={section.title} 
                items={section.items || []} 
                onItemStatusChange={dummyHandler} 
                onItemObservationChange={dummyHandler}
                onItemActionsChange={dummyHandler}
                onItemDocumentsChange={dummyHandler}
                onItemMetadataChange={dummyHandler}
                onActionCreated={dummyAsyncHandler}
                onSubsectionActionEdit={dummyHandler}
                onSubsectionActionComplete={dummyAsyncHandler}
                onSubsectionActionDelete={dummyAsyncHandler}
                attendees={getAttendeesList()}
                meetingDate={meetingDate}
                meetingId={meeting.id}
                forceOpen={true} // Always expanded for read-only view
                onPanelStateChange={dummyHandler}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};