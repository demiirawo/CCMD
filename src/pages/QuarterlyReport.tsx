import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, FileText, Printer, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface CompanyInfo {
  name: string;
  logo_url: string | null;
  theme_color: string;
}

export const QuarterlyReport = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [reportContent, setReportContent] = useState<string>("");
  const [reportPages, setReportPages] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  
  const quarter = searchParams.get("quarter") || "";
  const year = searchParams.get("year") || "";
  const content = searchParams.get("content") || "";

  useEffect(() => {
    if (content) {
      const decodedContent = decodeURIComponent(content);
      setReportContent(decodedContent);
      splitContentIntoPages(decodedContent);
    }
    loadCompanyInfo();
  }, [content]);

  const loadCompanyInfo = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('name, logo_url, theme_color')
        .eq('id', profile.company_id)
        .single();

      if (error) {
        console.error('Error loading company info:', error);
        return;
      }

      setCompanyInfo(data);
    } catch (error) {
      console.error('Error loading company info:', error);
    }
  };

  const splitContentIntoPages = (content: string) => {
    const pages: string[] = [];
    
    // Create cover page (always first)
    pages.push("COVER_PAGE");
    
    // Split content by major sections (## headers)
    const sections = content.split(/(?=## \d+\.)/);
    
    sections.forEach((section, index) => {
      if (section.trim()) {
        // If section is very long, split it further
        const lines = section.split('\n');
        let currentPageContent = '';
        let lineCount = 0;
        
        for (const line of lines) {
          currentPageContent += line + '\n';
          lineCount++;
          
          // Start new page after ~25 lines or if we hit another major section
          if (lineCount >= 25 && line.trim() === '') {
            pages.push(currentPageContent.trim());
            currentPageContent = '';
            lineCount = 0;
          }
        }
        
        // Add remaining content
        if (currentPageContent.trim()) {
          pages.push(currentPageContent.trim());
        }
      }
    });
    
    setReportPages(pages);
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getQuarterDates = (quarter: string, year: string) => {
    const yearNum = parseInt(year);
    switch (quarter) {
      case 'Q1':
        return `January - March ${yearNum}`;
      case 'Q2':
        return `April - June ${yearNum}`;
      case 'Q3':
        return `July - September ${yearNum}`;
      case 'Q4':
        return `October - December ${yearNum}`;
      default:
        return `${quarter} ${year}`;
    }
  };

  const exportToPDF = async () => {
    if (!reportContent) {
      toast({
        title: "No Content",
        description: "No report content to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      // Get each page individually for better quality
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      
      let isFirstPage = true;

      for (let i = 0; i < reportPages.length; i++) {
        // Find the specific page element
        const pageElement = document.querySelector(`[data-page-index="${i}"]`) as HTMLElement;
        
        if (!pageElement) {
          console.warn(`Page ${i} element not found`);
          continue;
        }

        // Capture the page with high quality settings
        const canvas = await html2canvas(pageElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: pageElement.scrollWidth,
          height: pageElement.scrollHeight,
          windowWidth: 1200,
          windowHeight: 1600
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Add new page for each page after the first
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Calculate dimensions to fit A4 page
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;
        
        // If image is taller than page, scale it down
        const finalHeight = Math.min(imgHeight, pageHeight);
        const finalWidth = (finalHeight * canvas.width) / canvas.height;
        
        // Center the image on the page
        const xOffset = (pageWidth - finalWidth) / 2;
        const yOffset = (pageHeight - finalHeight) / 2;
        
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      }

      pdf.save(`quarterly-report-${quarter}-${year}.pdf`);
      
      toast({
        title: "Export Successful",
        description: "Report has been exported to PDF",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export report to PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  if (!reportContent || reportPages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Report Found</h2>
          <p className="text-gray-600 mb-4">The quarterly report content was not found.</p>
          <Button onClick={() => navigate('/reports')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Action Bar - Not printed */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button onClick={() => navigate('/reports')} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Button>
          
          <div className="flex items-center gap-2">
            <Button onClick={printReport} variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button 
              onClick={exportToPDF} 
              disabled={isExporting}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content - Continuous Scroll with Page Gaps */}
      <div className="py-8 print:py-0 bg-gray-100 print:bg-white">
        <div id="quarterly-report-content" className="max-w-4xl mx-auto space-y-8 print:space-y-0">
          
          {/* Display all pages with gaps */}
          {reportPages.map((pageContent, index) => (
            <div 
              key={index} 
              data-page-index={index}
              className="bg-white shadow-lg print:shadow-none page-break min-h-screen"
            >
              {index === 0 ? (
                // Cover Page
                <div className="p-12 min-h-screen flex flex-col justify-between">
                  {/* Header */}
                  <div className="text-center">
                    {companyInfo?.logo_url && (
                      <div className="mb-8">
                        <img 
                          src={companyInfo.logo_url} 
                          alt={`${companyInfo.name} Logo`}
                          className="mx-auto h-24 w-auto object-contain"
                        />
                      </div>
                    )}
                    
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      {companyInfo?.name || 'Care Agency'}
                    </h1>
                    
                    <div className="w-24 h-1 mx-auto mb-8" style={{ backgroundColor: companyInfo?.theme_color || '#3b82f6' }}></div>
                  </div>

                  {/* Main Title */}
                  <div className="text-center flex-1 flex flex-col justify-center">
                    <h2 className="text-5xl font-bold text-gray-900 mb-6">
                      Quarterly Report
                    </h2>
                    
                    <h3 className="text-3xl font-semibold text-gray-700 mb-4">
                      {quarter} {year}
                    </h3>
                    
                    <p className="text-xl text-gray-600 mb-8">
                      {getQuarterDates(quarter, year)}
                    </p>
                    
                    <div className="w-32 h-0.5 bg-gray-300 mx-auto"></div>
                  </div>

                  {/* Footer */}
                  <div className="text-center text-gray-600">
                    <p className="text-lg">
                      Report Generated: {getCurrentDate()}
                    </p>
                  </div>
                </div>
              ) : (
                // Content Pages
                <div className="p-12 min-h-screen">
                  <div className="prose prose-lg max-w-none">
                    <div className="report-content" style={{ 
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      lineHeight: '1.6',
                      color: '#374151'
                    }}>
                      {pageContent.split('\n').map((line, lineIndex) => {
                        // Handle natural language prose content
                        if (line.trim().match(/^\d+\.\s/)) {
                          // Section headers (e.g., "1. Executive Summary")
                          return (
                            <h2 key={lineIndex} className="text-2xl font-semibold text-gray-800 mb-6 mt-8 border-b border-gray-200 pb-2">
                              {line.trim()}
                            </h2>
                          );
                        }
                        if (line.trim().startsWith('Care Agency Quarterly Report')) {
                          // Main title
                          return (
                            <h1 key={lineIndex} className="text-3xl font-bold text-gray-900 mb-8 text-center border-b-2 border-gray-200 pb-4">
                              {line.trim()}
                            </h1>
                          );
                        }
                        if (line.trim().length > 50 && (line.trim().endsWith('.') || line.trim().endsWith(':') || line.trim().endsWith('.'))) {
                          // Regular paragraphs - substantial text ending with period
                          return (
                            <p key={lineIndex} className="mb-5 text-gray-700 leading-relaxed text-justify font-normal">
                              {line.trim()}
                            </p>
                          );
                        }
                        if (line.trim().length > 20 && line.trim().length <= 50) {
                          // Shorter content lines - subheadings or brief statements
                          return (
                            <p key={lineIndex} className="mb-4 text-gray-800 leading-relaxed font-medium">
                              {line.trim()}
                            </p>
                          );
                        }
                        if (line.trim().length > 0) {
                          // Other content - brief lines
                          return (
                            <p key={lineIndex} className="mb-3 text-gray-700 leading-relaxed">
                              {line.trim()}
                            </p>
                          );
                        }
                        if (line.trim() === '') {
                          // Empty lines for spacing
                          return <div key={lineIndex} className="mb-2"></div>;
                        }
                         return null;
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { margin: 0 !important; }
          .page-break { page-break-after: always; }
          .page-break:last-child { page-break-after: avoid; }
          .space-y-8 > * + * { margin-top: 0 !important; }
        }
      `}</style>
    </div>
  );
};