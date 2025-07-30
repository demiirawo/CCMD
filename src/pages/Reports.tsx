import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarDays, FileText, Users, Eye, Trash2, Clock, Target, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MeetingStatusSummary } from "@/components/MeetingStatusSummary";
import { StatusBadge } from "@/components/StatusBadge";
import { QuarterlyReportGenerator } from "@/components/QuarterlyReportGenerator";

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
  attendees: Array<{
    id: string;
    name: string;
    email: string;
  }>;
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
  const { profile } = useAuth();
  const [meetings, setMeetings] = useState<ParsedMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuarters, setExpandedQuarters] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  useEffect(() => {
    if (profile?.company_id) {
      fetchMeetings();
    }
  }, [profile?.company_id]);

  useEffect(() => {
    if (profile?.company_id) {
      fetchMeetings();

      // Set up periodic refresh to catch new meetings (every 3 seconds)
      const interval = setInterval(fetchMeetings, 3000);
      return () => clearInterval(interval);
    }
  }, [profile?.company_id]);

  const fetchMeetings = async () => {
    if (!profile?.company_id) {
      console.log('No company_id found in profile, skipping meetings fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching meetings for company:', profile.company_id);
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching meetings:', error);
        return;
      }

      // Parse the JSON strings back to objects
      const parsedMeetings = (data || []).map(meeting => ({
        ...meeting,
        attendees: JSON.parse(typeof meeting.attendees === 'string' ? meeting.attendees : '[]'),
        sections: JSON.parse(typeof meeting.sections === 'string' ? meeting.sections : '[]'),
        actions_log: JSON.parse(typeof (meeting as any).actions_log === 'string' ? (meeting as any).actions_log : '[]')
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
  
  const toggleQuarterExpansion = (quarterKey: string) => {
    setExpandedQuarters(prev => ({
      ...prev,
      [quarterKey]: !prev[quarterKey]
    }));
  };
  
  const isQuarterExpanded = (quarterKey: string) => {
    return expandedQuarters[quarterKey] ?? true; // Default to expanded
  };
  
  const groupedMeetings = groupMeetingsByQuarter(meetings);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">Loading meetings...</div>
        </div>
      </div>
    );
  }

  if (!profile?.company_id) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">Please select a company to view reports.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {Object.keys(groupedMeetings).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings saved yet</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMeetings).sort(([a], [b]) => b.localeCompare(a)).map(([quarterKey, quarterMeetings]) => {
              const [year, quarter] = quarterKey.split('-');
              const yearNum = parseInt(year);
              const isCurrent = isCurrentQuarter(quarter, yearNum);
              const isExpanded = isQuarterExpanded(quarterKey);
              
              return (
                <div key={quarterKey} className="rounded-2xl shadow-lg border border-border/50 bg-white p-6">
                  {/* Quarter Header with Collapsible Controls */}
                  <div 
                    className="flex items-center justify-between cursor-pointer mb-4"
                    onClick={() => toggleQuarterExpansion(quarterKey)}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">
                          {quarter} {year}
                          {isCurrent && (
                            <Badge variant="outline" className="ml-3 bg-blue-50 text-blue-700 border-blue-200">
                              Current Quarter
                            </Badge>
                          )}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {quarterMeetings.length} meeting{quarterMeetings.length !== 1 ? 's' : ''} saved
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        <QuarterlyReportGenerator 
                          quarter={quarter}
                          year={year}
                          meetings={quarterMeetings}
                        />
                      </div>
                      
                      <div className="p-1 rounded-lg hover:bg-accent/50 transition-colors">
                        {isExpanded ? 
                          <ChevronDown className="w-5 h-5 text-muted-foreground" /> : 
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        }
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Quarter Content */}
                  {isExpanded && (
                    <div className="space-y-3 pt-4 border-t border-border/20">
                      {quarterMeetings.map(meeting => (
                        <div key={meeting.id} className="rounded-lg p-4 border bg-card/50">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-foreground mb-1">
                                  {meeting.title}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                  <div className="flex items-center gap-1">
                                    <CalendarDays className="h-4 w-4" />
                                    {formatDate(meeting.date)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}
                                  </div>
                                </div>
                              </div>
                              <div className="ml-4 flex items-center gap-2">
                                <MeetingStatusSummary sections={meeting.sections} />
                              </div>
                            </div>
                            {meeting.purpose && (
                              <p className="text-sm text-muted-foreground w-full">{meeting.purpose}</p>
                            )}
                            <div className="flex items-center gap-2">
                              {/* View Details Dialog */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <Eye className="h-4 w-4" />
                                    View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-background">
                                   <DialogHeader>
                                     <DialogTitle className="text-xl">{meeting.title}</DialogTitle>
                                   </DialogHeader>
                                   
                                   <div className="space-y-6">
                                     {/* Meeting Header Info */}
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                       <div className="flex items-center gap-2">
                                         <CalendarDays className="h-5 w-5 text-muted-foreground" />
                                         <div>
                                           <p className="text-sm font-medium">Date & Time</p>
                                           <p className="text-sm text-muted-foreground">{formatDate(meeting.date)}</p>
                                         </div>
                                       </div>
                                       <div className="flex items-center gap-2">
                                         <Users className="h-5 w-5 text-muted-foreground" />
                                         <div>
                                           <p className="text-sm font-medium">Attendees</p>
                                           <p className="text-sm text-muted-foreground">{meeting.attendees.length} people</p>
                                         </div>
                                       </div>
                                     </div>

                                     {/* Meeting Summary */}
                                     {meeting.purpose && (
                                       <div>
                                         <h3 className="text-lg font-semibold mb-3">Meeting Summary</h3>
                                         <Card>
                                           <CardContent className="p-4">
                                             <p className="text-sm text-muted-foreground">{meeting.purpose}</p>
                                           </CardContent>
                                         </Card>
                                       </div>
                                     )}

                                     {/* Actions Summary */}
                                     {(meeting as any).actions_log && (meeting as any).actions_log.length > 0 && (
                                       <div>
                                         <h3 className="text-lg font-semibold mb-3">Actions Summary</h3>
                                         <div className="space-y-3">
                                           {(meeting as any).actions_log.map((action: any, index: number) => (
                                             <Card key={index}>
                                               <CardContent className="p-4">
                                                 <div className="flex justify-between items-start gap-4">
                                                   <div className="flex-1">
                                                     <p className="font-medium text-sm">{action.action_text}</p>
                                                     <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                                       <span>Assigned to: {action.mentioned_attendee}</span>
                                                       <span>Due: {action.due_date}</span>
                                                       {action.source_id && (
                                                         <span>From: {action.source_id}</span>
                                                       )}
                                                     </div>
                                                   </div>
                                                   <StatusBadge status={action.status} />
                                                 </div>
                                               </CardContent>
                                             </Card>
                                           ))}
                                         </div>
                                       </div>
                                     )}

                                     {/* Attendees List */}
                                     {meeting.attendees.length > 0 && (
                                       <div>
                                         <h3 className="text-lg font-semibold mb-3">Attendees</h3>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                           {meeting.attendees.map((attendee, index) => (
                                             <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                               <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                 <span className="text-sm font-medium text-primary">
                                                   {attendee.name.charAt(0).toUpperCase()}
                                                 </span>
                                               </div>
                                               <div>
                                                 <p className="text-sm font-medium">{attendee.name}</p>
                                                 {attendee.email && <p className="text-xs text-muted-foreground">{attendee.email}</p>}
                                               </div>
                                             </div>
                                           ))}
                                         </div>
                                       </div>
                                     )}

                                     {/* Enhanced Sections with Observations */}
                                     <div>
                                       <h3 className="text-lg font-semibold mb-3">Section Details & Observations</h3>
                                       <div className="space-y-4">
                                         {meeting.sections.map((section: any, sectionIndex: number) => (
                                           <Card key={sectionIndex}>
                                             <CardContent className="p-4">
                                               <div className="flex justify-between items-center mb-3">
                                                 <h4 className="font-medium">{section.title}</h4>
                                                 <div className="flex items-center gap-1">
                                                   {section.items && section.items.map((item: any, itemIndex: number) => (
                                                     <StatusBadge key={itemIndex} status={item.status} />
                                                   ))}
                                                 </div>
                                               </div>
                                               
                                               {section.items && section.items.length > 0 && (
                                                 <div className="space-y-3">
                                                   {section.items.map((item: any, itemIndex: number) => (
                                                     <div key={itemIndex} className="border-l-2 border-muted pl-4">
                                                       <div className="flex justify-between items-start gap-2">
                                                         <div className="flex-1">
                                                           <p className="font-medium text-sm">{item.title || `Item ${itemIndex + 1}`}</p>
                                                           {item.observation && (
                                                             <p className="text-xs text-muted-foreground mt-1">
                                                               <strong>Observation:</strong> {item.observation}
                                                             </p>
                                                           )}
                                                           {item.actions && item.actions.length > 0 && (
                                                             <div className="mt-2">
                                                               <p className="text-xs font-medium text-muted-foreground">Actions:</p>
                                                               <ul className="text-xs text-muted-foreground ml-2">
                                                                 {item.actions.map((action: any, actionIndex: number) => (
                                                                   <li key={actionIndex}>• {action.action_text} (Due: {action.due_date})</li>
                                                                 ))}
                                                               </ul>
                                                             </div>
                                                           )}
                                                         </div>
                                                         <StatusBadge status={item.status} />
                                                       </div>
                                                     </div>
                                                   ))}
                                                 </div>
                                               )}

                                               {(!section.items || section.items.length === 0) && (
                                                 <p className="text-sm text-muted-foreground">No items tracked in this section</p>
                                               )}
                                             </CardContent>
                                           </Card>
                                         ))}
                                       </div>
                                     </div>
                                   </div>
                                </DialogContent>
                              </Dialog>

                              {/* Delete Meeting Dialog */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10">
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
                                      className="bg-destructive hover:bg-destructive/90"
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
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};