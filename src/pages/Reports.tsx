import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarDays, FileText, Users, Eye, Trash2, Clock, Target, ChevronDown, ChevronRight, X, Download } from "lucide-react";
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


  const handleExportPDF = async (meetingId: string, meetingTitle: string) => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your PDF..."
      });

      // First check if there's an open preview dialog we can use
      let previewElement = document.querySelector(`[data-meeting-preview="${meetingId}"]`);
      
      if (!previewElement) {
        // If no preview is open, we need to temporarily open one
        toast({
          title: "Opening Preview",
          description: "Opening preview to generate PDF..."
        });
        
        // Create a temporary modal container
        const tempModal = document.createElement('div');
        tempModal.style.position = 'fixed';
        tempModal.style.top = '0';
        tempModal.style.left = '0';
        tempModal.style.width = '100vw';
        tempModal.style.height = '100vh';
        tempModal.style.zIndex = '9999';
        tempModal.style.background = 'rgba(0,0,0,0.5)';
        tempModal.style.display = 'flex';
        tempModal.style.alignItems = 'center';
        tempModal.style.justifyContent = 'center';
        
        const dialogContent = document.createElement('div');
        dialogContent.style.width = '95vw';
        dialogContent.style.height = '95vh';
        dialogContent.style.background = 'white';
        dialogContent.style.borderRadius = '8px';
        dialogContent.style.overflow = 'hidden';
        dialogContent.setAttribute('data-meeting-preview', meetingId);
        
        tempModal.appendChild(dialogContent);
        document.body.appendChild(tempModal);
        
        // Import and render the ReadOnlyDashboardView
        const React = (await import('react')).default;
        const ReactDOM = (await import('react-dom/client')).default;
        const { ReadOnlyDashboardView } = await import('@/components/ReadOnlyDashboardView');
        
        const root = ReactDOM.createRoot(dialogContent);
        root.render(React.createElement(ReadOnlyDashboardView, { meetingId }));
        
        // Wait for the component to fully render
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        previewElement = dialogContent;
      }

      // Create a temporary container for PDF generation
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '10mm';
      tempContainer.style.boxSizing = 'border-box';
      
      // Clone the preview content
      tempContainer.innerHTML = previewElement.innerHTML;
      
      // Apply PDF-specific styles that preserve the design
      const style = document.createElement('style');
      style.textContent = `
        #${tempContainer.id} {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          background: white !important;
          color: #000 !important;
        }
        #${tempContainer.id} * { 
          box-sizing: border-box !important; 
        }
        #${tempContainer.id} .bg-background { background: white !important; }
        #${tempContainer.id} .bg-card { background: #f8f9fa !important; border: 1px solid #e9ecef !important; }
        #${tempContainer.id} .bg-muted { background: #f1f3f4 !important; }
        #${tempContainer.id} .bg-primary { background: #3b82f6 !important; color: white !important; }
        #${tempContainer.id} .bg-green-50 { background: #f0f9ff !important; }
        #${tempContainer.id} .bg-yellow-50 { background: #fffbeb !important; }
        #${tempContainer.id} .bg-red-50 { background: #fef2f2 !important; }
        #${tempContainer.id} .text-foreground { color: #000 !important; }
        #${tempContainer.id} .text-muted-foreground { color: #6b7280 !important; }
        #${tempContainer.id} .text-primary { color: #3b82f6 !important; }
        #${tempContainer.id} .text-green-600 { color: #059669 !important; }
        #${tempContainer.id} .text-yellow-600 { color: #d97706 !important; }
        #${tempContainer.id} .text-red-600 { color: #dc2626 !important; }
        #${tempContainer.id} .border { border-color: #e5e7eb !important; }
        #${tempContainer.id} .border-green-200 { border-color: #bbf7d0 !important; }
        #${tempContainer.id} .border-yellow-200 { border-color: #fef3c7 !important; }
        #${tempContainer.id} .border-red-200 { border-color: #fecaca !important; }
        #${tempContainer.id} .rounded-lg { border-radius: 8px !important; }
        #${tempContainer.id} .rounded-md { border-radius: 6px !important; }
        #${tempContainer.id} .rounded-full { border-radius: 9999px !important; }
        #${tempContainer.id} .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important; }
        #${tempContainer.id} .p-6 { padding: 24px !important; }
        #${tempContainer.id} .p-4 { padding: 16px !important; }
        #${tempContainer.id} .p-3 { padding: 12px !important; }
        #${tempContainer.id} .p-2 { padding: 8px !important; }
        #${tempContainer.id} .px-3 { padding-left: 12px !important; padding-right: 12px !important; }
        #${tempContainer.id} .py-1 { padding-top: 4px !important; padding-bottom: 4px !important; }
        #${tempContainer.id} .mb-6 { margin-bottom: 24px !important; }
        #${tempContainer.id} .mb-4 { margin-bottom: 16px !important; }
        #${tempContainer.id} .mb-3 { margin-bottom: 12px !important; }
        #${tempContainer.id} .mb-2 { margin-bottom: 8px !important; }
        #${tempContainer.id} .text-2xl { font-size: 24px !important; line-height: 32px !important; }
        #${tempContainer.id} .text-xl { font-size: 20px !important; line-height: 28px !important; }
        #${tempContainer.id} .text-lg { font-size: 18px !important; line-height: 28px !important; }
        #${tempContainer.id} .text-base { font-size: 16px !important; line-height: 24px !important; }
        #${tempContainer.id} .text-sm { font-size: 14px !important; line-height: 20px !important; }
        #${tempContainer.id} .text-xs { font-size: 12px !important; line-height: 16px !important; }
        #${tempContainer.id} .font-bold { font-weight: 700 !important; }
        #${tempContainer.id} .font-semibold { font-weight: 600 !important; }
        #${tempContainer.id} .font-medium { font-weight: 500 !important; }
        #${tempContainer.id} button { display: none !important; }
        #${tempContainer.id} .grid { display: block !important; }
        #${tempContainer.id} .grid-cols-3 > * { display: inline-block !important; width: 32% !important; margin-right: 2% !important; vertical-align: top !important; }
        #${tempContainer.id} .flex { display: flex !important; }
        #${tempContainer.id} .flex-wrap { flex-wrap: wrap !important; }
        #${tempContainer.id} .items-center { align-items: center !important; }
        #${tempContainer.id} .justify-between { justify-content: space-between !important; }
        #${tempContainer.id} .gap-2 { gap: 8px !important; }
        #${tempContainer.id} .gap-3 { gap: 12px !important; }
        #${tempContainer.id} .gap-4 { gap: 16px !important; }
        #${tempContainer.id} .space-y-4 > * + * { margin-top: 16px !important; }
        #${tempContainer.id} .space-y-3 > * + * { margin-top: 12px !important; }
        #${tempContainer.id} .space-y-2 > * + * { margin-top: 8px !important; }
        #${tempContainer.id} .w-8 { width: 32px !important; }
        #${tempContainer.id} .h-8 { height: 32px !important; }
      `;
      
      tempContainer.id = `pdf-export-${Date.now()}`;
      document.head.appendChild(style);
      document.body.appendChild(tempContainer);

      // Wait a moment for styles to apply
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate PDF with proper A4 dimensions
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: Math.ceil(210 * 3.779527559), // A4 width in pixels at 96 DPI
        height: tempContainer.scrollHeight
      });

      // Clean up temporary elements
      document.head.removeChild(style);
      document.body.removeChild(tempContainer);
      
      // Clean up temporary modal if we created one
      const tempModal = document.querySelector('[style*="position: fixed"][style*="z-index: 9999"]');
      if (tempModal && !document.querySelector('[data-meeting-preview]').closest('.dialog')) {
        tempModal.remove();
      }

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
                <div key={quarterKey} className="rounded-2xl shadow-lg border border-border/50 bg-card p-6">
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
                                        <div className="flex items-center gap-2">
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="gap-1"
                                            onClick={() => handleExportPDF(meeting.id, meeting.title)}
                                          >
                                            <Download className="h-4 w-4" />
                                            Save PDF
                                          </Button>
                                          <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="gap-1">
                                              <X className="h-4 w-4" />
                                              Close
                                            </Button>
                                          </DialogTrigger>
                                        </div>
                                      </div>
                                     
                                      {/* Full Dashboard View */}
                                      <div className="p-4" data-meeting-preview={meeting.id}>
                                        <ReadOnlyDashboardView meetingId={meeting.id} />
                                      </div>
                                   </div>
                                 </DialogContent>
                               </Dialog>


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