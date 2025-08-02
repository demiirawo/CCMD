import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarDays, FileText, Users, Eye, Trash2, Clock, Target, ChevronDown, ChevronRight, X, Download } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
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
  const {
    profile
  } = useAuth();

  // Check if user has edit permissions
  const canEdit = profile?.permission === 'edit' || profile?.permission === 'company_admin' || profile?.role === 'admin';
  useTheme(); // Apply dynamic theme
  const [meetings, setMeetings] = useState<ParsedMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuarters, setExpandedQuarters] = useState<Record<string, boolean>>({});
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const {
    toast
  } = useToast();
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

      // Find existing preview element or use the currently open one
      let previewElement = document.querySelector(`[data-meeting-preview="${meetingId}"]`);
      let tempModal: HTMLElement | null = null;
      
      if (!previewElement) {
        // Create a temporary full-size container that matches the original dashboard view exactly
        tempModal = document.createElement('div');
        tempModal.style.position = 'fixed';
        tempModal.style.top = '0';
        tempModal.style.left = '0';
        tempModal.style.width = '100vw';
        tempModal.style.height = '100vh';
        tempModal.style.zIndex = '9999';
        tempModal.style.background = 'white';
        tempModal.style.overflow = 'hidden';
        tempModal.setAttribute('data-meeting-preview', meetingId);
        
        document.body.appendChild(tempModal);

        // Import and render the ReadOnlyDashboardView
        const React = (await import('react')).default;
        const ReactDOM = (await import('react-dom/client')).default;
        const { ReadOnlyDashboardView } = await import('@/components/ReadOnlyDashboardView');
        
        const root = ReactDOM.createRoot(tempModal);
        root.render(React.createElement(ReadOnlyDashboardView, { meetingId }));

        // Wait for the component to fully render
        await new Promise(resolve => setTimeout(resolve, 3000));
        previewElement = tempModal;
      }

      // Get the actual rendered content
      const dashboardContent = previewElement.querySelector('.bg-gray-100') || previewElement;
      
      if (!dashboardContent) {
        throw new Error('Dashboard content not found');
      }

      // Create a temporary container that preserves the original dimensions and layout
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1200px'; // Use a standard desktop width
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      tempContainer.style.fontSize = '14px';
      tempContainer.style.lineHeight = '1.5';
      tempContainer.innerHTML = dashboardContent.innerHTML;

      // Apply comprehensive PDF-optimized styles
      const style = document.createElement('style');
      style.textContent = `
        #${tempContainer.id} {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          background: white !important;
          color: #000 !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
        }
        #${tempContainer.id} * { 
          box-sizing: border-box !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Layout preservation */
        #${tempContainer.id} .w-\\[90\\%\\] { width: 90% !important; }
        #${tempContainer.id} .mx-auto { margin-left: auto !important; margin-right: auto !important; }
        #${tempContainer.id} .space-y-6 > * + * { margin-top: 24px !important; }
        #${tempContainer.id} .grid { display: grid !important; }
        #${tempContainer.id} .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        #${tempContainer.id} .gap-4 { gap: 16px !important; }
        #${tempContainer.id} .gap-6 { gap: 24px !important; }
        #${tempContainer.id} .flex { display: flex !important; }
        #${tempContainer.id} .items-center { align-items: center !important; }
        #${tempContainer.id} .justify-between { justify-content: space-between !important; }
        #${tempContainer.id} .rounded-xl { border-radius: 12px !important; }
        #${tempContainer.id} .rounded-lg { border-radius: 8px !important; }
        #${tempContainer.id} .rounded-2xl { border-radius: 16px !important; }
        #${tempContainer.id} .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important; }
        #${tempContainer.id} .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important; }
        
        /* Colors and backgrounds */
        #${tempContainer.id} .bg-gray-100 { background-color: #f3f4f6 !important; }
        #${tempContainer.id} .bg-white { background-color: white !important; }
        #${tempContainer.id} .bg-blue-50 { background-color: #eff6ff !important; }
        #${tempContainer.id} .bg-green-50 { background-color: #f0fdf4 !important; }
        #${tempContainer.id} .bg-yellow-50 { background-color: #fefce8 !important; }
        #${tempContainer.id} .bg-red-50 { background-color: #fef2f2 !important; }
        #${tempContainer.id} .bg-amber-50 { background-color: #fffbeb !important; }
        #${tempContainer.id} .bg-gray-50 { background-color: #f9fafb !important; }
        #${tempContainer.id} .bg-primary\\/10 { background-color: rgba(59, 130, 246, 0.1) !important; }
        #${tempContainer.id} .bg-status-green { background-color: #059669 !important; }
        #${tempContainer.id} .bg-status-amber { background-color: #d97706 !important; }
        #${tempContainer.id} .bg-status-red { background-color: #dc2626 !important; }
        #${tempContainer.id} .bg-muted\\/20 { background-color: rgba(148, 163, 184, 0.2) !important; }
        
        /* Text colors */
        #${tempContainer.id} .text-foreground { color: #000 !important; }
        #${tempContainer.id} .text-muted-foreground { color: #6b7280 !important; }
        #${tempContainer.id} .text-white { color: white !important; }
        #${tempContainer.id} .text-white\\/80 { color: rgba(255, 255, 255, 0.8) !important; }
        #${tempContainer.id} .text-blue-800 { color: #1e40af !important; }
        #${tempContainer.id} .text-green-600 { color: #059669 !important; }
        #${tempContainer.id} .text-green-700 { color: #047857 !important; }
        #${tempContainer.id} .text-yellow-600 { color: #d97706 !important; }
        #${tempContainer.id} .text-yellow-700 { color: #b45309 !important; }
        #${tempContainer.id} .text-red-600 { color: #dc2626 !important; }
        #${tempContainer.id} .text-red-700 { color: #b91c1c !important; }
        #${tempContainer.id} .text-primary { color: #3b82f6 !important; }
        
        /* Borders */
        #${tempContainer.id} .border { border: 1px solid #e5e7eb !important; }
        #${tempContainer.id} .border-gray-100 { border-color: #f3f4f6 !important; }
        #${tempContainer.id} .border-gray-200 { border-color: #e5e7eb !important; }
        #${tempContainer.id} .border-blue-200 { border-color: #bfdbfe !important; }
        #${tempContainer.id} .border-green-200 { border-color: #bbf7d0 !important; }
        #${tempContainer.id} .border-green-300 { border-color: #86efac !important; }
        #${tempContainer.id} .border-yellow-200 { border-color: #fef3c7 !important; }
        #${tempContainer.id} .border-red-200 { border-color: #fecaca !important; }
        #${tempContainer.id} .border-amber-200 { border-color: #fde68a !important; }
        #${tempContainer.id} .border-border\\/30 { border-color: rgba(229, 231, 235, 0.3) !important; }
        #${tempContainer.id} .border-border\\/20 { border-color: rgba(229, 231, 235, 0.2) !important; }
        #${tempContainer.id} .border-t { border-top: 1px solid #e5e7eb !important; }
        #${tempContainer.id} .border-b { border-bottom: 1px solid #e5e7eb !important; }
        
        /* Spacing */
        #${tempContainer.id} .p-4 { padding: 16px !important; }
        #${tempContainer.id} .p-6 { padding: 24px !important; }
        #${tempContainer.id} .p-8 { padding: 32px !important; }
        #${tempContainer.id} .pt-8 { padding-top: 32px !important; }
        #${tempContainer.id} .pt-14 { padding-top: 56px !important; }
        #${tempContainer.id} .pb-8 { padding-bottom: 32px !important; }
        #${tempContainer.id} .px-14 { padding-left: 56px !important; padding-right: 56px !important; }
        #${tempContainer.id} .px-3 { padding-left: 12px !important; padding-right: 12px !important; }
        #${tempContainer.id} .py-1 { padding-top: 4px !important; padding-bottom: 4px !important; }
        #${tempContainer.id} .py-2 { padding-top: 8px !important; padding-bottom: 8px !important; }
        #${tempContainer.id} .py-3 { padding-top: 12px !important; padding-bottom: 12px !important; }
        #${tempContainer.id} .py-8 { padding-top: 32px !important; padding-bottom: 32px !important; }
        #${tempContainer.id} .mb-2 { margin-bottom: 8px !important; }
        #${tempContainer.id} .mb-3 { margin-bottom: 12px !important; }
        #${tempContainer.id} .mb-4 { margin-bottom: 16px !important; }
        #${tempContainer.id} .mb-6 { margin-bottom: 24px !important; }
        #${tempContainer.id} .mb-8 { margin-bottom: 32px !important; }
        #${tempContainer.id} .mb-10 { margin-bottom: 40px !important; }
        #${tempContainer.id} .mt-1 { margin-top: 4px !important; }
        #${tempContainer.id} .mt-2 { margin-top: 8px !important; }
        #${tempContainer.id} .mt-4 { margin-top: 16px !important; }
        #${tempContainer.id} .-mx-8 { margin-left: -32px !important; margin-right: -32px !important; }
        
        /* Typography */
        #${tempContainer.id} .text-xs { font-size: 12px !important; line-height: 16px !important; }
        #${tempContainer.id} .text-sm { font-size: 14px !important; line-height: 20px !important; }
        #${tempContainer.id} .text-base { font-size: 16px !important; line-height: 24px !important; }
        #${tempContainer.id} .text-lg { font-size: 18px !important; line-height: 28px !important; }
        #${tempContainer.id} .text-xl { font-size: 20px !important; line-height: 28px !important; }
        #${tempContainer.id} .text-2xl { font-size: 24px !important; line-height: 32px !important; }
        #${tempContainer.id} .font-medium { font-weight: 500 !important; }
        #${tempContainer.id} .font-semibold { font-weight: 600 !important; }
        #${tempContainer.id} .font-bold { font-weight: 700 !important; }
        #${tempContainer.id} .whitespace-pre-wrap { white-space: pre-wrap !important; }
        #${tempContainer.id} .break-words { word-wrap: break-word !important; }
        #${tempContainer.id} .overflow-wrap-anywhere { overflow-wrap: anywhere !important; }
        #${tempContainer.id} .truncate { overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
        
        /* Layout specifics */
        #${tempContainer.id} .min-h-\\[80px\\] { min-height: 80px !important; }
        #${tempContainer.id} .min-h-\\[140px\\] { min-height: 140px !important; }
        #${tempContainer.id} .min-h-12 { min-height: 48px !important; }
        #${tempContainer.id} .min-h-24 { min-height: 96px !important; }
        #${tempContainer.id} .h-32 { height: 128px !important; }
        #${tempContainer.id} .w-2 { width: 8px !important; }
        #${tempContainer.id} .h-2 { height: 8px !important; }
        #${tempContainer.id} .w-3 { width: 12px !important; }
        #${tempContainer.id} .h-3 { height: 12px !important; }
        #${tempContainer.id} .w-4 { width: 16px !important; }
        #${tempContainer.id} .h-4 { height: 16px !important; }
        #${tempContainer.id} .w-6 { width: 24px !important; }
        #${tempContainer.id} .h-6 { height: 24px !important; }
        #${tempContainer.id} .w-8 { width: 32px !important; }
        #${tempContainer.id} .h-8 { height: 32px !important; }
        
        /* Flexbox and positioning */
        #${tempContainer.id} .flex-1 { flex: 1 1 0% !important; }
        #${tempContainer.id} .flex-\\[5\\] { flex: 5 5 0% !important; }
        #${tempContainer.id} .flex-shrink-0 { flex-shrink: 0 !important; }
        #${tempContainer.id} .items-start { align-items: flex-start !important; }
        #${tempContainer.id} .justify-center { justify-content: center !important; }
        #${tempContainer.id} .text-center { text-align: center !important; }
        #${tempContainer.id} .relative { position: relative !important; }
        #${tempContainer.id} .sticky { position: sticky !important; }
        #${tempContainer.id} .top-0 { top: 0 !important; }
        #${tempContainer.id} .z-10 { z-index: 10 !important; }
        
        /* Hide interactive elements */
        #${tempContainer.id} button,
        #${tempContainer.id} [role="button"],
        #${tempContainer.id} .cursor-pointer { display: none !important; }
        
        /* Ensure status badges show correctly */
        #${tempContainer.id} .inline-flex { display: inline-flex !important; }
        #${tempContainer.id} .items-center { align-items: center !important; }
        
        /* Space utilities */
        #${tempContainer.id} .space-y-2 > * + * { margin-top: 8px !important; }
        #${tempContainer.id} .space-y-3 > * + * { margin-top: 12px !important; }
        #${tempContainer.id} .space-y-4 > * + * { margin-top: 16px !important; }
        #${tempContainer.id} .space-y-6 > * + * { margin-top: 24px !important; }
      `;
      
      tempContainer.id = `pdf-export-${Date.now()}`;
      document.head.appendChild(style);
      document.body.appendChild(tempContainer);

      // Wait for styles and layout to settle
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate canvas with high quality settings
      const canvas = await html2canvas(tempContainer, {
        scale: 2, // High resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1200, // Match container width
        height: tempContainer.scrollHeight,
        logging: false,
        removeContainer: false
      });

      // Clean up temporary elements
      document.head.removeChild(style);
      document.body.removeChild(tempContainer);
      if (tempModal) {
        document.body.removeChild(tempModal);
      }

      // Create PDF with optimized settings
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const canvasAspectRatio = canvas.height / canvas.width;
      const imgWidth = pdfWidth;
      const imgHeight = pdfWidth * canvasAspectRatio;

      let position = 0;
      const imgData = canvas.toDataURL('image/png', 1.0); // Maximum quality

      // Add content across multiple pages if needed
      if (imgHeight <= pdfHeight) {
        // Content fits on one page
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        // Content spans multiple pages
        let heightLeft = imgHeight;
        
        while (heightLeft > 0) {
          if (position > 0) {
            pdf.addPage();
          }
          
          const pageTop = -position;
          pdf.addImage(imgData, 'PNG', 0, pageTop, imgWidth, imgHeight);
          
          heightLeft -= pdfHeight;
          position += pdfHeight;
        }
      }

      // Save the PDF
      const fileName = `${meetingTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_dashboard_report.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF Generated Successfully",
        description: "Your dashboard report has been downloaded with full formatting preserved."
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

  // Get unique years from meetings for the filter
  const getAvailableYears = () => {
    const years = meetings.map(meeting => meeting.year);
    return [...new Set(years)].sort((a, b) => b - a); // Sort descending (newest first)
  };

  // Filter meetings by selected year
  const filteredMeetings = selectedYear ? meetings.filter(meeting => meeting.year === selectedYear) : meetings;
  const groupedMeetings = groupMeetingsByQuarter(filteredMeetings);
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
  return <div className="min-h-screen bg-gray-100 p-4 lg:p-8 pt-24">
      <div className="w-[90%] mx-auto space-y-6">
        {/* Year Filter */}
        <div className="flex items-center gap-4 mb-6">
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings saved yet</h3>
            </CardContent>
          </Card> : <div className="space-y-6">
            {Object.entries(groupedMeetings).sort(([a], [b]) => b.localeCompare(a)).map(([quarterKey, quarterMeetings]) => {
          const [year, quarter] = quarterKey.split('-');
          const yearNum = parseInt(year);
          const isCurrent = isCurrentQuarter(quarter, yearNum);
          const isExpanded = isQuarterExpanded(quarterKey);
          return <div key={quarterKey} className="shadow-lg border border-border/50 bg-primary/5 p-6 rounded-2xl mx-0 px-[95px]">
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
                      {canEdit && <div onClick={e => e.stopPropagation()}>
                          <QuarterlyReportGenerator quarter={quarter} year={year} meetings={quarterMeetings} />
                        </div>}
                      
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
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}
                              </div>
                              
                            </div>
                            <div className="flex items-center gap-2">
                               {/* View Dashboard Dialog */}
                               <Dialog>
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
                                          {meeting.title} - Dashboard View
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
                                     
                                      {/* Full Dashboard View */}
                                      <div className="p-4" data-meeting-preview={meeting.id}>
                                        <ReadOnlyDashboardView meetingId={meeting.id} />
                                      </div>
                                   </div>
                                 </DialogContent>
                               </Dialog>


                               {/* Export PDF Button */}
                                <Button variant="default" size="sm" onClick={() => handleExportPDF(meeting.id, meeting.title)}>
                                  PDF
                                </Button>

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