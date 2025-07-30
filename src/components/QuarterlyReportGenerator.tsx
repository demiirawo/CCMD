import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Loader2, Trash2 } from "lucide-react";
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
  const [hasGeneratedReport, setHasGeneratedReport] = useState<boolean>(false);
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

  const getAnalyticsDataForReport = async () => {
    if (!profile?.company_id) return {};
    
    try {
      console.log('🔍 Starting analytics data collection for company:', profile.company_id);
      
      // Get the latest meeting to determine which analytics to include
      const latestMeeting = meetings.length > 0 ? meetings[0] : null;
      const meetingId = latestMeeting?.id;
      
      console.log('📊 Latest meeting ID:', meetingId);
      console.log('📋 Available meetings:', meetings.length);
      
      const analyticsData: { [key: string]: any } = {};
      
      // First, try to get any analytics data regardless of meeting_id
      const { data: allAnalytics, error: allError } = await supabase
        .from('dashboard_data')
        .select('data_type, data_content, meeting_id')
        .eq('company_id', profile.company_id);
      
      console.log('📈 All analytics data found:', allAnalytics?.length || 0);
      console.log('📈 Analytics data:', allAnalytics);
      
      if (allError) {
        console.error('❌ Error fetching analytics:', allError);
      }
      
      // Define analytics types to check based on meeting sections
      const analyticsTypes = [
        { key: 'staffTraining', title: 'Staff Training Analytics', dataTypes: ['resourcing_analytics', 'staff_training_analytics', 'resourcing_overview'] },
        { key: 'incidents', title: 'Incident Analytics', dataTypes: ['incidents_analytics'] },
        { key: 'feedback', title: 'Feedback Analytics', dataTypes: ['feedback_analytics'] },
        { key: 'spotCheck', title: 'Spot Check Analytics', dataTypes: ['spot_check_analytics'] },
        { key: 'supervision', title: 'Supervision Analytics', dataTypes: ['supervision_analytics'] },
        { key: 'staffDocuments', title: 'Staff Documents Analytics', dataTypes: ['staff_documents_analytics'] },
        { key: 'carePlan', title: 'Care Plan Analytics', dataTypes: ['care_plan_overview', 'care_plan_analytics'] }
      ];

      // Get analytics data for each type
      for (const { key, title, dataTypes } of analyticsTypes) {
        for (const dataType of dataTypes) {
          try {
            const matchingData = allAnalytics?.find(item => item.data_type === dataType);
            
            if (matchingData?.data_content && Object.keys(matchingData.data_content).length > 0) {
              console.log(`✅ Found ${title} data:`, matchingData.data_content);
              analyticsData[key] = {
                title,
                data: matchingData.data_content,
                hasData: true,
                meetingId: matchingData.meeting_id
              };
              break; // Use the first matching data type
            }
          } catch (error) {
            console.warn(`⚠️ Failed to process ${title}:`, error);
          }
        }
      }

      console.log('📊 Final analytics data for report:', analyticsData);
      return analyticsData;
    } catch (error) {
      console.error('❌ Error collecting analytics data for report:', error);
      return {};
    }
  };

  const generateReport = async () => {
    console.log('🚀 Generate Report button clicked!');
    console.log('📍 Navigating to:', `/report-builder?quarter=${quarter}&year=${year}`);
    console.log('📊 Quarter:', quarter, 'Year:', year);
    
    try {
      // Navigate to the report builder page instead of generating directly
      navigate(`/report-builder?quarter=${quarter}&year=${year}`);
      console.log('✅ Navigation call completed');
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  };

  const generateReportDirect = async () => {
    try {
      const analyticsData = await collectAnalyticsData();
      
      // Get analytics data for report context
      const reportAnalytics = await getAnalyticsDataForReport();
      
      // Get company information for proper naming
      let companyName = 'Care Agency';
      if (profile?.company_id) {
        try {
          const { data: companyData } = await supabase
            .from('companies')
            .select('name')
            .eq('id', profile.company_id)
            .single();
          if (companyData?.name) {
            companyName = companyData.name;
          }
        } catch (error) {
          console.warn('Could not fetch company name:', error);
        }
      }
      
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
        keyMetrics: extractKeyMetrics(analyticsData, meetings),
        availableAnalytics: Object.keys(reportAnalytics)
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
- Use the actual company name "${companyName}" throughout the report instead of generic terms like "the agency"

ANALYTICS DATA INTEGRATION:
You have access to analytics data for the following areas where available: ${Object.keys(reportAnalytics).join(', ')}
- Include contextual references to analytics data in relevant sections
- Use the format: [ANALYTICS DATA: {type}] where {type} is one of the available analytics (e.g., [ANALYTICS DATA: staffTraining])
- Only include analytics references where they add meaningful context to the narrative
- Provide data-driven insights based on the available analytics

CONTENT REQUIREMENTS:
- Each section should demonstrate deep analysis of trends, patterns, and implications
- Include comparative analysis (month-to-month, quarter-to-quarter where possible)
- Provide specific examples and case studies from the meeting data
- Draw connections between different data points and metrics
- Offer strategic insights and forward-looking observations

REPORT STRUCTURE (only include sections with relevant data):

${companyName} Quarterly Report - ${quarter} ${year}

1. Executive Summary
Write a comprehensive 200-300 word executive summary that captures the quarter's key achievements, challenges, and strategic outlook for ${companyName}.

2. Operational Successes
Analyze positive outcomes, achievements, and improvements for ${companyName}. Include detailed discussion of performance metrics, successful initiatives, compliance achievements, and operational excellence examples. Include relevant analytics data to support your analysis.

3. Learning Opportunities and Challenges
Examine areas for improvement, incidents, challenges faced, and lessons learned by ${companyName}. Provide detailed analysis of root causes and impacts on operations. Use analytics data to illustrate trends where appropriate.

4. Workforce and Capacity Analysis
Detailed analysis of ${companyName}'s staffing levels, recruitment, retention, training compliance, supervision quality, and capacity planning initiatives. Include staff training analytics if available.

5. Care Quality and Service Delivery
Comprehensive review of ${companyName}'s care planning effectiveness, service quality metrics, care plan compliance, risk management, and client outcomes.

6. Health, Safety and Risk Management
Thorough analysis of ${companyName}'s incident patterns, safety performance, risk mitigation strategies, safeguarding effectiveness, and regulatory compliance. Include incident analytics to support findings.

7. Continuous Improvement and Innovation
Detailed discussion of ${companyName}'s improvement initiatives, quality enhancement programs, feedback integration, and innovation projects. Include feedback analytics if available.

8. Strategic Outlook and Recommendations
Forward-looking analysis with strategic recommendations for ${companyName}, priority areas for focus, and planned initiatives for the coming quarter.

WRITING STYLE:
- Professional, analytical tone appropriate for senior management and regulatory bodies
- Use industry-standard terminology and professional care sector language
- Ensure each paragraph flows logically to the next
- Include quantitative analysis with qualitative interpretation
- Demonstrate understanding of care sector challenges and best practices
- Always refer to ${companyName} by name rather than using generic terms`;

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
        setAnalyticsScreenshots(reportAnalytics);
        setHasGeneratedReport(true);
        setIsOpen(false);
        
        // Navigate to the quarterly report page with the content and analytics data
        const encodedContent = encodeURIComponent(response);
        const encodedAnalytics = encodeURIComponent(JSON.stringify(reportAnalytics));
        navigate(`/quarterly-report?quarter=${quarter}&year=${year}&content=${encodedContent}&analytics=${encodedAnalytics}`);
        
        toast({
          title: "Report Created",
          description: "Your quarterly report has been created successfully",
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

  const [analyticsScreenshots, setAnalyticsScreenshots] = useState<{ [key: string]: any }>({});

  const viewReport = () => {
    if (generatedReport) {
      const encodedContent = encodeURIComponent(generatedReport);
      const encodedAnalytics = encodeURIComponent(JSON.stringify(analyticsScreenshots));
      navigate(`/quarterly-report?quarter=${quarter}&year=${year}&content=${encodedContent}&analytics=${encodedAnalytics}`);
    }
  };

  const deleteReport = () => {
    setGeneratedReport("");
    setHasGeneratedReport(false);
    toast({
      title: "Report Deleted",
      description: "The quarterly report has been deleted",
    });
  };

  // If report has been generated, show view and delete buttons
  if (hasGeneratedReport && generatedReport) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" className="gap-2" onClick={viewReport}>
          <FileText className="h-4 w-4" />
          View Report
        </Button>
        <Button variant="outline" size="icon" onClick={deleteReport}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" className="gap-2" onClick={generateReport}>
      <FileText className="h-4 w-4" />
      Generate AI Report
    </Button>
  );
};