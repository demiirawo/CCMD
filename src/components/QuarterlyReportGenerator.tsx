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
            ragStatusSummary: {
              green: s.items?.filter((item: any) => item.status === 'green').length || 0,
              amber: s.items?.filter((item: any) => item.status === 'amber').length || 0,
              red: s.items?.filter((item: any) => item.status === 'red').length || 0
            },
            itemDetails: s.items?.map((item: any) => ({
              title: item.title || item.content,
              ragStatus: item.status, // Red/Amber/Green status
              latestUpdate: item.observation || 'No update provided',
              trendAnalysis: item.trendsThemes || 'No trend analysis available',
              actions: item.actions || [],
              metadata: item.metadata || {}
            })) || [],
            achievements: s.items?.filter((item: any) => item.status === 'green').map((item: any) => ({
              title: item.title || item.content,
              ragStatus: 'green',
              latestUpdate: item.observation,
              trendAnalysis: item.trendsThemes
            })) || [],
            challenges: s.items?.filter((item: any) => item.status === 'red' || item.status === 'amber').map((item: any) => ({
              title: item.title || item.content,
              ragStatus: item.status,
              latestUpdate: item.observation,
              trendAnalysis: item.trendsThemes
            })) || []
          }))
        })),
        analyticsInsights: processedAnalytics,
        keyMetrics: extractKeyMetrics(analyticsData, meetings),
        availableAnalytics: Object.keys(reportAnalytics)
      };
      const { quarter: prevQuarter, year: prevYear } = getPreviousQuarter(quarter, year);
      
      // Get company information for proper terminology
      let companyInfo = null;
      let careOrSupport = 'Care';
      if (profile?.company_id) {
        try {
          const { data: companyData } = await supabase
            .from('companies')
            .select('services')
            .eq('id', profile.company_id)
            .single();
          if (companyData) {
            companyInfo = companyData;
            const isOnlySupportedHousing = companyData.services?.length === 1 && 
              companyData.services.includes('Supported Housing');
            careOrSupport = isOnlySupportedHousing ? 'Support' : 'Care';
          }
        } catch (error) {
          console.warn('Could not fetch company services:', error);
        }
      }

      const hasSupportedHousing = companyInfo?.services?.includes('Supported Housing');
      
      const systemPrompt = `You are an experienced care management consultant writing a narrative quarterly report in British English. Your task is to create a compelling, story-driven report that tells the journey of ${companyName} during ${quarter} ${year}.

NARRATIVE STYLE REQUIREMENTS:
- Write in a flowing, engaging narrative style that tells the story of the quarter
- Use vivid, descriptive language while maintaining professionalism
- Create smooth transitions between topics and sections
- Build a coherent narrative arc showing progress, challenges, and outcomes
- Use storytelling techniques to make the report engaging and memorable
- Write as if you're telling the story to stakeholders who care about the organisation's journey

CRITICAL FACTUAL REQUIREMENTS:
- Base ALL content EXCLUSIVELY on the provided meeting data
- DO NOT create hypothetical scenarios, examples, or data that wasn't provided
- If specific data is not available for a section, simply state "Information not available on this area" and move to the next section
- Only reference metrics, trends, and observations that are directly supported by the provided data

RAG STATUS INTEGRATION:
- Pay special attention to Red/Amber/Green (RAG) status indicators for each dashboard item
- Use RAG status to understand performance levels and progress
- Green items represent successful outcomes and achievements
- Amber items indicate areas requiring attention or in progress
- Red items highlight urgent concerns or overdue matters
- Create narrative around the RAG status distribution and what it tells about organisational performance

DASHBOARD DATA INTEGRATION:
- Focus heavily on "latestUpdate" and "trendAnalysis" fields - these contain the most current operational insights
- Use "ragStatus" to understand the performance level of each area
- Only reference feedback and incident graphs when specifically mentioned in the data
- Do not reference other analytics data unless explicitly provided

FORMATTING REQUIREMENTS:
- Write in flowing, natural language prose with complete sentences and paragraphs in British English
- Use British English spelling (e.g., realise, colour, centre, organisation, etc.)
- Each section should be substantial and engaging (minimum 200-300 words when data is available)
- Use professional but engaging language suitable for board presentations
- DO NOT use markdown formatting (no #, ##, *, -, etc.)
- Write in paragraph format only, not bullet points or lists
- Create smooth narrative flow between sections

REQUIRED HEADING STRUCTURE (use exactly as shown):

# Executive Summary

# Successes and Achievements

# Learning Opportunities and Strategic Challenges

# Staff
## Resourcing
## Staff Documents
## Training
## Spot Checks
## Staff Supervisions
## Staff Meetings

# ${careOrSupport} Planning & Delivery
## ${careOrSupport} Plans & Risk Assessments
## Service User Documents
## Medication Management
## ${careOrSupport} Notes
## Call Monitoring
## Transportation

# Safety
## Incidents & Accidents
(Include reference to 12-month incident analytics graph here when data available)
## Risk Register
## Infection Control
## Information Governance

# Continuous Improvement
## Feedback
(Include reference to 12-month feedback analytics graph here when data available)
## Audits

${hasSupportedHousing ? `# Supported Housing
## Tenancy & Benefits
## Property Safety & Maintenance

` : ''}# Next Steps and Future Planning`;
      const userPrompt = `Generate a detailed quarterly report for ${quarter} ${year} based STRICTLY on the following data. Do not add any information beyond what is provided.

Meeting Analysis: ${meetings.length} management meetings were held during this quarter.

Data Context: ${JSON.stringify(dataContext, null, 2)}

CRITICAL INSTRUCTIONS:
- Base ALL content exclusively on the meeting data provided above
- Write in an engaging narrative style that tells the story of ${quarter} ${year}
- Pay special attention to the "latestUpdate", "trendAnalysis", and "ragStatus" fields for each item
- Use RAG status (Red/Amber/Green) to understand performance levels and create narrative around progress
- Include insights from latest updates and trend analysis to build the organisational story
- Only reference feedback graphs and incident graphs if specifically mentioned in the data
- Do not use other analytics data unless explicitly provided
- If data is insufficient for a section, write "Information not available for this area during ${quarter} ${year}"
- Focus only on trends, patterns, and insights that are directly evidenced in the provided data
- Write in natural language prose with detailed paragraphs but remain strictly factual
- Use the exact heading structure specified in the system prompt
- Include 12-month graph references where specified
- Use "${careOrSupport}" terminology where indicated
- ${hasSupportedHousing ? 'Include Supported Housing section' : 'Skip Supported Housing section'}`;
      const response = await generateResponse([{
        role: 'system',
        content: 'You are a professional report writer specializing in objective, factual quarterly reports. You NEVER create fictional content and strictly adhere to provided data. You maintain complete objectivity and clearly state when information is not available. You follow exact heading structures and use specified terminology.'
      }, {
        role: 'user',
        content: systemPrompt + '\n\n' + userPrompt
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