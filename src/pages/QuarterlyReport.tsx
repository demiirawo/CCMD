import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, FileText, Printer } from "lucide-react";
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
  const [isExporting, setIsExporting] = useState(false);
  
  const quarter = searchParams.get("quarter") || "";
  const year = searchParams.get("year") || "";
  const content = searchParams.get("content") || "";

  useEffect(() => {
    if (content) {
      setReportContent(decodeURIComponent(content));
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
      const reportElement = document.getElementById('quarterly-report-content');
      if (!reportElement) {
        throw new Error('Report content not found');
      }

      // Create PDF
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
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

  if (!reportContent) {
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

      {/* Report Content */}
      <div className="py-8 print:py-0">
        <div id="quarterly-report-content" className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none">
          
          {/* Cover Page */}
          <div className="page-break p-12 min-h-screen flex flex-col justify-between">
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

          {/* Report Content Pages */}
          <div className="page-break p-12">
            <div className="prose prose-lg max-w-none">
              <div 
                className="report-content"
                style={{ 
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  lineHeight: '1.6',
                  color: '#374151'
                }}
              >
                {reportContent.split('\n').map((line, index) => {
                  // Handle headers
                  if (line.startsWith('# ')) {
                    return (
                      <h1 key={index} className="text-3xl font-bold text-gray-900 mb-6 mt-8 border-b-2 border-gray-200 pb-2">
                        {line.substring(2)}
                      </h1>
                    );
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={index} className="text-2xl font-semibold text-gray-800 mb-4 mt-8">
                        {line.substring(3)}
                      </h2>
                    );
                  }
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={index} className="text-xl font-medium text-gray-700 mb-3 mt-6">
                        {line.substring(4)}
                      </h3>
                    );
                  }
                  
                  // Handle bullet points
                  if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
                    return (
                      <li key={index} className="ml-6 mb-2 text-gray-700">
                        {line.trim().substring(2)}
                      </li>
                    );
                  }
                  
                  // Handle regular paragraphs
                  if (line.trim()) {
                    return (
                      <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                        {line}
                      </p>
                    );
                  }
                  
                  // Handle empty lines
                  return <br key={index} />;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { margin: 0 !important; }
          .page-break { page-break-after: always; }
          .page-break:last-child { page-break-after: avoid; }
        }
      `}</style>
    </div>
  );
};