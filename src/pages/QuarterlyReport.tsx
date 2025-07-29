import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, FileText, Printer, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } from 'docx';

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

  const exportToWord = async () => {
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
      // Fetch logo if available and get its dimensions
      let logoImage = null;
      let logoWidth = 150;
      let logoHeight = 75;
      
      if (companyInfo?.logo_url) {
        try {
          const response = await fetch(companyInfo.logo_url);
          const arrayBuffer = await response.arrayBuffer();
          logoImage = arrayBuffer;
          
          // Create a temporary image to get natural dimensions
          const blob = new Blob([arrayBuffer]);
          const imageUrl = URL.createObjectURL(blob);
          const img = new Image();
          
          await new Promise((resolve, reject) => {
            img.onload = () => {
              // Calculate dimensions while maintaining aspect ratio
              const maxWidth = 200;
              const maxHeight = 100;
              const aspectRatio = img.naturalWidth / img.naturalHeight;
              
              if (aspectRatio > maxWidth / maxHeight) {
                // Logo is wider - constrain by width
                logoWidth = maxWidth;
                logoHeight = maxWidth / aspectRatio;
              } else {
                // Logo is taller - constrain by height
                logoHeight = maxHeight;
                logoWidth = maxHeight * aspectRatio;
              }
              
              URL.revokeObjectURL(imageUrl);
              resolve(null);
            };
            img.onerror = reject;
            img.src = imageUrl;
          });
        } catch (error) {
          console.warn('Could not fetch logo for Word export:', error);
        }
      }

      // Create document children array
      const documentChildren: Paragraph[] = [];

      // Add logo if available
      if (logoImage) {
        documentChildren.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: logoImage,
                type: 'png',
                transformation: {
                  width: Math.round(logoWidth),
                  height: Math.round(logoHeight),
                },
              }),
            ],
            alignment: 'center',
            spacing: { after: 400 }
          })
        );
      }

      // Add cover page content
      documentChildren.push(
        new Paragraph({
          text: companyInfo?.name || 'Care Agency',
          heading: HeadingLevel.TITLE,
          alignment: 'center',
          spacing: { after: 400 }
        }),
        new Paragraph({
          text: 'Quarterly Report',
          heading: HeadingLevel.HEADING_1,
          alignment: 'center',
          spacing: { after: 200 }
        }),
        new Paragraph({
          text: `${quarter} ${year}`,
          heading: HeadingLevel.HEADING_2,
          alignment: 'center',
          spacing: { after: 200 }
        }),
        new Paragraph({
          text: getQuarterDates(quarter, year),
          alignment: 'center',
          spacing: { after: 400 }
        }),
        new Paragraph({
          text: `Report Created: ${getCurrentDate()}`,
          alignment: 'center',
          spacing: { after: 800 }
        })
      );

      // Add content
      documentChildren.push(...parseContentForWord(reportContent));

      // Parse the report content and create Word document structure
      const doc = new Document({
        sections: [{
          properties: {},
          children: documentChildren
        }]
      });

      // Generate and download the document
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `quarterly-report-${quarter}-${year}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Report has been exported to Word document",
      });
    } catch (error) {
      console.error('Error exporting Word document:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export report to Word document",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const parseContentForWord = (content: string): Paragraph[] => {
    const paragraphs: Paragraph[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        // Add spacing for empty lines
        paragraphs.push(new Paragraph({ text: '', spacing: { after: 200 } }));
      } else if (trimmedLine.match(/^\d+\.\s/)) {
        // Section headers (e.g., "1. Executive Summary")
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: trimmedLine, bold: true, size: 28 })],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }));
      } else if (trimmedLine.startsWith('Care Agency Quarterly Report')) {
        // Main title
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: trimmedLine, bold: true, size: 32 })],
          heading: HeadingLevel.TITLE,
          alignment: 'center',
          spacing: { after: 400 }
        }));
      } else if (trimmedLine.length > 0) {
        // Regular paragraphs
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: trimmedLine, size: 22 })],
          spacing: { after: 120 },
          alignment: 'both'
        }));
      }
    }

    return paragraphs;
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
              onClick={exportToWord} 
              disabled={isExporting}
              variant="outline"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export Word'}
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
                      Report Created: {getCurrentDate()}
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
                            <h2 key={lineIndex} className="text-2xl font-bold text-gray-800 mb-6 mt-8 border-b border-gray-200 pb-2">
                              {line.trim()}
                            </h2>
                          );
                        }
                        if (line.trim().startsWith('Care Agency Quarterly Report') || line.trim().includes('Quarterly Report')) {
                          // Main title - replace with actual company name
                          const titleText = line.trim().replace('Care Agency', companyInfo?.name || 'Care Agency');
                          return (
                            <h1 key={lineIndex} className="text-3xl font-bold text-gray-900 mb-8 text-center border-b-2 border-gray-200 pb-4">
                              {titleText}
                            </h1>
                          );
                        }
                        // Check for standalone section titles (without numbers)
                        if (line.trim().length > 0 && line.trim().length < 100 && 
                            (line.trim() === 'Executive Summary' || 
                             line.trim() === 'Operational Successes' ||
                             line.trim() === 'Learning Opportunities and Challenges' ||
                             line.trim() === 'Workforce and Capacity Analysis' ||
                             line.trim() === 'Care Quality and Service Delivery' ||
                             line.trim() === 'Health, Safety and Risk Management' ||
                             line.trim() === 'Continuous Improvement and Innovation' ||
                             line.trim() === 'Strategic Outlook and Recommendations' ||
                             line.trim().includes('Summary') ||
                             line.trim().includes('Analysis') ||
                             line.trim().includes('Outlook'))) {
                          return (
                            <h2 key={lineIndex} className="text-2xl font-bold text-gray-800 mb-6 mt-8 border-b border-gray-200 pb-2">
                              {line.trim()}
                            </h2>
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