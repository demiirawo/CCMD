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

  const processAnalyticsForReport = (analyticsData: any) => {
    // Extract key insights and trends from analytics data
    const insights = {
      staffingTrends: {
        activeStaff: analyticsData.staff_training?.map((d: any) => d.active_staff_with_training).filter((v: any) => v != null) || [],
        onboardingStaff: analyticsData.staff_training?.map((d: any) => d.onboarding_staff_with_training).filter((v: any) => v != null) || [],
        trainingCompliance: analyticsData.staff_training?.map((d: any) => d.probationary_staff_with_training).filter((v: any) => v != null) || []
      },
      incidentPatterns: {
        totalIncidents: analyticsData.incidents?.reduce((sum: number, d: any) => sum + (d.total_incidents || 0), 0) || 0,
        resolvedIncidents: analyticsData.incidents?.reduce((sum: number, d: any) => sum + (d.resolved_incidents || 0), 0) || 0,
        safeguardingConcerns: analyticsData.incidents?.reduce((sum: number, d: any) => sum + (d.safeguarding_concerns || 0), 0) || 0
      },
      carePlanMetrics: {
        totalPlans: analyticsData.care_plan?.reduce((sum: number, d: any) => sum + (d.total_care_plans || 0), 0) || 0,
        overduePlans: analyticsData.care_plan?.reduce((sum: number, d: any) => sum + (d.overdue_care_plans || 0), 0) || 0,
        highRiskPlans: analyticsData.care_plan?.reduce((sum: number, d: any) => sum + (d.high_risk_care_plans || 0), 0) || 0
      },
      feedbackTrends: {
        totalComplaints: analyticsData.feedback?.reduce((sum: number, d: any) => sum + (d.total_complaints || 0), 0) || 0,
        resolvedComplaints: analyticsData.feedback?.reduce((sum: number, d: any) => sum + (d.resolved_complaints || 0), 0) || 0,
        suggestions: analyticsData.feedback?.reduce((sum: number, d: any) => sum + (d.total_suggestions || 0), 0) || 0
      }
    };
    return insights;
  };

  const extractKeyMetrics = (analyticsData: any, meetings: any[]) => {
    // Calculate key performance indicators
    const totalMeetingItems = meetings.reduce((sum, meeting) => 
      sum + meeting.sections.reduce((sectionSum: number, section: any) => 
        sectionSum + (section.items?.length || 0), 0), 0);
    
    const completedItems = meetings.reduce((sum, meeting) => 
      sum + meeting.sections.reduce((sectionSum: number, section: any) => 
        sectionSum + (section.items?.filter((item: any) => item.status === 'green').length || 0), 0), 0);

    return {
      meetingEffectiveness: totalMeetingItems > 0 ? Math.round((completedItems / totalMeetingItems) * 100) : 0,
      totalActionItems: totalMeetingItems,
      completedActionItems: completedItems,
      quarterlyMeetingCount: meetings.length,
      averageAttendeesPerMeeting: meetings.length > 0 ? Math.round(meetings.reduce((sum, m) => sum + m.attendees.length, 0) / meetings.length) : 0
    };
  };

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
      
      // Pre-process analytics data to extract key insights and trends
      const processedAnalytics = processAnalyticsForReport(analyticsData);
      
      // Create comprehensive data summary for AI with better structuring
      const dataContext = {
        quarter,
        year,
        totalMeetings: meetings.length,
        meetingDetails: meetings.map(m => ({
          title: m.title,
          date: m.date,
          purpose: m.purpose || 'Regular management meeting',
          attendeeCount: m.attendees.length,
          attendees: m.attendees,
          sectionSummary: m.sections.map(s => ({
            title: s.title,
            totalItems: s.items?.length || 0,
            completedItems: s.items?.filter((item: any) => item.status === 'green').length || 0,
            inProgressItems: s.items?.filter((item: any) => item.status === 'amber').length || 0,
            overdueItems: s.items?.filter((item: any) => item.status === 'red').length || 0,
            achievements: s.items?.filter((item: any) => item.status === 'green').map((item: any) => item.content || item.title) || [],
            challenges: s.items?.filter((item: any) => item.status === 'red' || item.status === 'amber').map((item: any) => item.content || item.title) || []
          }))
        })),
        analyticsInsights: processedAnalytics,
        keyMetrics: extractKeyMetrics(analyticsData, meetings)
      };

      const systemPrompt = `You are an expert care agency analyst writing a professional quarterly report. Your task is to generate a comprehensive, detailed quarterly report that reads like a professional business document - NOT a markdown document.

CRITICAL FORMATTING REQUIREMENTS:
- Write in flowing, natural language prose with complete sentences and paragraphs
- Each section must contain a minimum of 3-4 substantial paragraphs (100-150 words each)
- Use professional business language suitable for board presentations and regulatory reviews
- DO NOT use markdown formatting (no #, ##, *, -, etc.)
- DO NOT use bullet points or lists - write in paragraph format only
- Include specific numbers, percentages, and metrics throughout your analysis
- Provide detailed interpretations and insights, not just data summaries

CONTENT REQUIREMENTS:
- Each section should demonstrate deep analysis of trends, patterns, and implications
- Include comparative analysis (month-to-month, quarter-to-quarter where possible)
- Provide specific examples and case studies from the meeting data
- Draw connections between different data points and metrics
- Offer strategic insights and forward-looking observations

REPORT STRUCTURE (only include sections with relevant data):

Care Agency Quarterly Report - ${quarter} ${year}

1. Executive Summary
Write a comprehensive 200-300 word executive summary that captures the quarter's key achievements, challenges, and strategic outlook.

2. Operational Successes
Analyze positive outcomes, achievements, and improvements. Include detailed discussion of performance metrics, successful initiatives, compliance achievements, and operational excellence examples.

3. Learning Opportunities and Challenges
Examine areas for improvement, incidents, challenges faced, and lessons learned. Provide detailed analysis of root causes and impacts on operations.

4. Workforce and Capacity Analysis
Detailed analysis of staffing levels, recruitment, retention, training compliance, supervision quality, and capacity planning initiatives.

5. Care Quality and Service Delivery
Comprehensive review of care planning effectiveness, service quality metrics, care plan compliance, risk management, and client outcomes.

6. Health, Safety and Risk Management
Thorough analysis of incident patterns, safety performance, risk mitigation strategies, safeguarding effectiveness, and regulatory compliance.

7. Continuous Improvement and Innovation
Detailed discussion of improvement initiatives, quality enhancement programs, feedback integration, and innovation projects.

8. Strategic Outlook and Recommendations
Forward-looking analysis with strategic recommendations, priority areas for focus, and planned initiatives for the coming quarter.

WRITING STYLE:
- Professional, analytical tone appropriate for senior management and regulatory bodies
- Use industry-standard terminology and professional care sector language
- Ensure each paragraph flows logically to the next
- Include quantitative analysis with qualitative interpretation
- Demonstrate understanding of care sector challenges and best practices`;

      const userPrompt = `Generate a detailed quarterly report for ${quarter} ${year}. Analyze the following comprehensive dataset and create substantial, insightful content for each relevant section. Focus on trends, patterns, and strategic implications rather than just listing data points.

Meeting Analysis: ${meetings.length} management meetings were held during this quarter, covering ${dataContext.meetingDetails.map(m => m.sectionSummary.length).reduce((a, b) => a + b, 0)} different operational areas.

Data Context: ${JSON.stringify(dataContext, null, 2)}

Remember: Write in natural language prose with detailed paragraphs. No markdown formatting. Each section should provide deep analysis and strategic insights.`;

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