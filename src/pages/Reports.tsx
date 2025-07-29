import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarDays, FileText, Users, Eye, Trash2, Clock, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MeetingStatusSummary } from "@/components/MeetingStatusSummary";
import { StatusBadge } from "@/components/StatusBadge";

interface Meeting {
  id: string;
  date: string;
  title: string;
  attendees: string; // JSON string that will be parsed
  sections: string; // JSON string that will be parsed
  purpose: string;
  quarter: string;
  year: number;
  created_at: string;
}

interface ParsedMeeting {
  id: string;
  date: string;
  title: string;
  attendees: Array<{id: string, name: string, email: string}>;
  sections: Array<{
    id: string;
    title: string;
    items: Array<{
      status: "green" | "amber" | "red";
    }>;
  }>;
  purpose: string;
  quarter: string;
  year: number;
  created_at: string;
}

interface GroupedMeetings {
  [key: string]: ParsedMeeting[];
}

export const Reports = () => {
  const [meetings, setMeetings] = useState<ParsedMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMeetings();
    
    // Set up periodic refresh to catch new meetings (every 3 seconds)
    const interval = setInterval(fetchMeetings, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching meetings:', error);
        return;
      }

      // Parse the JSON strings back to objects
      const parsedMeetings = (data || []).map(meeting => ({
        ...meeting,
        attendees: JSON.parse(typeof meeting.attendees === 'string' ? meeting.attendees : '[]'),
        sections: JSON.parse(typeof meeting.sections === 'string' ? meeting.sections : '[]')
      }));

      setMeetings(parsedMeetings);
      console.log('Fetched meetings:', parsedMeetings);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (error) {
        console.error('Error deleting meeting:', error);
        toast({
          title: "Delete Failed",
          description: "Failed to delete the meeting",
          variant: "destructive"
        });
        return;
      }

      // Remove from local state
      setMeetings(meetings.filter(meeting => meeting.id !== meetingId));
      
      toast({
        title: "Meeting Deleted",
        description: "The meeting has been successfully deleted"
      });
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast({
        title: "Delete Failed", 
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const getQuarter = (date: string) => {
    const month = new Date(date).getMonth() + 1;
    if (month <= 3) return 'Q1';
    if (month <= 6) return 'Q2';
    if (month <= 9) return 'Q3';
    return 'Q4';
  };

  const getCurrentQuarter = () => {
    const now = new Date();
    return getQuarter(now.toISOString());
  };

  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  const groupMeetingsByQuarter = (meetings: ParsedMeeting[]): GroupedMeetings => {
    const grouped: GroupedMeetings = {};
    
    meetings.forEach(meeting => {
      const key = `${meeting.year}-${meeting.quarter}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(meeting);
    });

    return grouped;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isCurrentQuarter = (quarter: string, year: number) => {
    return quarter === getCurrentQuarter() && year === getCurrentYear();
  };

  const groupedMeetings = groupMeetingsByQuarter(meetings);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">Loading meetings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Meeting Reports</h1>
          <p className="text-gray-600">View and manage saved meeting iterations grouped by quarter</p>
        </div>

        {Object.keys(groupedMeetings).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings saved yet</h3>
              <p className="text-gray-600">Save a meeting from the Dashboard to see it appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedMeetings)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([quarterKey, quarterMeetings]) => {
                const [year, quarter] = quarterKey.split('-');
                const yearNum = parseInt(year);
                const isCurrent = isCurrentQuarter(quarter, yearNum);

                return (
                  <div key={quarterKey} className="space-y-4">
                    {/* Quarter Header as Link */}
                    <div className="flex items-center justify-between">
                      <Link 
                        to={`/reports?quarter=${quarter}&year=${year}`}
                        className="group"
                      >
                        <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {quarter} {year}
                          {isCurrent && (
                            <Badge variant="outline" className="ml-3 bg-blue-50 text-blue-700 border-blue-200">
                              Current Quarter
                            </Badge>
                          )}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {quarterMeetings.length} meeting{quarterMeetings.length !== 1 ? 's' : ''} saved
                        </p>
                      </Link>
                      
                      {!isCurrent && (
                        <Button variant="outline" className="gap-2">
                          <FileText className="h-4 w-4" />
                          Quarterly Report
                        </Button>
                      )}
                    </div>

                    {/* Quarter Meetings */}
                    <Card>
                      <CardContent className="pt-6 bg-primary/5">
                        <div className="space-y-3">
                          {quarterMeetings.map((meeting) => (
                            <div key={meeting.id} className="bg-gray-50 rounded-lg p-4 border">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 mb-1">
                                    {meeting.title}
                                  </h4>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                    <div className="flex items-center gap-1">
                                      <CalendarDays className="h-4 w-4" />
                                      {formatDate(meeting.date)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="h-4 w-4" />
                                      {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                  {meeting.purpose && (
                                    <p className="text-sm text-gray-700">{meeting.purpose}</p>
                                  )}
                                </div>
                                <div className="ml-4 flex items-center gap-2">
                                  <MeetingStatusSummary sections={meeting.sections} />
                                  
                                  {/* View Details Dialog */}
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="gap-1">
                                        <Eye className="h-4 w-4" />
                                        View
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle className="text-xl">{meeting.title}</DialogTitle>
                                      </DialogHeader>
                                      
                                      <div className="space-y-6">
                                        {/* Meeting Header Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <CalendarDays className="h-5 w-5 text-gray-500" />
                                            <div>
                                              <p className="text-sm font-medium">Date & Time</p>
                                              <p className="text-sm text-gray-600">{formatDate(meeting.date)}</p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-gray-500" />
                                            <div>
                                              <p className="text-sm font-medium">Attendees</p>
                                              <p className="text-sm text-gray-600">{meeting.attendees.length} people</p>
                                            </div>
                                          </div>
                                          {meeting.purpose && (
                                            <div className="md:col-span-2 flex items-start gap-2">
                                              <Target className="h-5 w-5 text-gray-500 mt-0.5" />
                                              <div>
                                                <p className="text-sm font-medium">Purpose</p>
                                                <p className="text-sm text-gray-600">{meeting.purpose}</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {/* Attendees List */}
                                        {meeting.attendees.length > 0 && (
                                          <div>
                                            <h3 className="text-lg font-semibold mb-3">Attendees</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                              {meeting.attendees.map((attendee, index) => (
                                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-medium text-blue-700">
                                                      {attendee.name.charAt(0).toUpperCase()}
                                                    </span>
                                                  </div>
                                                  <div>
                                                    <p className="text-sm font-medium">{attendee.name}</p>
                                                    {attendee.email && (
                                                      <p className="text-xs text-gray-500">{attendee.email}</p>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Sections Overview */}
                                        <div>
                                          <h3 className="text-lg font-semibold mb-3">Meeting Sections</h3>
                                          <div className="space-y-3">
                                            {meeting.sections.map((section) => {
                                              const statusCounts = section.items.reduce((acc, item) => {
                                                acc[item.status] = (acc[item.status] || 0) + 1;
                                                return acc;
                                              }, {} as Record<string, number>);

                                              return (
                                                <div key={section.id} className="border rounded-lg p-4">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-medium">{section.title}</h4>
                                                    <div className="flex items-center gap-1">
                                                      {Object.entries(statusCounts).map(([status, count]) => (
                                                        <div key={status} className="flex items-center gap-1">
                                                          <StatusBadge status={status as any} />
                                                          <span className="text-sm text-gray-600">{count}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                  <p className="text-sm text-gray-600">
                                                    {section.items.length} item{section.items.length !== 1 ? 's' : ''} reviewed
                                                  </p>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  {/* Delete Meeting Dialog */}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{meeting.title}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => deleteMeeting(meeting.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};