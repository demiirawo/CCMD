import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusItemData } from "@/components/StatusItem";
import { Attendee } from "@/components/MeetingAttendeesManager";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, HeartHandshake, Shield, TrendingUp, Calendar, CalendarDays, Clock, Target, FileText, UserCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ReadOnlyDashboardViewProps {
  meetingId: string;
}

interface ActionLogEntry {
  id: string;
  timestamp: string;
  itemTitle: string;
  mentionedAttendee: string;
  comment: string;
  action: string;
  dueDate: string;
  status: "green" | "amber" | "red";
  closed: boolean;
  closedDate?: string;
  sourceType: "manual" | "document";
  sourceId?: string;
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
  const { profile, companies } = useAuth();
  const [meeting, setMeeting] = useState<ParsedMeeting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetingData();
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

  const stats = calculateStats();
  const currentCompany = companies.find(c => c.id === profile?.company_id);

  return (
    <div className="bg-gray-100 p-4 lg:p-8" style={{ pointerEvents: 'none', userSelect: 'none' }}>
      <div className="w-[90%] mx-auto space-y-6">
        {/* Read-only banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-blue-800">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-sm font-medium">Read-Only View - This is a saved meeting report</span>
          </div>
        </div>
        
        {/* Company Header */}
        {currentCompany && (
          <div className="text-center py-6">
            {currentCompany.logo_url && (
              <img 
                src={currentCompany.logo_url} 
                alt={`${currentCompany.name} logo`}
                className="h-16 w-auto mx-auto mb-4"
              />
            )}
            <h1 className="text-2xl font-bold text-foreground">{currentCompany.name}</h1>
          </div>
        )}
        
        {/* Dashboard Header - Matching current design */}
        <div className="bg-primary/10 pt-14 pb-8 px-14 mb-8 rounded-xl shadow-sm -mx-8">
          {/* Meeting Info Section */}
          <div className="grid grid-cols-2 gap-4 mb-10 items-start">
            <div className="p-4 pt-8 rounded-lg border border-gray-100 h-32 bg-white">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Meeting Title</h3>
              <div className="w-full min-h-12 p-2 text-sm font-semibold text-foreground bg-gray-50 border border-gray-200 rounded whitespace-pre-wrap break-words overflow-wrap-anywhere">
                {meeting.title || "No meeting title provided."}
              </div>
            </div>
            <div className="p-4 pt-8 rounded-lg border border-gray-100 h-32 bg-white">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Meeting Date & Time</h3>
              <div className="w-full min-h-12 p-2 text-sm text-foreground bg-gray-50 border border-gray-200 rounded">
                {formatHeaderDate(meeting.date) || "No date provided."}
              </div>
            </div>
          </div>

          {/* Office Team and Meeting Summary Section */}
          <div className="grid grid-cols-2 gap-6 mb-6 items-start">
            {/* Meeting Attendees - 50% width */}
            <div className="p-4 rounded-lg border border-gray-100 min-h-24 bg-white">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 py-[8px]">Meeting Attendees</h3>
              <div className="space-y-3">
                {meeting.attendees.map((attendee, index) => (
                  <div key={index} className="grid grid-cols-[1fr_auto] gap-2 items-center">
                    <div className="text-sm font-medium bg-white px-3 py-2 rounded border border-gray-200">
                      {attendee.name}
                    </div>
                    <div className="flex gap-1">
                      <span className="px-3 py-1 text-xs font-medium rounded bg-green-100 text-green-700 border border-green-300">
                        Present
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Meeting Summary - 50% width */}
            <div className="p-4 rounded-lg border border-gray-100 min-h-24 bg-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground mx-0 px-0 py-[3px] my-0">Meeting Summary</h3>
              </div>
              <div className="w-full min-h-12 p-2 text-sm text-foreground bg-gray-50 border border-gray-200 rounded whitespace-pre-wrap break-words overflow-wrap-anywhere">
                {meeting.purpose || "No meeting summary provided."}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex gap-4 justify-center">
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{stats.green}</div>
              <div className="text-xs text-green-700">On Track</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">{stats.amber}</div>
              <div className="text-xs text-yellow-700">Attention</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{stats.red}</div>
              <div className="text-xs text-red-700">Critical</div>
            </div>
          </div>
        </div>

        {/* Dashboard Sections - Matching current design */}
        {meeting.sections.filter(section => section.id !== "meeting-overview").map(section => {
          const getSectionStatus = () => {
            if (!section.items || section.items.length === 0) return 'green';
            const applicableItems = section.items.filter(item => item.status !== 'na');
            if (applicableItems.length === 0) return 'green';
            
            const hasRed = applicableItems.some(item => item.status === 'red');
            const hasAmber = applicableItems.some(item => item.status === 'amber');
            
            if (hasRed) return 'red';
            if (hasAmber) return 'amber';
            return 'green';
          };

          const getLastUpdated = () => {
            if (!section.items || section.items.length === 0) return null;
            
            const dates = section.items
              .map(item => item.lastReviewed)
              .filter(date => date && date.trim() !== '')
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
            
            return dates[0] || null;
          };

          const getSectionBackgroundClass = (status: string) => {
            const baseClass = "-mx-8 px-14 py-6";
            switch (status) {
              case 'green':
                return `bg-status-green text-white ${baseClass}`;
              case 'amber':
                return `bg-status-amber text-white ${baseClass}`;
              case 'red':
                return `bg-status-red text-white ${baseClass}`;
              default:
                return `bg-primary/10 ${baseClass}`;
            }
          };

          const sectionStatus = getSectionStatus();
          const lastUpdated = getLastUpdated();

          return (
            <div key={section.id} className={`rounded-2xl shadow-lg ${getSectionBackgroundClass(sectionStatus)}`}>
              <div className="flex items-center justify-between cursor-pointer mb-4">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{section.title}</h3>
                    {lastUpdated && (
                      <p className="text-sm mt-1 text-white/80">
                        Updated: {lastUpdated}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <StatusBadge status={sectionStatus} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                {section.items && section.items.length > 0 ? (
                  section.items.map((item, index) => {
                    const getStatusBackgroundClass = (status: string) => {
                      switch (status) {
                        case 'green':
                          return 'bg-green-50 border border-green-200';
                        case 'amber':
                          return 'bg-amber-50 border border-amber-200';
                        case 'red':
                          return 'bg-red-50 border border-red-200';
                        case 'na':
                          return 'bg-gray-50 border border-gray-200';
                        default:
                          return 'bg-white border border-gray-200';
                      }
                    };

                    return (
                      <div key={index} className={`relative w-full rounded-xl p-8 mb-3 shadow-md min-h-[140px] ${getStatusBackgroundClass(item.status)}`}>
                        <div className="flex items-start gap-4 w-full">
                          <div className="flex-shrink-0">
                            <StatusBadge status={item.status} />
                          </div>
                          
                          <div className="flex-1 min-w-0 mr-3 flex flex-col justify-between h-full">
                            <div>
                              <h4 className="font-semibold text-foreground text-sm truncate">
                                {item.title}
                              </h4>
                              
                              <p className="text-xs text-muted-foreground mt-1">
                                Updated: {item.lastReviewed}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex-[5] min-w-0 space-y-3">
                            {/* Current Situation Section */}
                            <div>
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">LATEST UPDATE</label>
                              <div className="w-full p-3 rounded-lg text-sm min-h-[80px] flex items-start border border-border/30 bg-muted/20">
                                <span className="break-words w-full whitespace-pre-wrap text-foreground">
                                  {item.observation || "No update provided"}
                                </span>
                              </div>
                            </div>

                            {/* Trends & Themes Section */}
                            {item.trendsThemes && (
                              <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">TREND & THEMES</label>
                                <div className="w-full p-3 rounded-lg text-sm min-h-[80px] flex items-start border border-border/30 bg-muted/20">
                                  <span className="break-words w-full whitespace-pre-wrap text-foreground">
                                    {item.trendsThemes}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Actions Section */}
                            <div>
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">ACTIONS</label>
                              <div className="space-y-2">
                                {item.actions && item.actions.length > 0 ? (
                                  item.actions.map((action, actionIndex) => (
                                    <div key={actionIndex} className="p-3 border border-border/30 rounded-lg bg-muted/20">
                                      <div className="text-sm font-medium text-foreground">{action.description}</div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Assigned to: {action.name} | Due: {action.targetDate}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-3 border border-border/30 rounded-lg bg-muted/20 text-sm text-muted-foreground">
                                    No actions
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-white/80">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items tracked in this section</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};