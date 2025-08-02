import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Loader2, Trash2 } from "lucide-react";
import { useOpenAI } from "@/hooks/useOpenAI";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
  const {
    generateResponse,
    isLoading
  } = useOpenAI();
  const {
    profile
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  // Check if a report exists for this quarter/year on component mount
  useEffect(() => {
    checkExistingReport();
  }, [quarter, year, profile?.company_id]);
  const checkExistingReport = async () => {
    if (!profile?.company_id) return;
    try {
      const {
        data,
        error
      } = await supabase.from('quarterly_reports').select('report_content, analytics_data').eq('company_id', profile.company_id).eq('quarter', quarter).eq('year', parseInt(year)).maybeSingle();
      if (error) {
        console.error('Error checking existing report:', error);
        setHasGeneratedReport(false);
        return;
      }
      if (data) {
        setGeneratedReport(data.report_content);
        setHasGeneratedReport(true);
        if (data.analytics_data && typeof data.analytics_data === 'object') {
          setAnalyticsScreenshots(data.analytics_data as {
            [key: string]: any;
          });
        }
      } else {
        setHasGeneratedReport(false);
        setGeneratedReport('');
      }
    } catch (error) {
      console.error('Error checking existing report:', error);
      setHasGeneratedReport(false);
    }
  };
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
    const totalMeetingItems = meetings.reduce((sum, meeting) => sum + meeting.sections.reduce((sectionSum: number, section: any) => sectionSum + (section.items?.length || 0), 0), 0);
    const completedItems = meetings.reduce((sum, meeting) => sum + meeting.sections.reduce((sectionSum: number, section: any) => sectionSum + (section.items?.filter((item: any) => item.status === 'green').length || 0), 0), 0);
    return {
      meetingEffectiveness: totalMeetingItems > 0 ? Math.round(completedItems / totalMeetingItems * 100) : 0,
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
      const {
        data: analyticsData,
        error
      } = await supabase.from('dashboard_data').select('data_type, data_content').eq('company_id', profile.company_id);
      if (error) {
        console.error('Error loading analytics data:', error);
        return {};
      }

      // Get specific analytics tables
      const promises = [supabase.from('spot_check_analytics').select('*').eq('company_id', profile.company_id), supabase.from('supervision_analytics').select('*').eq('company_id', profile.company_id), supabase.from('incidents_analytics').select('*').eq('company_id', profile.company_id), supabase.from('feedback_analytics').select('*').eq('company_id', profile.company_id), supabase.from('care_plan_analytics').select('*').eq('company_id', profile.company_id), supabase.from('staff_training_analytics').select('*').eq('company_id', profile.company_id), supabase.from('staff_documents_analytics').select('*').eq('company_id', profile.company_id), supabase.from('actions_log').select('*').eq('company_id', profile.company_id)];
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
  const getPreviousQuarter = (currentQuarter: string, currentYear: string) => {
    const quarterMap = { 'Q1': 'Q4', 'Q2': 'Q1', 'Q3': 'Q2', 'Q4': 'Q3' };
    const prevQuarter = quarterMap[currentQuarter as keyof typeof quarterMap];
    const prevYear = currentQuarter === 'Q1' ? (parseInt(currentYear) - 1).toString() : currentYear;
    return { quarter: prevQuarter, year: prevYear };
  };

  const getAnalyticsDataForReport = async () => {
    if (!profile?.company_id) return {};
    try {
      console.log('🔍 Starting analytics data collection for company:', profile.company_id);

      // Get current and previous quarter data for comparison
      const { quarter: prevQuarter, year: prevYear } = getPreviousQuarter(quarter, year);
      console.log(`📊 Comparing ${quarter} ${year} with ${prevQuarter} ${prevYear}`);

      // Get the latest meeting to determine which analytics to include
      const latestMeeting = meetings.length > 0 ? meetings[0] : null;
      const meetingId = latestMeeting?.id;
      console.log('📊 Latest meeting ID:', meetingId);
      console.log('📋 Available meetings:', meetings.length);

      // First, try to get current quarter analytics data
      const {
        data: currentAnalytics,
        error: currentError
      } = await supabase.from('dashboard_data').select('data_type, data_content, meeting_id').eq('company_id', profile.company_id);
      
      // Get previous quarter data from quarterly_reports table for comparison
      const {
        data: previousReports,
        error: prevError
      } = await supabase.from('quarterly_reports').select('analytics_data').eq('company_id', profile.company_id).eq('quarter', prevQuarter).eq('year', parseInt(prevYear));

      console.log('📈 Current analytics data found:', currentAnalytics?.length || 0);
      console.log('📈 Previous quarter reports found:', previousReports?.length || 0);
      
      if (currentError) {
        console.error('❌ Error fetching current analytics:', currentError);
      }
      if (prevError) {
        console.error('❌ Error fetching previous analytics:', prevError);
      }

      const analyticsData: {
        [key: string]: any;
      } = {};

      // Define analytics types to check based on meeting sections
      const analyticsTypes = [{
        key: 'staffTraining',
        title: 'Staff Training Analytics',
        dataTypes: ['resourcing_analytics', 'staff_training_analytics', 'resourcing_overview']
      }, {
        key: 'incidents',
        title: 'Incident Analytics',
        dataTypes: ['incidents_analytics']
      }, {
        key: 'feedback',
        title: 'Feedback Analytics',
        dataTypes: ['feedback_analytics']
      }, {
        key: 'spotCheck',
        title: 'Spot Check Analytics',
        dataTypes: ['spot_check_analytics']
      }, {
        key: 'supervision',
        title: 'Supervision Analytics',
        dataTypes: ['supervision_analytics']
      }, {
        key: 'staffDocuments',
        title: 'Staff Documents Analytics',
        dataTypes: ['staff_documents_analytics']
      }, {
        key: 'carePlan',
        title: 'Care Plan Analytics',
        dataTypes: ['care_plan_overview', 'care_plan_analytics']
      }];

      // Get previous quarter analytics data for comparison
      const previousAnalyticsData = previousReports?.[0]?.analytics_data || {};

      // Get analytics data for each type
      for (const {
        key,
        title,
        dataTypes
      } of analyticsTypes) {
        for (const dataType of dataTypes) {
          try {
            const matchingData = currentAnalytics?.find(item => item.data_type === dataType);
            if (matchingData?.data_content && Object.keys(matchingData.data_content).length > 0) {
              console.log(`✅ Found ${title} data:`, matchingData.data_content);
              
              // Include previous quarter data for comparison if available
              const previousData = previousAnalyticsData[key]?.data || null;
              
              analyticsData[key] = {
                title,
                data: matchingData.data_content,
                previousData: previousData,
                hasData: true,
                hasPreviousData: !!previousData,
                meetingId: matchingData.meeting_id,
                comparisonPeriod: `${prevQuarter} ${prevYear}`
              };
              break; // Use the first matching data type
            }
          } catch (error) {
            console.warn(`⚠️ Failed to process ${title}:`, error);
          }
        }
      }
      
      console.log('📊 Final analytics data for report with comparisons:', analyticsData);
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
          const {
            data: companyData
          } = await supabase.from('companies').select('name').eq('id', profile.company_id).single();
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
      const { quarter: prevQuarter, year: prevYear } = getPreviousQuarter(quarter, year);
      const systemPrompt = `You are an expert care agency analyst writing a professional quarterly report in British English. Your task is to generate a comprehensive, detailed quarterly report based STRICTLY on the provided meeting data and analytics.

CRITICAL FACTUAL REQUIREMENTS:
- Base ALL content EXCLUSIVELY on the provided meeting data and analytics
- DO NOT create hypothetical scenarios, examples, or data that wasn't provided
- DO NOT infer information beyond what is explicitly stated in the data
- DO NOT add industry assumptions or general statements not supported by the data
- If specific data is not available for a section, simply state "Information not available on this area" and move to the next section
- Only reference metrics, trends, and observations that are directly supported by the provided data
- REFUSE to write content when insufficient data is available rather than creating placeholder content

CRITICAL FORMATTING REQUIREMENTS:
- Write in flowing, natural language prose with complete sentences and paragraphs in British English
- Use British English spelling (e.g., realise, colour, centre, organisation, etc.)
- Each section must contain a minimum of 3-4 substantial paragraphs (100-150 words each)
- Use professional business language suitable for board presentations and regulatory reviews
- DO NOT use markdown formatting (no #, ##, *, -, etc.)
- DO NOT use bullet points or lists - write in paragraph format only
- Include specific numbers, percentages, and metrics ONLY from the provided data
- Provide detailed interpretations and insights based solely on the data provided
- Use the actual company name "${companyName}" throughout the report instead of generic terms like "the agency"

CONFIDENTIALITY AND ANONYMITY REQUIREMENTS:
- NEVER mention individual staff names, service user names, or personal identifiers
- Refer to staff collectively as "team members", "care staff", "management team", or similar
- Use organisational-level language (e.g., "the workforce", "staffing levels", "team performance")
- When discussing incidents or feedback, refer to them in aggregate terms without personal details
- Focus on trends, patterns, and collective outcomes rather than individual cases

COMPARATIVE ANALYSIS REQUIREMENTS:
- Include quarter-to-quarter comparison analysis where previous data is available (comparing ${quarter} ${year} with ${prevQuarter} ${prevYear})
- Identify trends, improvements, and areas of decline between quarters
- Calculate percentage changes and growth rates where applicable
- Highlight significant changes in performance metrics
- Discuss whether changes represent improvements or areas needing attention
- Use comparative language such as "increased by", "decreased from", "improved compared to", "declined since"

ANALYTICS DATA INTEGRATION:
You have access to analytics data for the following areas where available: ${Object.keys(reportAnalytics).join(', ')}
- Include contextual references to analytics data in relevant sections
- Use the format: [ANALYTICS DATA: {type}] where {type} is one of the available analytics (e.g., [ANALYTICS DATA: staffTraining])
- Only include analytics references where they add meaningful context to the narrative
- Provide data-driven insights based on the available analytics
- When previous quarter data is available, include comparative analysis between current and previous periods

CONTENT REQUIREMENTS:
- Each section should demonstrate deep analysis ONLY of trends, patterns, and implications present in the data
- Include comprehensive quarter-to-quarter comparative analysis ONLY where data permits and supports such analysis
- Provide specific examples and case studies ONLY from the actual meeting data (without naming individuals)
- Draw connections between different data points and metrics ONLY where evidenced in the data
- Offer strategic insights and forward-looking observations ONLY based on patterns shown in the data
- Highlight areas of improvement and decline ONLY where supported by comparative data

REPORT STRUCTURE (you MUST use these exact headings and include all sections):

${companyName} Quarterly Report - ${quarter} ${year}

1. Executive Summary
Write a comprehensive 200-300 word objective summary that captures the quarter's key findings, challenges, operational performance, and documented outcomes for ${companyName}. Compare factually with ${prevQuarter} ${prevYear} where data is available.

2. Operational Performance and Outcomes
Analyze operational results, performance metrics, and service delivery outcomes for ${companyName}. Report objectively on what occurred based on meeting data. Compare performance with ${prevQuarter} ${prevYear} where data is available.

3. Challenges and Areas for Improvement
Examine areas requiring attention, incidents, challenges, and issues identified by ${companyName}. Provide factual analysis of problems and documented responses. Compare challenge areas with the previous quarter.

4. Workforce Management and Capacity
Factual analysis of ${companyName}'s staffing levels, recruitment activities, retention data, training compliance, and supervision records. Include objective comparison of workforce metrics between ${quarter} ${year} and ${prevQuarter} ${prevYear}.

5. Care Quality and Service Delivery
Objective review of ${companyName}'s care planning status, service quality data, care plan compliance, risk management, and documented outcomes. Analyze objectively any changes in care quality since the previous quarter. Include [ANALYTICS DATA: feedback] to display the 12-month feedback analytics chart showing compliments, complaints, suggestions, and resolution trends.

6. Health, Safety and Risk Management
Factual analysis of ${companyName}'s incident records, safety performance, risk management activities, safeguarding records, and regulatory compliance. Compare safety metrics and incident data with ${prevQuarter} ${prevYear}. Include [ANALYTICS DATA: incidents] to display the 12-month incidents analytics chart showing incidents, accidents, safeguarding concerns, and resolution rates.

7. Quality Assurance and Feedback
Factual review of ${companyName}'s quality assurance activities, feedback received, audit findings, and improvement initiatives. Analyze objectively any progress on quality initiatives since the previous quarter.

8. Summary and Next Steps
Factual summary with documented plans for ${companyName}, recorded priorities, planned actions for the coming quarter, and documented lessons from quarter-to-quarter performance data.

WRITING STYLE:
- Objective, factual tone appropriate for professional documentation and regulatory reporting
- Use industry-standard terminology and neutral professional language
- Present facts without bias towards positive or negative outcomes
- Report what actually happened based on the documented evidence
- Avoid subjective language, assumptions, or evaluative statements not supported by data
- Always refer to ${companyName} by name rather than using generic terms
- Focus on organisational outcomes and documented evidence rather than subjective assessments`;
      const userPrompt = `Generate a detailed quarterly report for ${quarter} ${year} based STRICTLY on the following data. Do not add any information beyond what is provided.

Meeting Analysis: ${meetings.length} management meetings were held during this quarter, covering ${dataContext.meetingDetails.map(m => m.sectionSummary.length).reduce((a, b) => a + b, 0)} different operational areas.

Data Context: ${JSON.stringify(dataContext, null, 2)}

CRITICAL INSTRUCTIONS:
- Base ALL content exclusively on the data provided above
- Do not create examples, scenarios, or metrics not present in the data
- If data is insufficient for a section, write exactly "Information not available on this area" for that section
- Focus only on trends, patterns, and insights that are directly evidenced in the provided data
- Write in natural language prose with detailed paragraphs but remain strictly factual
- No markdown formatting allowed`;
      const response = await generateResponse([{
        role: 'system',
        content: systemPrompt
      }, {
        role: 'user',
        content: userPrompt
      }], 'gpt-4.1-2025-04-14');
      if (response) {
        setGeneratedReport(response);
        setAnalyticsScreenshots(reportAnalytics);
        setHasGeneratedReport(true);
        setIsOpen(false);

        // Save report to localStorage for persistence
        const reportKey = `quarterly_report_${quarter}_${year}`;
        localStorage.setItem(reportKey, response);
        localStorage.setItem(`${reportKey}_analytics`, JSON.stringify(reportAnalytics));

        // Navigate to the quarterly report page with the content and analytics data
        const encodedContent = encodeURIComponent(response);
        const encodedAnalytics = encodeURIComponent(JSON.stringify(reportAnalytics));
        navigate(`/quarterly-report?quarter=${quarter}&year=${year}&content=${encodedContent}&analytics=${encodedAnalytics}`);
        toast({
          title: "Report Created",
          description: "Your quarterly report has been created successfully"
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate the quarterly report",
        variant: "destructive"
      });
    }
  };
  const [analyticsScreenshots, setAnalyticsScreenshots] = useState<{
    [key: string]: any;
  }>({});
  const viewReport = () => {
    if (generatedReport) {
      const encodedContent = encodeURIComponent(generatedReport);
      const encodedAnalytics = encodeURIComponent(JSON.stringify(analyticsScreenshots));
      navigate(`/quarterly-report?quarter=${quarter}&year=${year}&content=${encodedContent}&analytics=${encodedAnalytics}`);
    }
  };
  const deleteReport = async () => {
    if (!profile?.company_id) return;
    try {
      const {
        error
      } = await supabase.from('quarterly_reports').delete().eq('company_id', profile.company_id).eq('quarter', quarter).eq('year', parseInt(year));
      if (error) {
        console.error('Error deleting report:', error);
        toast({
          title: "Delete Failed",
          description: "Failed to delete the quarterly report",
          variant: "destructive"
        });
        return;
      }
      setGeneratedReport("");
      setHasGeneratedReport(false);
      setAnalyticsScreenshots({});

      // Also remove from localStorage for backward compatibility
      const reportKey = `quarterly_report_${quarter}_${year}`;
      localStorage.removeItem(reportKey);
      localStorage.removeItem(`${reportKey}_analytics`);
      toast({
        title: "Report Deleted",
        description: "The quarterly report has been deleted"
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the quarterly report",
        variant: "destructive"
      });
    }
  };

  // If report has been generated, show view and delete buttons
  if (hasGeneratedReport && generatedReport) {
    return <div className="space-y-2">
        <div className="flex gap-2">
          <Button variant="default" className="gap-2" onClick={viewReport}>
            <FileText className="h-4 w-4" />
            View Report
          </Button>
          <Button variant="destructive" size="icon" onClick={deleteReport}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {/* Temporary debug info */}
        
      </div>;
  }

  // Add debug info for when no report is found
  const reportKey = `quarterly_report_${quarter}_${year}`;
  const savedReport = localStorage.getItem(reportKey);
  return <div className="space-y-2">
      <Button variant="default" className="gap-2" onClick={generateReport}>
        <FileText className="h-4 w-4" />
        Generate Report
      </Button>
      {/* Temporary debug info */}
      
    </div>;
};