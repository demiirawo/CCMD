import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarDays, FileText, Users, Eye, Trash2, Clock, Target, ChevronDown, ChevronRight, X, Download, ExternalLink, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { MeetingStatusSummary } from "@/components/MeetingStatusSummary";
import { StatusBadge } from "@/components/StatusBadge";
import { NarrativeQuarterlyReportGenerator } from "@/components/NarrativeQuarterlyReportGenerator";
import { ReadOnlyDashboardView } from "@/components/ReadOnlyDashboardView";

import { MeetingPreview } from "@/components/MeetingPreview";


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
  document_url?: string; // Add document_url field
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
  actions_log: any[]; // Add actions_log field
  purpose: string;
  quarter: string;
  year: number;
  created_at: string;
  document_url?: string; // Add document_url field
}
interface GroupedMeetings {
  [key: string]: ParsedMeeting[];
}
export const Reports = () => {
  const {
    user,
    profile
  } = useAuth();

  // Check if user has edit permissions
  const canEdit = (user?.email === 'demi.irawo@care-cuddle.co.uk') || Boolean(profile?.company_id);
  useTheme(); // Apply dynamic theme
  const [meetings, setMeetings] = useState<ParsedMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuarters, setExpandedQuarters] = useState<Record<string, boolean>>({});
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Show 10 meetings per page
  const {
     toast
   } = useToast();
   const [inspectionSummary, setInspectionSummary] = useState<Record<string, Array<{panelId: string; panelName: string; count: number}>>>({});
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
      const {
        data,
        error
      } = await supabase.from('meetings').select('*').eq('company_id', profile.company_id).order('date', {
        ascending: false
      });
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
      const {
        error
      } = await supabase.from('meetings').delete().eq('id', meetingId);
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
   const getQuarterDateRange = (year: number, quarter: string) => {
     const startMonth = quarter === 'Q1' ? 0 : quarter === 'Q2' ? 3 : quarter === 'Q3' ? 6 : 9;
     const start = new Date(Date.UTC(year, startMonth, 1));
     const end = new Date(Date.UTC(startMonth === 9 ? year + 1 : year, (startMonth + 3) % 12, 1));
     return { start: start.toISOString(), end: end.toISOString() };
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

   const loadInspectionSummaryForQuarter = async (quarterKey: string) => {
     if (!profile?.company_id) return;
     try {
       const [yearStr, q] = quarterKey.split('-');
       const yearNum = parseInt(yearStr);
       const { start, end } = getQuarterDateRange(yearNum, q);
 
       const [respRes, panelsRes, categoriesRes, evidenceRes] = await Promise.all([
         supabase.from('inspection_company_responses')
           .select('evidence_id, updated_at')
           .eq('company_id', profile.company_id)
           .gte('updated_at', start)
           .lt('updated_at', end),
         supabase.from('inspection_panels').select('id, name'),
         supabase.from('inspection_categories').select('id, panel_id'),
         supabase.from('inspection_evidence').select('id, category_id')
       ]);
 
       if (respRes.error || panelsRes.error || categoriesRes.error || evidenceRes.error) {
         console.error('Error loading inspection summary', {
           respError: respRes.error,
           panelsError: panelsRes.error,
           categoriesError: categoriesRes.error,
           evidenceError: evidenceRes.error,
         });
         return;
       }
 
       const evidenceIds = Array.from(new Set((respRes.data || []).map((r: any) => r.evidence_id)));
       const evToCat = new Map((evidenceRes.data || []).map((e: any) => [e.id, e.category_id]));
       const catToPanel = new Map((categoriesRes.data || []).map((c: any) => [c.id, c.panel_id]));
       const panelToName = new Map((panelsRes.data || []).map((p: any) => [p.id, p.name]));
 
       const counts = new Map<string, number>();
       evidenceIds.forEach((eid) => {
         const catId = evToCat.get(eid);
         const panelId = catToPanel.get(catId);
         if (panelId) counts.set(panelId, (counts.get(panelId) || 0) + 1);
       });
 
       const summary = Array.from(counts.entries()).map(([panelId, count]) => ({
         panelId,
         panelName: (panelToName.get(panelId) as string) || 'Unknown',
         count
       }));
 
       setInspectionSummary(prev => ({ ...prev, [quarterKey]: summary }));
     } catch (e) {
       console.error('Failed to load inspection summary:', e);
     }
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
  const isDashboardMeeting = (meeting: ParsedMeeting) => {
    const ids = (meeting.sections || []).map(s => s.id);
    return ids.includes('meeting-overview') || ids.includes('staff') || ids.includes('care-planning') || ids.includes('safety') || ids.includes('continuous-improvement') || ids.includes('supported-housing');
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
    return expandedQuarters[quarterKey] ?? false; // Default to collapsed
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
        const {
          ReadOnlyDashboardView
        } = await import('@/components/ReadOnlyDashboardView');
        const root = ReactDOM.createRoot(dialogContent);
        root.render(React.createElement(ReadOnlyDashboardView, {
          meetingId
        }));

        // Wait for the component to fully render
        await new Promise(resolve => setTimeout(resolve, 3000));
        previewElement = dialogContent;
      }

      // Wait longer for the component to fully render and apply styles
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create a temporary container to ensure proper text rendering
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1200px';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '20px';
      tempContainer.style.boxSizing = 'border-box';
      tempContainer.style.overflow = 'visible';
      tempContainer.style.minHeight = 'max-content';
      
      // Clone the preview content properly
      const clonedContent = (previewElement as HTMLElement).cloneNode(true) as HTMLElement;
      tempContainer.appendChild(clonedContent);
      
      // Apply PDF-specific styles to prevent text cutoff
      const style = document.createElement('style');
      style.textContent = `
        #${tempContainer.id} {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          background: white !important;
          color: #000 !important;
          line-height: 1.5 !important;
          overflow: visible !important;
        }
        #${tempContainer.id} * { 
          box-sizing: border-box !important;
          overflow: visible !important;
          text-overflow: visible !important;
          white-space: normal !important;
        }
        #${tempContainer.id} h1, #${tempContainer.id} h2, #${tempContainer.id} h3, #${tempContainer.id} h4, #${tempContainer.id} h5, #${tempContainer.id} h6 { 
          margin-bottom: 12px !important; 
          margin-top: 20px !important; 
          line-height: 1.3 !important;
          padding: 4px 0 !important;
          overflow: visible !important;
          word-wrap: break-word !important;
        }
        #${tempContainer.id} .text-2xl { font-size: 24px !important; line-height: 1.4 !important; padding: 6px 0 !important; }
        #${tempContainer.id} .text-xl { font-size: 20px !important; line-height: 1.4 !important; padding: 4px 0 !important; }
        #${tempContainer.id} .text-lg { font-size: 18px !important; line-height: 1.4 !important; padding: 4px 0 !important; }
        #${tempContainer.id} .text-base { font-size: 16px !important; line-height: 1.4 !important; padding: 2px 0 !important; }
        #${tempContainer.id} .text-sm { font-size: 14px !important; line-height: 1.4 !important; padding: 2px 0 !important; }
        #${tempContainer.id} .text-xs { font-size: 12px !important; line-height: 1.4 !important; padding: 2px 0 !important; }
        #${tempContainer.id} .font-bold { font-weight: 700 !important; }
        #${tempContainer.id} .font-semibold { font-weight: 600 !important; }
        #${tempContainer.id} .font-medium { font-weight: 500 !important; }
        #${tempContainer.id} p { 
          margin-bottom: 8px !important; 
          line-height: 1.5 !important; 
          word-wrap: break-word !important;
          overflow: visible !important;
        }
        #${tempContainer.id} button { display: none !important; }
        #${tempContainer.id} [data-state] { display: block !important; }
        #${tempContainer.id} .collapsible { display: block !important; }
      `;
      tempContainer.id = `pdf-export-${Date.now()}`;
      document.head.appendChild(style);
      document.body.appendChild(tempContainer);

      // Wait for styles to apply and content to settle
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate canvas with better text handling
      const canvas = await html2canvas(tempContainer, {
        scale: 1.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: tempContainer.scrollWidth,
        height: tempContainer.scrollHeight,
        removeContainer: false,
        foreignObjectRendering: false,
        logging: false,
        onclone: (clonedDoc) => {
          // Ensure all text elements are visible in the cloned document
          const allTextElements = clonedDoc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');
          allTextElements.forEach(el => {
            (el as HTMLElement).style.overflow = 'visible';
            (el as HTMLElement).style.textOverflow = 'visible';
            (el as HTMLElement).style.whiteSpace = 'normal';
          });
        }
      });

      // Clean up temporary elements
      document.head.removeChild(style);
      document.body.removeChild(tempContainer);

      // Clean up temporary modal if we created one
      const tempModal = document.querySelector('[style*="position: fixed"][style*="z-index: 9999"]');
      if (tempModal && !document.querySelector('[data-meeting-preview]').closest('.dialog')) {
        tempModal.remove();
      }

      // Create PDF in landscape to fit dashboard layout better
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      const imgWidth = 297; // A4 landscape width in mm
      const pageHeight = 210; // A4 landscape height in mm  
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      // Use JPEG with balanced compression for 2-4MB files
      const imgData = canvas.toDataURL('image/jpeg', 0.85);

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
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
  const handleExportWord = async (meetingId: string, meetingTitle: string) => {
    try {
      toast({
        title: "Generating Word Document",
        description: "Please wait while we generate your Word document..."
      });

      // Get the meeting data
      const {
        data: meetingData,
        error
      } = await supabase.from('meetings').select('*').eq('id', meetingId).single();
      if (error || !meetingData) {
        throw new Error('Failed to fetch meeting data');
      }
      const parsedMeeting = {
        ...meetingData,
        attendees: JSON.parse(typeof meetingData.attendees === 'string' ? meetingData.attendees : '[]'),
        sections: JSON.parse(typeof meetingData.sections === 'string' ? meetingData.sections : '[]')
      };

      // Create Word document content
      const attendeesList = parsedMeeting.attendees.map((attendee: any) => attendee.name).join(', ');
      let content = `${parsedMeeting.title}\n\n`;
      content += `Date: ${new Date(parsedMeeting.date).toLocaleDateString('en-GB')}\n`;
      content += `Purpose: ${parsedMeeting.purpose}\n`;
      content += `Attendees: ${attendeesList}\n\n`;

      // Add sections content
      parsedMeeting.sections.forEach((section: any) => {
        content += `${section.title}\n`;
        content += '='.repeat(section.title.length) + '\n\n';
        section.items?.forEach((item: any) => {
          content += `${item.title}\n`;
          content += `Status: ${item.status?.toUpperCase() || 'NOT SET'}\n`;
          if (item.observation) {
            content += `Latest Update: ${item.observation}\n`;
          }
          if (item.trendsThemes) {
            content += `Trends & Themes: ${item.trendsThemes}\n`;
          }
          if (item.actionsRequired) {
            content += `Actions Required: ${item.actionsRequired}\n`;
          }
          if (item.keyDocuments) {
            content += `Key Documents: ${item.keyDocuments}\n`;
          }
          content += '\n';
        });
        content += '\n';
      });

      // Create and download the file
      const blob = new Blob([content], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${meetingTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_meeting_report.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: "Word Document Generated",
        description: "Your meeting report has been downloaded successfully"
      });
    } catch (error) {
      console.error('Error generating Word document:', error);
      toast({
        title: "Word Export Failed",
        description: "There was an error generating the Word document. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Get unique years from meetings for the filter
  const getAvailableYears = () => {
    const years = meetings.map(meeting => meeting.year);
    return [...new Set(years)].sort((a, b) => b - a); // Sort descending (newest first)
  };

  // Filter meetings by selected year
  const filteredMeetings = selectedYear ? meetings.filter(meeting => meeting.year === selectedYear) : meetings;

  // Pagination logic
  const totalMeetings = filteredMeetings.length;
  const totalPages = Math.ceil(totalMeetings / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMeetings = filteredMeetings.slice(startIndex, endIndex);
  const groupedMeetings = groupMeetingsByQuarter(paginatedMeetings);

  // Load inspection summaries for displayed quarters
  useEffect(() => {
    Object.keys(groupedMeetings).forEach((k) => {
      if (!inspectionSummary[k]) {
        loadInspectionSummaryForQuarter(k);
      }
    });
  }, [groupedMeetings]);

  // Reset current page when year filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear]);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  if (loading) {
    return <div className="min-h-screen bg-background p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">Loading meetings...</div>
        </div>
      </div>;
  }
  if (!profile?.company_id) {
    return <div className="min-h-screen bg-background p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">Please select a company to view reports.</div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-100 p-4 lg:p-8 pt-40">
      <div className="w-[90%] mx-auto space-y-6">

        {/* Year Filter */}
        <div className="flex items-center justify-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm py-[15px] mt-16">
          <label className="text-sm font-medium text-foreground">Filter by Year:</label>
          <Select value={selectedYear?.toString() || "all"} onValueChange={value => setSelectedYear(value === "all" ? null : parseInt(value))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {getAvailableYears().map(year => <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>)}
            </SelectContent>
          </Select>
          {selectedYear && <span className="text-sm text-muted-foreground">
              Showing {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? 's' : ''} from {selectedYear}
            </span>}
        </div>

        {Object.keys(groupedMeetings).length === 0 ? <Card>
            <CardContent className="py-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
              <p className="text-muted-foreground">
                {selectedYear ? `No meetings found for ${selectedYear}` : "No meetings saved yet"}
              </p>
            </CardContent>
          </Card> : <div className="space-y-6">
            {Object.entries(groupedMeetings).sort(([a], [b]) => b.localeCompare(a)).map(([quarterKey, quarterMeetings]) => {
          const [year, quarter] = quarterKey.split('-');
          const yearNum = parseInt(year);
          const isCurrent = isCurrentQuarter(quarter, yearNum);
          const isExpanded = isQuarterExpanded(quarterKey);
          return <div key={quarterKey} className="shadow-lg border border-border/50 p-6 rounded-2xl mx-0 px-[95px]" style={{backgroundColor: '#DFE1E3'}}>
                  {/* Quarter Header with Collapsible Controls */}
                  <div className="flex items-center justify-between cursor-pointer mb-4" onClick={() => toggleQuarterExpansion(quarterKey)}>
                    <div className="flex items-center gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">
                           {quarter} {year}
                           {isCurrent && <Badge variant="default" className="ml-3">
                               Current Quarter
                             </Badge>}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {quarterMeetings.length} meeting{quarterMeetings.length !== 1 ? 's' : ''} saved
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Fixed container for consistent button positioning */}
                      <div className="flex items-center gap-2 min-w-[300px] justify-end">
                        {canEdit && (
                          <div onClick={e => e.stopPropagation()} className="flex items-center gap-2">
                            <NarrativeQuarterlyReportGenerator quarter={quarter} year={year} meetings={quarterMeetings} />
                          </div>
                        )}
                      </div>
                      
                      <div className="p-1 rounded-lg hover:bg-accent/50 transition-colors">
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Quarter Content */}
                  {isExpanded && <div className="space-y-3 pt-4 border-t border-border/20">
                      {quarterMeetings.map(meeting => <div key={meeting.id} className="rounded-lg p-4 border bg-white">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-6 flex-1">
                              <h4 className="font-medium text-foreground">
                                {meeting.title}
                              </h4>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4" />
                                {formatDate(meeting.date)}
                              </div>
                              {/* Hide attendees for custom meetings (purpose is null) */}
                              {meeting.purpose !== null && <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Users className="h-4 w-4" />
                                  {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}
                                </div>}
                              {meeting.document_url && <div className="flex items-center gap-1 text-sm text-primary">
                                  <FileText className="h-4 w-4" />
                                  <a href="#" className="hover:underline flex items-center gap-1 cursor-pointer" onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();

                        // Create signed URL for private storage
                        supabase.storage.from('meeting-documents').createSignedUrl(meeting.document_url, 3600) // 1 hour expiry
                        .then(({
                          data,
                          error
                        }) => {
                          if (error) {
                            console.error('Error creating signed URL:', error);
                            toast({
                              title: "Error",
                              description: "Could not access document",
                              variant: "destructive"
                            });
                          } else if (data?.signedUrl) {
                            window.open(data.signedUrl, '_blank');
                          }
                        });
                      }}>
                                    View Document
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>}
                              
                            </div>
                             <div className="flex items-center gap-2 min-w-[300px] justify-end">
                                {/* Hide View button for custom meetings (purpose is null) */}
                                {meeting.purpose !== null && <Dialog>
                                    <DialogTrigger asChild>
                                         <Button variant="default" size="sm">
                                           View
                                         </Button>
                                    </DialogTrigger>
                                 <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto bg-background p-0">
                                   <div className="relative">
                                     {/* Close button */}
                                      <div className="sticky top-0 z-10 bg-background border-b p-4 flex justify-between items-center">
                                        <DialogTitle className="text-xl font-bold">
                                          {meeting.title} - Meeting Preview
                                        </DialogTitle>
                                          <div className="flex items-center gap-2">
                                             <Button variant="outline" size="sm" onClick={() => handleExportPDF(meeting.id, meeting.title)}>
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
                                     
                                      {/* Preview - Dashboard-saved vs Meetings-saved */}
                                       {isDashboardMeeting(meeting) ? (
                                         <div className="p-4" data-meeting-preview={meeting.id}>
                                           <ReadOnlyDashboardView meetingId={meeting.id} />
                                         </div>
                                       ) : (
                                         <div className="p-4" data-meeting-preview={meeting.id}>
                                           <MeetingPreview meetingId={meeting.id} />
                                         </div>
                                       )}
                                   </div>
                                 </DialogContent>
                                </Dialog>}

                              {/* Delete Meeting Dialog */}
                              {canEdit && <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 text-white">
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
                                      <AlertDialogAction onClick={() => deleteMeeting(meeting.id)} className="bg-destructive hover:bg-destructive/90">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>}
                            </div>
                          </div>

                             {/* Hidden print-friendly content for each meeting */}
                            <div id={`meeting-print-${meeting.id}`} className="hidden">
                              <div className="print-header">
                                <h1 className="print-title">{meeting.title}</h1>
                                <p className="print-subtitle">Meeting Report - {formatDate(meeting.date)}</p>
                              </div>
                              
                              <ReadOnlyDashboardView meetingId={meeting.id} />
                            </div>
                        </div>)}
                    </div>}
                </div>;
        })}
          </div>}
      </div>
    </div>;
};