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
  const { profile } = useAuth();
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
        
        {/* Static Dashboard Header */}
        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {meeting.title || "Meeting Dashboard"}
                </CardTitle>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {formatHeaderDate(meeting.date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {meeting.attendees.length} attendees
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
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
          </CardHeader>
        </Card>

        {/* Static Meeting Summary */}
        {meeting.purpose && (
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>
                Meeting Purpose
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{meeting.purpose}</p>
            </CardContent>
          </Card>
        )}

        {/* Static Attendees */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>
              Attendees ({meeting.attendees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {meeting.attendees.map((attendee, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600">
                      {attendee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{attendee.name}</p>
                    {attendee.email && (
                      <p className="text-xs text-gray-500">{attendee.email}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>


        {/* Static Dashboard Sections */}
        {meeting.sections.filter(section => section.id !== "meeting-overview").map(section => (
          <Card key={section.id} className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {section.items && section.items.length > 0 ? (
                  section.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <StatusBadge status={item.status} />
                      </div>
                      
                      {item.observation && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 font-medium mb-1">Observation:</p>
                          <p className="text-sm text-gray-700">{item.observation}</p>
                        </div>
                      )}

                      {item.lastReviewed && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500">Last reviewed: {item.lastReviewed}</p>
                        </div>
                      )}

                      {item.actions && item.actions.length > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 mb-2">Related Actions:</p>
                          <div className="space-y-2">
                            {item.actions.map((action, actionIndex) => (
                              <div key={actionIndex} className="text-sm text-blue-700">
                                • {action.description || action.name} 
                                {action.targetDate && (
                                  <span className="text-blue-600"> (Due: {action.targetDate})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items tracked in this section</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};