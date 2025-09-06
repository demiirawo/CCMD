import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Eye, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOpenAI } from "@/hooks/useOpenAI";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SimpleQuarterlyReportGeneratorProps {
  quarter: string;
  year: string;
  meetings: any[];
}

export const SimpleQuarterlyReportGenerator: React.FC<SimpleQuarterlyReportGeneratorProps> = ({
  quarter,
  year,
  meetings
}) => {
  const [hasGeneratedReport, setHasGeneratedReport] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { generateResponse, isLoading } = useOpenAI();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const generateSimpleReport = async () => {
    if (!profile?.company_id) {
      toast({
        title: "Authentication Error",
        description: "Please ensure you're logged in and have a company selected.",
        variant: "destructive"
      });
      return;
    }
    
    if (meetings.length === 0) {
      toast({
        title: "No Data Available",
        description: "No meetings found for this quarter to generate a report from.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);

    try {
      // Create a very simple summary of meetings
      const meetingSummary = meetings.slice(0, 3).map(meeting => {
        const statusCounts = { green: 0, amber: 0, red: 0 };
        meeting.sections.forEach(section => {
          section.items.forEach(item => {
            statusCounts[item.status]++;
          });
        });
        return `${meeting.date}: ${statusCounts.green}G/${statusCounts.amber}A/${statusCounts.red}R`;
      }).join('\n');

      const prompt = `Create a quarterly report for ${quarter} ${year}.

Meeting Summary:
${meetingSummary}

Create a professional quarterly report with these sections:
# Executive Summary
# Staff Management
# Care Quality
# Safety & Compliance
# Continuous Improvement
# Next Steps

Write in professional narrative format for care service compliance.`;

      const reportContent = await generateResponse([
        { role: 'system', content: 'You are a care service compliance report writer.' },
        { role: 'user', content: prompt }
      ], 'gpt-5-mini-2025-08-07');

      if (reportContent) {
        // Save to Supabase
        const { error: supabaseError } = await supabase.from('quarterly_reports').upsert({
          company_id: profile.company_id,
          quarter,
          year: parseInt(year),
          report_content: reportContent,
          analytics_data: { generatedAt: new Date().toISOString() }
        });

        if (supabaseError) {
          console.error('Supabase error:', supabaseError);
          // Fallback to local storage
          localStorage.setItem(`quarterly-report-${quarter}-${year}-${profile.company_id}`, JSON.stringify({
            content: reportContent,
            generatedAt: new Date().toISOString()
          }));
        }

        setHasGeneratedReport(true);
        toast({
          title: "Report Generated",
          description: "Your quarterly report has been generated successfully."
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate the quarterly report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const viewReport = () => {
    navigate(`/quarterly-report?quarter=${quarter}&year=${year}`);
  };

  const deleteReport = async () => {
    try {
      const { error } = await supabase.from('quarterly_reports')
        .delete()
        .eq('company_id', profile?.company_id)
        .eq('quarter', quarter)
        .eq('year', parseInt(year));

      if (error) throw error;

      localStorage.removeItem(`quarterly-report-${quarter}-${year}-${profile?.company_id}`);
      setHasGeneratedReport(false);
      toast({
        title: "Report Deleted",
        description: "The quarterly report has been deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the report.",
        variant: "destructive"
      });
    }
  };

  if (hasGeneratedReport) {
    return (
      <Card className="bg-transparent border-0 shadow-none">
        <CardContent className="">
          <div className="flex justify-evenly items-start gap-2 w-full">
            <Button onClick={viewReport} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View Report
            </Button>
            <Button variant="outline" onClick={deleteReport} className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
              Delete Report
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <CardContent className="p-0">
        <Button onClick={generateSimpleReport} disabled={isGenerating || isLoading} className="w-full">
          {isGenerating || isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};