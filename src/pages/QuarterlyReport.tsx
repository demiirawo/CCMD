import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";

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
  
  const quarter = searchParams.get("quarter") || "";
  const year = searchParams.get("year") || "";
  const content = searchParams.get("content") || "";

  useEffect(() => {
    if (content) {
      try {
        const decodedContent = decodeURIComponent(content);
        setReportContent(decodedContent);
      } catch (error) {
        console.error('Failed to decode content:', error);
        setReportContent(content);
      }
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

  const exportToWord = () => {
    // Create a simple text file for now - could be enhanced later
    const element = document.createElement('a');
    const file = new Blob([reportContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `quarterly-report-${quarter}-${year}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Export Successful",
      description: "Report has been exported as text file",
    });
  };

  const printReport = () => {
    window.print();
  };

  const formatReportContent = (content: string) => {
    if (!content) return [];
    
    // Split content into sections based on numbered headers
    const sections = content.split(/(?=\d+\.\s[A-Z])/);
    
    return sections.map((section, index) => {
      if (!section.trim()) return null;
      
      const lines = section.trim().split('\n');
      const isHeader = lines[0]?.match(/^\d+\.\s/);
      
      return (
        <div key={index} className="mb-6">
          {isHeader ? (
            <h2 className="text-xl font-bold mb-4 text-primary">
              {lines[0]}
            </h2>
          ) : null}
          <div className="space-y-3">
            {lines.slice(isHeader ? 1 : 0).map((line, lineIndex) => {
              if (!line.trim()) return null;
              return (
                <p key={lineIndex} className="text-foreground leading-relaxed">
                  {line.trim()}
                </p>
              );
            })}
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  if (!reportContent) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">No Report Found</h1>
            <Button onClick={() => navigate('/reports')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Action Bar */}
        <div className="mb-6 flex justify-between items-center print:hidden">
          <Button variant="ghost" onClick={() => navigate('/reports')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={printReport}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={exportToWord}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Report Content */}
        <Card className="shadow-lg">
          <div className="p-8">
            {/* Cover Page */}
            <div className="text-center mb-12 print:mb-8">
              {companyInfo?.logo_url && (
                <img 
                  src={companyInfo.logo_url} 
                  alt="Company Logo"
                  className="mx-auto mb-6 max-w-48 max-h-24 object-contain"
                />
              )}
              
              <h1 className="text-4xl font-bold mb-4 text-primary">
                {companyInfo?.name || 'Care Agency'}
              </h1>
              
              <h2 className="text-2xl font-semibold mb-4 text-muted-foreground">
                Quarterly Report
              </h2>
              
              <h3 className="text-xl mb-4 text-foreground">
                {quarter} {year}
              </h3>
              
              <p className="text-muted-foreground mb-6">
                {getQuarterDates(quarter, year)}
              </p>
              
              <p className="text-sm text-muted-foreground">
                Report Created: {getCurrentDate()}
              </p>
            </div>

            {/* Report Body */}
            <div className="space-y-8 text-justify">
              {formatReportContent(reportContent)}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};