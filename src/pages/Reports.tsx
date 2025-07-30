import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarDays, FileText, Users, Eye, Trash2, Clock, Target, ChevronDown, ChevronRight, X, Printer, Download } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MeetingStatusSummary } from "@/components/MeetingStatusSummary";
import { StatusBadge } from "@/components/StatusBadge";
import { QuarterlyReportGenerator } from "@/components/QuarterlyReportGenerator";
import { ReadOnlyDashboardView } from "@/components/ReadOnlyDashboardView";

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

  const handlePrintMeeting = (meetingId: string, meetingTitle: string) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get the meeting content
    const meetingElement = document.getElementById(`meeting-print-${meetingId}`);
    if (!meetingElement) return;

    // Create print-friendly HTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${meetingTitle} - Meeting Report</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              line-height: 1.6;
              color: #333;
            }
            .print-header {
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .print-title {
              font-size: 24px;
              font-weight: bold;
              margin: 0 0 10px 0;
            }
            .print-subtitle {
              color: #6b7280;
              margin: 0;
            }
            .section {
              margin-bottom: 30px;
              break-inside: avoid;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 15px;
              color: #374151;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
            }
            .item {
              margin-bottom: 10px;
              padding: 10px;
              border-left: 3px solid #e5e7eb;
              background: #f9fafb;
            }
            .status-green { border-left-color: #10b981; }
            .status-amber { border-left-color: #f59e0b; }
            .status-red { border-left-color: #ef4444; }
            .attendee {
              margin-bottom: 8px;
              padding: 8px;
              background: #f3f4f6;
              border-radius: 4px;
            }
            .action-log-item {
              margin-bottom: 12px;
              padding: 12px;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
            }
            .action-header {
              font-weight: 600;
              margin-bottom: 8px;
            }
            .action-meta {
              font-size: 12px;
              color: #6b7280;
              margin-top: 8px;
            }
            @media print {
              .no-print { display: none; }
              body { margin: 0; padding: 15px; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${meetingElement.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleExportPDF = async (meetingId: string, meetingTitle: string) => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your PDF..."
      });

      // Create a temporary container for the ReadOnlyDashboardView
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '15mm';
      tempContainer.style.boxSizing = 'border-box';
      tempContainer.id = `pdf-export-${meetingId}`;
      
      // Add PDF-specific styles
      const style = document.createElement('style');
      style.textContent = `
        #pdf-export-${meetingId} * { 
          box-sizing: border-box !important; 
          color: #000 !important;
        }
        #pdf-export-${meetingId} {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          background: white !important;
        }
        #pdf-export-${meetingId} .bg-background { background: white !important; }
        #pdf-export-${meetingId} .bg-card { background: #f8f9fa !important; }
        #pdf-export-${meetingId} .bg-muted { background: #f1f3f4 !important; }
        #pdf-export-${meetingId} .text-foreground { color: #000 !important; }
        #pdf-export-${meetingId} .text-muted-foreground { color: #666 !important; }
        #pdf-export-${meetingId} .border { border-color: #e0e0e0 !important; }
        #pdf-export-${meetingId} .status-green { background-color: #d4edda !important; color: #155724 !important; }
        #pdf-export-${meetingId} .status-amber { background-color: #fff3cd !important; color: #856404 !important; }
        #pdf-export-${meetingId} .status-red { background-color: #f8d7da !important; color: #721c24 !important; }
        #pdf-export-${meetingId} .status-na { background-color: #e2e3e5 !important; color: #41464b !important; }
        #pdf-export-${meetingId} .shadow-lg { box-shadow: none !important; }
        #pdf-export-${meetingId} .rounded-lg { border-radius: 8px !important; }
        #pdf-export-${meetingId} .p-6 { padding: 16px !important; }
        #pdf-export-${meetingId} .p-4 { padding: 12px !important; }
        #pdf-export-${meetingId} .mb-6 { margin-bottom: 16px !important; }
        #pdf-export-${meetingId} .mb-4 { margin-bottom: 12px !important; }
        #pdf-export-${meetingId} .mb-2 { margin-bottom: 8px !important; }
        #pdf-export-${meetingId} .text-xl { font-size: 18px !important; }
        #pdf-export-${meetingId} .text-lg { font-size: 16px !important; }
        #pdf-export-${meetingId} .text-sm { font-size: 12px !important; }
        #pdf-export-${meetingId} .font-semibold { font-weight: 600 !important; }
        #pdf-export-${meetingId} .font-medium { font-weight: 500 !important; }
        #pdf-export-${meetingId} button { display: none !important; }
        #pdf-export-${meetingId} .grid { display: block !important; }
        #pdf-export-${meetingId} .flex { display: block !important; }
        #pdf-export-${meetingId} .space-y-4 > * + * { margin-top: 12px !important; }
        #pdf-export-${meetingId} .space-y-2 > * + * { margin-top: 6px !important; }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(tempContainer);

      // Dynamically import React and ReactDOM for rendering
      const React = (await import('react')).default;
      const ReactDOM = (await import('react-dom/client')).default;
      const { ReadOnlyDashboardView } = await import('@/components/ReadOnlyDashboardView');

      // Create a root and render the component
      const root = ReactDOM.createRoot(tempContainer);
      
      // Render the ReadOnlyDashboardView component
      root.render(React.createElement(ReadOnlyDashboardView, { meetingId }));

      // Wait for component to render
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate PDF with proper A4 dimensions
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: Math.ceil(210 * 3.779527559), // A4 width in pixels at 96 DPI
        height: tempContainer.scrollHeight
      });

      // Clean up
      root.unmount();
      document.head.removeChild(style);
      document.body.removeChild(tempContainer);

      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const imgData = canvas.toDataURL('image/png');
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${meetingTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_meeting_report.pdf`);

      toast({
        title: "PDF Generated",
        description: "Your meeting report has been downloaded successfully"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      });
    }
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
                               {/* View Dashboard Dialog */}
                               <Dialog>
                                 <DialogTrigger asChild>
                                   <Button variant="outline" size="sm" className="gap-1">
                                     <Eye className="h-4 w-4" />
                                     View
                                   </Button>
                                 </DialogTrigger>
                                 <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto bg-background p-0">
                                   <div className="relative">
                                     {/* Close button */}
                                     <div className="sticky top-0 z-10 bg-background border-b p-4 flex justify-between items-center">
                                       <DialogTitle className="text-xl font-bold">
                                         {meeting.title} - Dashboard View
                                       </DialogTitle>
                                       <DialogTrigger asChild>
                                         <Button variant="ghost" size="sm" className="gap-1">
                                           <X className="h-4 w-4" />
                                           Close
                                         </Button>
                                       </DialogTrigger>
                                     </div>
                                     
                                      {/* Full Dashboard View */}
                                      <div className="p-4" data-meeting-preview={meeting.id}>
                                        <ReadOnlyDashboardView meetingId={meeting.id} />
                                      </div>
                                   </div>
                                 </DialogContent>
                               </Dialog>

                               {/* Print Button */}
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 className="gap-1" 
                                 onClick={() => handlePrintMeeting(meeting.id, meeting.title)}
                               >
                                 <Printer className="h-4 w-4" />
                                 Print
                               </Button>

                               {/* Export PDF Button */}
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 className="gap-1" 
                                 onClick={() => handleExportPDF(meeting.id, meeting.title)}
                               >
                                 <Download className="h-4 w-4" />
                                 PDF
                               </Button>

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

                            {/* Hidden print-friendly content for each meeting */}
                            <div id={`meeting-print-${meeting.id}`} className="hidden">
                              <div className="print-header">
                                <h1 className="print-title">{meeting.title}</h1>
                                <p className="print-subtitle">Meeting Report - {formatDate(meeting.date)}</p>
                              </div>
                              
                              <ReadOnlyDashboardView meetingId={meeting.id} />
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