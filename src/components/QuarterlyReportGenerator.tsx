import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Loader2 } from "lucide-react";
import { useOpenAI } from "@/hooks/useOpenAI";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

interface QuarterlyReportGeneratorProps {
  quarter: string;
  year: string;
  meetings: Array<{
    id: string;
    title: string;
    date: string;
    attendees: any[];
    sections: any[];
    purpose?: string;
  }>;
}

export const QuarterlyReportGenerator: React.FC<QuarterlyReportGeneratorProps> = ({
  quarter,
  year,
  meetings
}) => {
  const [generatedReport, setGeneratedReport] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const { generateResponse, isLoading } = useOpenAI();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const collectAnalyticsData = async () => {
    if (!profile?.company_id) return {};

    try {
      // Get all analytics data from dashboard_data table
      const { data: analyticsData, error } = await supabase
        .from('dashboard_data')
        .select('data_type, data_content')
        .eq('company_id', profile.company_id);

      if (error) {
        console.error('Error loading analytics data:', error);
        return {};
      }

      // Get specific analytics tables
      const promises = [
        supabase.from('spot_check_analytics').select('*').eq('company_id', profile.company_id),
        supabase.from('supervision_analytics').select('*').eq('company_id', profile.company_id),
        supabase.from('incidents_analytics').select('*').eq('company_id', profile.company_id),
        supabase.from('feedback_analytics').select('*').eq('company_id', profile.company_id),
        supabase.from('care_plan_analytics').select('*').eq('company_id', profile.company_id),
        supabase.from('staff_training_analytics').select('*').eq('company_id', profile.company_id),
        supabase.from('staff_documents_analytics').select('*').eq('company_id', profile.company_id),
        supabase.from('actions_log').select('*').eq('company_id', profile.company_id)
      ];

      const results = await Promise.all(promises);
      
      const analytics = {
        dashboard_data: analyticsData || [],
        spot_check: results[0].data || [],
        supervision: results[1].data || [],
        incidents: results[2].data || [],
        feedback: results[3].data || [],
        care_plan: results[4].data || [],
        staff_training: results[5].data || [],
        staff_documents: results[6].data || [],
        actions_log: results[7].data || []
      };

      return analytics;
    } catch (error) {
      console.error('Error collecting analytics data:', error);
      return {};
    }
  };

  const generateReport = async () => {
    try {
      const analyticsData = await collectAnalyticsData();
      
      // Create comprehensive data summary for AI
      const dataContext = {
        quarter,
        year,
        meetings: meetings.map(m => ({
          title: m.title,
          date: m.date,
          purpose: m.purpose,
          attendeeCount: m.attendees.length,
          sections: m.sections.map(s => ({
            title: s.title,
            itemCount: s.items?.length || 0,
            statusBreakdown: s.items?.reduce((acc: any, item: any) => {
              acc[item.status] = (acc[item.status] || 0) + 1;
              return acc;
            }, {}) || {}
          }))
        })),
        analytics: analyticsData
      };

      const systemPrompt = `You are a care agency report generator. Generate a comprehensive quarterly report based on the provided management meeting data and analytics.

IMPORTANT: Only include sections where you have relevant data. If no relevant information is found for a section, omit it entirely.

Structure your report exactly as follows:

# Care Agency Quarterly Report - ${quarter} ${year}

## 1. Successes
[Only include if you find positive achievements, improvements, or good outcomes]

## 2. Lessons Learned  
[Only include if you find challenges, incidents, or areas for improvement mentioned]

## 3. Capacity Planning
[Only include if you have staffing/capacity data]

## 4. Staffing
[Only include if you have staff-related data like training, supervision, etc.]

## 5. Care Planning & Delivery
[Only include if you have care plan or service delivery information]

## 6. Safety
[Only include if you have incident, safeguarding, or safety-related data]

## 7. Digital & Data Security
[Only include if you have information governance or digital security information]

## 8. Continuous Improvement
[Only include if you have improvement initiatives or quality measures]

Use professional, clear language. Be specific with numbers and metrics where available. Focus on insights and trends rather than just listing data.`;

      const userPrompt = `Generate a quarterly report for ${quarter} ${year} based on this data: ${JSON.stringify(dataContext, null, 2)}`;

      const response = await generateResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], 'gpt-4.1-2025-04-14');

      if (response) {
        setGeneratedReport(response);
        setIsOpen(false);
        
        // Navigate to the quarterly report page with the content
        const encodedContent = encodeURIComponent(response);
        navigate(`/quarterly-report?quarter=${quarter}&year=${year}&content=${encodedContent}`);
        
        toast({
          title: "Report Generated",
          description: "Your quarterly report has been generated successfully",
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate the quarterly report",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Generate AI Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Quarterly Report - {quarter} {year}</DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI-Powered Quarterly Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will analyze all management meetings and analytics data from {quarter} {year} 
              to generate a comprehensive quarterly report covering successes, lessons learned, 
              capacity planning, staffing, care delivery, safety, and continuous improvement.
            </p>
            <p className="text-sm text-muted-foreground">
              The report will be displayed in a professional print-ready format with options to export to PDF.
            </p>
            <Button 
              onClick={generateReport} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
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
      </DialogContent>
    </Dialog>
  );
};