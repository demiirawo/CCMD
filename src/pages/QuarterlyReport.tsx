import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, FileText, Printer, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOpenAI } from "@/hooks/useOpenAI";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } from 'docx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line } from 'recharts';
interface CompanyInfo {
  name: string;
  logo_url: string | null;
  theme_color: string;
  services: string[];
}
export const QuarterlyReport = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    profile
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    generateResponse,
    isLoading: isGenerating
  } = useOpenAI();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [reportContent, setReportContent] = useState<string>("");
  const [reportPages, setReportPages] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [analyticsImages, setAnalyticsImages] = useState<{
    [key: string]: any;
  }>({});
  const [hasGenerationFailed, setHasGenerationFailed] = useState(false);
  const quarter = searchParams.get("quarter") || "";
  const year = searchParams.get("year") || "";
  const content = searchParams.get("content") || "";
  const analytics = searchParams.get("analytics") || "";
  const shouldGenerate = searchParams.get("generate") === "true";
  const contextParam = searchParams.get("context") || "";

  // Load existing report from database if no content in URL
  useEffect(() => {
    if (!content && !shouldGenerate && quarter && year && profile?.company_id) {
      loadExistingReport();
    }
  }, [quarter, year, profile?.company_id, content, shouldGenerate]);

  const loadExistingReport = async () => {
    if (!profile?.company_id || !quarter || !year) return;

    try {
      console.log('🔍 Loading existing report from database...');
      const { data, error } = await supabase
        .from('quarterly_reports')
        .select('report_content, analytics_data')
        .eq('company_id', profile.company_id)
        .eq('quarter', quarter)
        .eq('year', parseInt(year))
        .maybeSingle();

      if (error) {
        console.error('Error loading existing report:', error);
        toast({
          title: "Error Loading Report",
          description: "Failed to load the saved report from database.",
          variant: "destructive"
        });
        return;
      }

      if (data && data.report_content) {
        console.log('✅ Found existing report in database');
        setReportContent(data.report_content);
        splitContentIntoPages(data.report_content);
        
        if (data.analytics_data && typeof data.analytics_data === 'object') {
          setAnalyticsImages(data.analytics_data as { [key: string]: any });
        }
      } else {
        console.log('❌ No existing report found in database');
        toast({
          title: "No Report Found",
          description: "No saved report was found for this quarter and year.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading existing report:', error);
      toast({
        title: "Loading Error",
        description: "An unexpected error occurred while loading the report.",
        variant: "destructive"
      });
    }
  };

  // Generate report with AI if requested
  useEffect(() => {
    console.log('🔍 useEffect triggered - checking generation conditions');
    console.log('📋 shouldGenerate:', shouldGenerate);
    console.log('📄 content from URL:', !!content);
    console.log('📄 reportContent state:', !!reportContent);
    console.log('🔄 isGenerating:', isGenerating);
    if (shouldGenerate && !content && !reportContent && !isGenerating && !hasGenerationFailed) {
      console.log('✅ All conditions met - starting report generation');
      generateAIReport();
    } else {
      console.log('❌ Conditions not met for generation');
      if (!shouldGenerate) console.log('  - shouldGenerate is false');
      if (content) console.log('  - content already exists in URL');
      if (reportContent) console.log('  - reportContent already exists in state');
      if (isGenerating) console.log('  - already generating');
    }
  }, [shouldGenerate, content, reportContent, isGenerating, hasGenerationFailed]);
  useEffect(() => {
    if (content) {
      try {
        const decodedContent = decodeURIComponent(content);
        setReportContent(decodedContent);
        splitContentIntoPages(decodedContent);
      } catch (error) {
        console.error('Failed to decode content:', error);
        // Fallback: use content as-is if decoding fails
        setReportContent(content);
        splitContentIntoPages(content);
      }
    }
    if (analytics) {
      try {
        const decodedAnalytics = JSON.parse(decodeURIComponent(analytics));
        console.log('📊 Setting analytics images from URL:', decodedAnalytics);
        setAnalyticsImages(decodedAnalytics);
      } catch (error) {
        console.warn('Failed to parse analytics data:', error);
        // Try to parse without decoding first
        try {
          const directAnalytics = JSON.parse(analytics);
          console.log('📊 Setting analytics images (direct):', directAnalytics);
          setAnalyticsImages(directAnalytics);
        } catch (directError) {
          console.warn('Failed to parse analytics data directly:', directError);
        }
      }
    } else {
      console.log('📊 No analytics parameter found in URL');
    }
    loadCompanyInfo();
  }, [content, analytics]);
  const processAnalyticsData = async () => {
    if (!profile?.company_id) return {};
    try {
      // Get analytics data from dashboard_data table
      const {
        data: analyticsData,
        error
      } = await supabase.from('dashboard_data').select('data_type, data_content').eq('company_id', profile.company_id);
      if (error) {
        console.error('Error loading analytics data:', error);
        return {};
      }

      // Process and summarize analytics data for narrative reporting
      const processedAnalytics = {
        staffingTrends: {
          summary: "Staff retention and training metrics show significant improvements",
          keyMetrics: [],
          insights: []
        },
        incidentAnalysis: {
          summary: "Incident patterns and safety performance indicators",
          trends: [],
          improvements: []
        },
        carePlanEffectiveness: {
          summary: "Care planning outcomes and service quality metrics",
          achievements: [],
          areas_for_development: []
        },
        feedbackAndCompliance: {
          summary: "Stakeholder feedback and regulatory compliance status",
          positive_feedback: [],
          compliance_achievements: []
        }
      };

      // Extract meaningful insights from raw analytics data
      if (analyticsData && analyticsData.length > 0) {
        analyticsData.forEach(item => {
          const dataType = item.data_type;
          const content = item.data_content;
          if (dataType === 'staff_training_analytics' && content && typeof content === 'object') {
            const analyticsContent = content as {
              [key: string]: any;
            };
            processedAnalytics.staffingTrends.keyMetrics.push(`Training compliance rates achieved ${analyticsContent.compliance_rate || 'high'} levels`);
          }
          if (dataType === 'incidents_analytics' && content && typeof content === 'object') {
            const analyticsContent = content as {
              [key: string]: any;
            };
            processedAnalytics.incidentAnalysis.trends.push(`Incident reporting shows ${analyticsContent.trend || 'positive'} trajectory`);
          }
        });
      }
      return processedAnalytics;
    } catch (error) {
      console.error('Error processing analytics data:', error);
      return {};
    }
  };
  const saveReportToSupabase = async (reportContent: string, analyticsData: any) => {
    if (!profile?.company_id) {
      throw new Error('No company ID found');
    }
    try {
      const {
        data,
        error
      } = await supabase.from('quarterly_reports').upsert({
        company_id: profile.company_id,
        quarter,
        year: parseInt(year),
        report_content: reportContent,
        analytics_data: analyticsData || {}
      }, {
        onConflict: 'company_id,quarter,year'
      });
      if (error) {
        throw error;
      }
      console.log('✅ Report saved to Supabase successfully');
      toast({
        title: "Report Saved",
        description: "Your quarterly report has been saved to the database."
      });
    } catch (error) {
      console.error('❌ Error saving report to Supabase:', error);
      throw error;
    }
  };
  const generateAIReport = async () => {
    try {
      console.log('🤖 Starting AI report generation...');

      // Get company information first
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

      // Parse additional context if provided
      let additionalContext = '';
      if (contextParam) {
        try {
          const contextData = JSON.parse(contextParam);
          additionalContext = contextData.additionalContext || '';
          console.log('📝 Additional context provided:', additionalContext);
        } catch (directError) {
          try {
            const contextData = JSON.parse(decodeURIComponent(contextParam));
            additionalContext = contextData.additionalContext || '';
          } catch (error) {
            console.warn('Failed to parse context data:', error);
            additionalContext = '';
          }
        }
      }

      // Process analytics data for narrative inclusion
      const processedAnalytics = await processAnalyticsData();
      // Determine if company uses "Care" or "Support" terminology
      const isOnlySupportedHousing = companyInfo?.services?.length === 1 && 
        companyInfo.services.includes('Supported Housing');
      const careOrSupport = isOnlySupportedHousing ? 'Support' : 'Care';
      
      // Check if company has Supported Housing services
      const hasSupportedHousing = companyInfo?.services?.includes('Supported Housing');

      const messages = [{
        role: 'system' as const,
        content: 'You are a professional report writer specializing in objective, factual quarterly reports. You NEVER create fictional content and strictly adhere to provided data. You maintain complete objectivity and clearly state when information is not available. You follow exact heading structures and use specified terminology.'
      }, {
        role: 'user' as const,
        content: `You are a seasoned care management consultant crafting a compelling quarterly narrative report. Your mission is to transform raw meeting data into an engaging story that captures the journey, challenges, triumphs, and evolution of ${companyName} during ${quarter} ${year}.

NARRATIVE STORYTELLING APPROACH:
1. NEVER mention field names, data sources, or technical references (avoid terms like "LATEST UPDATE", "TREND ANALYSIS", "dashboard", etc.)
2. WEAVE insights naturally into flowing prose that tells the organization's story
3. ANALYZE patterns, trends, and developments to provide meaningful insights rather than just reporting facts
4. CREATE a compelling narrative arc that shows progression, challenges overcome, and areas of growth
5. USE vivid, descriptive language that brings the quarter's events to life
6. CONNECT different elements to show how various aspects of the organization interrelate and influence each other

CRITICAL CONTENT RULES:
1. Base ALL content strictly on the meeting data provided - never invent or assume information
2. If no relevant information exists for a section, simply omit that section from the report
3. Transform raw data into meaningful insights and analysis rather than simple reporting
4. Focus on the human story behind the data - what it means for staff, service users, and the organization

ANALYTICAL FOCUS:
- Look for patterns and trends across the quarter
- Identify cause-and-effect relationships between different developments
- Highlight improvements, challenges, and strategic shifts
- Provide context for why certain developments matter
- Draw connections between different areas of the organization

COMPANY: ${companyName}
REPORTING PERIOD: ${quarter} ${year}

DATA PROVIDED:
${additionalContext ? `Additional Context: ${additionalContext}` : ''}
Analytics Data: ${JSON.stringify(processedAnalytics, null, 2)}

IMPORTANT: Transform the meeting content into narrative insights - analyze what the updates and observations reveal about the organization's journey, rather than simply reporting what was recorded.

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

` : ''}# Next Steps and Future Planning

REPORTING INSTRUCTIONS:
- Base all content strictly on the provided meeting data and analytics
- If a section has no corresponding data, write "No information available for this area during ${quarter} ${year}"
- When referencing statistics, specify the source (e.g., "Based on analytics data from [specific source]")
- Maintain professional, objective tone throughout
- Do not speculate, assume, or create hypothetical scenarios
- Focus on factual observations rather than interpretative conclusions
- Write in flowing paragraph format, not bullet points or lists
- Each section should be substantive (minimum 200 words) when data is available`
      }];
      console.log('🚀 Calling OpenAI API with enhanced model...');
      const generatedContent = await generateResponse(messages, 'gpt-4.1-2025-04-14');
      console.log('📝 OpenAI API response received');
      console.log('📏 Content length:', generatedContent?.length || 0);
      console.log('📄 Content preview:', generatedContent?.substring(0, 100) || 'No content');
      if (generatedContent && generatedContent.trim()) {
        console.log('✅ Report generated successfully');
        setReportContent(generatedContent);
        splitContentIntoPages(generatedContent);

        // Process and set analytics images for chart rendering
        const analyticsForDisplay = await processAnalyticsData();
        setAnalyticsImages(analyticsForDisplay);
        console.log('📊 Analytics images set for display:', analyticsForDisplay);

        // Save the generated report to Supabase
        await saveReportToSupabase(generatedContent, analyticsForDisplay);
        toast({
          title: "Report Generated",
          description: "Your comprehensive quarterly report has been successfully generated!"
        });
      } else {
        console.error('❌ No content returned from AI');
        console.error('❌ generatedContent value:', generatedContent);
        throw new Error('No content returned from AI service');
      }
    } catch (error) {
      console.error('❌ Error generating report:', error);
      setHasGenerationFailed(true); // Prevent infinite retry loop
      toast({
        title: "Generation Failed", 
        description: error instanceof Error ? error.message : "Failed to generate the quarterly report. Please try again.",
        variant: "destructive"
      });
    }
  };
  const loadCompanyInfo = async () => {
    if (!profile?.company_id) return;
    try {
      const {
        data,
        error
      } = await supabase.from('companies').select('name, logo_url, theme_color, services').eq('id', profile.company_id).single();
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
        variant: "destructive"
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
        documentChildren.push(new Paragraph({
          children: [new ImageRun({
            data: logoImage,
            type: 'png',
            transformation: {
              width: Math.round(logoWidth),
              height: Math.round(logoHeight)
            }
          })],
          alignment: 'center',
          spacing: {
            after: 400
          }
        }));
      }

      // Add cover page content
      documentChildren.push(new Paragraph({
        text: companyInfo?.name || 'Care Agency',
        heading: HeadingLevel.TITLE,
        alignment: 'center',
        spacing: {
          after: 400
        }
      }), new Paragraph({
        text: 'Quarterly Report',
        heading: HeadingLevel.HEADING_1,
        alignment: 'center',
        spacing: {
          after: 200
        }
      }), new Paragraph({
        text: `${quarter} ${year}`,
        heading: HeadingLevel.HEADING_2,
        alignment: 'center',
        spacing: {
          after: 200
        }
      }), new Paragraph({
        text: getQuarterDates(quarter, year),
        alignment: 'center',
        spacing: {
          after: 400
        }
      }), new Paragraph({
        text: `Report Created: ${getCurrentDate()}`,
        alignment: 'center',
        spacing: {
          after: 800
        }
      }));

      // Add content
      documentChildren.push(...parseContentForWord(reportContent));

      // Parse the report content and create Word document structure
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: {
                orientation: "portrait",
                width: 11906,
                // A4 width in twentieths of a point (8.27 inches)
                height: 16838 // A4 height in twentieths of a point (11.69 inches)
              },
              margin: {
                top: 1440,
                // 1 inch
                right: 1440,
                // 1 inch
                bottom: 1440,
                // 1 inch
                left: 1440 // 1 inch
              }
            }
          },
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
        description: "Report has been exported to Word document"
      });
    } catch (error) {
      console.error('Error exporting Word document:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export report to Word document",
        variant: "destructive"
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
        paragraphs.push(new Paragraph({
          text: '',
          spacing: {
            after: 200
          }
        }));
      } else if (trimmedLine.match(/^\d+\.\s/)) {
        // Section headers (e.g., "1. Executive Summary")
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: trimmedLine,
            bold: true,
            size: 28
          })],
          heading: HeadingLevel.HEADING_1,
          spacing: {
            before: 400,
            after: 200
          }
        }));
      } else if (trimmedLine.startsWith('Care Agency Quarterly Report')) {
        // Main title
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: trimmedLine,
            bold: true,
            size: 32
          })],
          heading: HeadingLevel.TITLE,
          alignment: 'center',
          spacing: {
            after: 400
          }
        }));
      } else if (trimmedLine.length > 0) {
        // Regular paragraphs
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: trimmedLine,
            size: 22
          })],
          spacing: {
            after: 120
          },
          alignment: 'both'
        }));
      }
    }
    return paragraphs;
  };
  const printReport = () => {
    window.print();
  };

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Function to render visual analytics charts
  const renderAnalyticsChart = (analyticsType: string, analyticsData: any) => {
    if (!analyticsData || !analyticsData.hasData) return null;
    switch (analyticsType) {
      case 'staffTraining':
        if (analyticsData.data?.monthly_data) {
          const chartData = analyticsData.data.monthly_data.map((item: any) => ({
            month: item.month,
            'Current Staff': item.currentStaff,
            'Probation Staff': item.probationStaff,
            'Onboarding Staff': item.onboardingStaff
          }));
          return <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Current Staff" fill="#3b82f6" />
                  <Bar dataKey="Probation Staff" fill="#10b981" />
                  <Bar dataKey="Onboarding Staff" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>;
        }
        break;
      case 'feedback':
        if (Array.isArray(analyticsData.data)) {
          const chartData = analyticsData.data.map((item: any) => ({
            month: item.month,
            compliments: item.compliments || 0,
            complaints: item.complaints || 0,
            suggestions: item.suggestions || 0,
            resolved: item.resolved || 0
          }));
          return <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{
                top: 5,
                right: 5,
                bottom: 25,
                left: 5
              }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                  <YAxis axisLine={false} tickLine={false} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="compliments" fill="#22c55e" name="Compliments" stackId="feedback" />
                  <Bar dataKey="complaints" fill="#ef4444" name="Complaints" stackId="feedback" />
                  <Bar dataKey="suggestions" fill="#3b82f6" name="Suggestions" stackId="feedback" />
                  <Line type="monotone" dataKey="resolved" stroke="#f59e0b" strokeWidth={2} dot={{
                  r: 3,
                  fill: "#f59e0b"
                }} name="Resolved" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>;
        }
        break;
      case 'incidents':
        if (Array.isArray(analyticsData.data)) {
          const chartData = analyticsData.data.map((item: any) => ({
            month: item.month,
            incidents: item.incidents || 0,
            accidents: item.accidents || 0,
            safeguarding: item.safeguarding || 0,
            resolved: item.resolved || 0
          }));
          return <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{
                top: 5,
                right: 5,
                bottom: 25,
                left: 5
              }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                  <YAxis axisLine={false} tickLine={false} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="incidents" fill="#ef4444" name="Incidents" stackId="incidents" />
                  <Bar dataKey="accidents" fill="#f59e0b" name="Accidents" stackId="incidents" />
                  <Bar dataKey="safeguarding" fill="#3b82f6" name="Safeguarding" stackId="incidents" />
                  <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={{
                  r: 3,
                  fill: "#22c55e"
                }} name="Resolved" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>;
        }
        break;
      case 'carePlan':
        if (analyticsData.data) {
          const pieData = [{
            name: 'Low Risk',
            value: analyticsData.data.lowRisk || 0,
            color: '#10b981'
          }, {
            name: 'Medium Risk',
            value: analyticsData.data.mediumRisk || 0,
            color: '#f59e0b'
          }, {
            name: 'High Risk',
            value: analyticsData.data.highRisk || 0,
            color: '#ef4444'
          }, {
            name: 'N/A Risk',
            value: analyticsData.data.naRisk || 0,
            color: '#6b7280'
          }].filter(item => item.value > 0);
          return <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({
                  name,
                  value
                }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>;
        }
        break;
      case 'spotCheck':
        if (analyticsData.data) {
          const spotCheckData = [{
            name: 'Completed Spot Checks',
            value: 100 - (analyticsData.data.overdueSpotChecks || 0),
            color: '#10b981'
          }, {
            name: 'Overdue Spot Checks',
            value: analyticsData.data.overdueSpotChecks || 0,
            color: '#ef4444'
          }].filter(item => item.value > 0);
          return <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={spotCheckData} cx="50%" cy="50%" labelLine={false} label={({
                  name,
                  value
                }) => `${name}: ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {spotCheckData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>;
        }
        break;
      case 'supervision':
        if (analyticsData.data) {
          const supervisionData = [{
            name: 'Completed Supervisions',
            value: 100 - (analyticsData.data.overdueSupervisions || 0),
            color: '#10b981'
          }, {
            name: 'Overdue Supervisions',
            value: analyticsData.data.overdueSupervisions || 0,
            color: '#ef4444'
          }].filter(item => item.value > 0);
          return <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={supervisionData} cx="50%" cy="50%" labelLine={false} label={({
                  name,
                  value
                }) => `${name}: ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {supervisionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>;
        }
        break;
      default:
        return <div className="text-sm text-gray-600">
            <pre className="mt-2 text-xs bg-white p-3 rounded border overflow-auto max-h-40">
              {JSON.stringify(analyticsData.data, null, 2)}
            </pre>
          </div>;
    }
    return null;
  };

  // Show loading state when generating report
  if (isGenerating) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-12 text-center">
          <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
          <h2 className="text-xl font-semibold mb-2">Generating Report</h2>
          
          <p className="text-sm text-gray-500">This may take a few moments</p>
        </Card>
      </div>;
  }
  if (!reportContent || reportPages.length === 0) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Report Found</h2>
          <p className="text-gray-600 mb-4">The quarterly report content was not found.</p>
          <Button onClick={() => navigate('/reports')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50">
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
            <Button onClick={exportToWord} disabled={isExporting} variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export Word'}
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content - Distinct A4 Pages with Clear Separation */}
      <div className="py-12 print:py-0 bg-gray-100 print:bg-white">
        <div id="quarterly-report-content" className="max-w-4xl mx-auto print:max-w-none">
          
          {/* Display all pages as distinct A4 documents */}
          <div className="space-y-12 print:space-y-0">
            {reportPages.map((pageContent, index) => <div key={index} data-page-index={index} className="bg-white shadow-2xl print:shadow-none page-break mx-auto border border-gray-200 print:border-none" style={{
            width: '794px',
            // A4 width at 96 DPI (210mm = 794px)
            minHeight: '1123px',
            // A4 height at 96 DPI (297mm = 1123px)
            padding: '96px',
            // 25.4mm = 96px at 96 DPI
            fontSize: '16px',
            // 12pt = 16px
            lineHeight: '1.5',
            fontFamily: 'Arial, sans-serif',
            boxSizing: 'border-box',
            pageBreakAfter: 'always'
          }}>
              {index === 0 ?
            // Cover Page
            <div className="h-full flex flex-col justify-between" style={{
              padding: '0'
            }}>
                  {/* Header */}
                  <div className="text-center">
                    {companyInfo?.logo_url && <div className="mb-8">
                        <img src={companyInfo.logo_url} alt={`${companyInfo.name} Logo`} className="mx-auto h-24 w-auto object-contain" />
                      </div>}
                    
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      {companyInfo?.name || 'Care Agency'}
                    </h1>
                    
                    <div className="w-24 h-1 mx-auto mb-8" style={{
                  backgroundColor: companyInfo?.theme_color || '#3b82f6'
                }}></div>
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
                </div> :
            // Content Pages
            <div className="h-full relative" style={{
              padding: '0'
            }}>
                  {/* Page Header */}
                  <div className="absolute top-0 left-0 right-0 flex justify-between items-center text-sm text-gray-600 print:block" style={{
                padding: '15mm 15mm 0 15mm',
                height: '20mm'
              }}>
                  </div>
                  
                  {/* Page Footer */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center text-sm text-gray-600 print:block" style={{
                padding: '0 15mm 15mm 15mm',
                height: '20mm'
              }}>
                    <div className="text-center">
                      Page {index}
                    </div>
                  </div>
                  
                  <div className="prose prose-lg max-w-none" style={{
                paddingTop: '20mm',
                paddingBottom: '20mm'
              }}>
                    <div className="report-content" style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  lineHeight: '1.6',
                  color: '#374151'
                }}>
                        {(() => {
                    const processedAnalytics = new Set();
                    return pageContent.split('\n').map((line, lineIndex) => {
                      // Check for analytics data placeholders
                      const analyticsDataMatch = line.trim().match(/\[ANALYTICS DATA: (\w+)\]/);
                      if (analyticsDataMatch) {
                        const analyticsType = analyticsDataMatch[1];

                        // Only show feedback and spotCheck analytics, and only once each
                        if ((analyticsType === 'feedback' || analyticsType === 'incidents' || analyticsType === 'spotCheck') && !processedAnalytics.has(analyticsType)) {
                          processedAnalytics.add(analyticsType);
                          const analyticsData = analyticsImages[analyticsType];
                          if (analyticsData && analyticsData.hasData) {
                            const displayTitle = analyticsType === 'feedback' ? 'Feedback' : analyticsType === 'incidents' ? 'Incidents, Accidents & Safeguarding' : 'Spot Check Analytics';
                            return <div key={lineIndex} className="my-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                      <h3 className="text-lg font-semibold text-gray-800 mb-3">{displayTitle}</h3>
                                      {renderAnalyticsChart(analyticsType, analyticsData)}
                                    </div>;
                          }
                        }
                        return null; // Skip if not feedback/spotCheck or already processed
                      }

                      // Handle natural language prose content
                      
                      // Handle markdown-style major headings (# heading)
                      if (line.trim().startsWith('# ') && line.trim().length > 2) {
                        const headingText = line.trim().replace(/^# /, '');
                        return <div key={lineIndex} className="mb-8">
                                  <h1 className="text-3xl font-bold text-gray-800 pb-3 mb-6 mt-8 text-center" style={{
                            borderBottom: '2px solid #9ca3af',
                            fontSize: '24pt',
                            fontWeight: 'bold',
                            color: '#374151',
                            paddingBottom: '12px'
                          }}>
                                    {headingText}
                                  </h1>
                                </div>;
                      }
                      
                      // Handle markdown-style minor headings (## heading)
                      if (line.trim().startsWith('## ') && line.trim().length > 3) {
                        const headingText = line.trim().replace(/^## /, '');
                        return <div key={lineIndex} className="mb-6">
                                  <h2 className="text-xl font-bold text-gray-800 mb-4 mt-6 text-center" style={{
                            fontSize: '18pt',
                            fontWeight: 'bold',
                            color: '#374151'
                          }}>
                                    {headingText}
                                  </h2>
                                </div>;
                      }
                      
                      if (line.trim().match(/^\d+\.\s/)) {
                        // Section headers (e.g., "1. Executive Summary")
                        return <div key={lineIndex} className="mb-8">
                                  <h2 className="text-2xl font-bold text-gray-800 pb-3 mb-6 mt-8" style={{
                            borderBottom: '2px solid #9ca3af',
                            fontSize: '18pt',
                            fontWeight: 'bold',
                            color: '#374151',
                            paddingBottom: '12px'
                          }}>
                                    {line.trim()}
                                  </h2>
                                </div>;
                      }
                      if (line.trim().startsWith('Care Agency Quarterly Report') || line.trim().includes('Quarterly Report')) {
                        // Main title - replace with actual company name
                        const titleText = line.trim().replace('Care Agency', companyInfo?.name || 'Care Agency');
                        return <h1 key={lineIndex} className="text-3xl font-bold text-gray-900 mb-8 text-center border-b-2 border-gray-200 pb-4">
                                  {titleText}
                                </h1>;
                      }
                      // Check for standalone section titles (without numbers) - expanded list
                      if (line.trim().length > 0 && line.trim().length < 100 && (line.trim() === 'Executive Summary' || line.trim() === 'Operational Successes' || line.trim() === 'Operational Successes and Achievements' || line.trim() === 'Learning Opportunities and Challenges' || line.trim() === 'Learning Opportunities and Strategic Challenges' || line.trim() === 'Workforce and Capacity Analysis' || line.trim() === 'Workforce Development and Capacity Analysis' || line.trim() === 'Care Quality and Service Delivery' || line.trim() === 'Care Quality and Service Excellence' || line.trim() === 'Health, Safety and Risk Management' || line.trim() === 'Continuous Improvement and Innovation' || line.trim() === 'Strategic Outlook and Recommendations' || line.trim() === 'Strategic Outlook and Future Planning' || line.trim().includes('Summary') || line.trim().includes('Analysis') || line.trim().includes('Development') || line.trim().includes('Excellence') || line.trim().includes('Management') || line.trim().includes('Innovation') || line.trim().includes('Outlook') || line.trim().includes('Planning'))) {
                        const sectionTitle = line.trim();
                        const elements = [
                          <div key={lineIndex} className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 pb-3 mb-6" style={{
                              borderBottom: '2px solid #9ca3af',
                              fontSize: '18pt',
                              fontWeight: 'bold',
                              color: '#374151',
                              paddingBottom: '12px'
                            }}>
                              {sectionTitle}
                            </h2>
                          </div>
                        ];
                        
                        // Add feedback graph for Care Quality and Service Excellence section
                        if ((sectionTitle === 'Care Quality and Service Excellence' || sectionTitle === 'Care Quality and Service Delivery') && 
                            analyticsImages.feedback && analyticsImages.feedback.hasData) {
                          console.log('📊 Adding feedback chart for section:', sectionTitle);
                          console.log('📊 Feedback data:', analyticsImages.feedback);
                          elements.push(
                            <div key={`${lineIndex}-feedback`} className="my-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                              <h3 className="text-lg font-semibold text-gray-800 mb-3">Client Feedback Analytics</h3>
                              {renderAnalyticsChart('feedback', analyticsImages.feedback)}
                            </div>
                          );
                        } else {
                          console.log('📊 Feedback chart not added - section:', sectionTitle, 'hasData:', analyticsImages.feedback?.hasData);
                        }
                        
                        // Add incident graph for Health, Safety and Risk Management section
                        if (sectionTitle === 'Health, Safety and Risk Management' && 
                            analyticsImages.incidents && analyticsImages.incidents.hasData) {
                          console.log('📊 Adding incidents chart for section:', sectionTitle);
                          console.log('📊 Incidents data:', analyticsImages.incidents);
                          elements.push(
                            <div key={`${lineIndex}-incidents`} className="my-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                              <h3 className="text-lg font-semibold text-gray-800 mb-3">Incidents, Accidents & Safeguarding Analytics</h3>
                              {renderAnalyticsChart('incidents', analyticsImages.incidents)}
                            </div>
                          );
                        } else {
                          console.log('📊 Incidents chart not added - section:', sectionTitle, 'hasData:', analyticsImages.incidents?.hasData);
                        }
                        
                        return elements;
                      }
                      if (line.trim().length > 50) {
                        // Regular paragraphs - substantial text
                        return <p key={lineIndex} className="mb-6 text-gray-700 leading-relaxed text-justify font-normal" style={{
                          marginBottom: '1.5rem',
                          lineHeight: '1.7',
                          textAlign: 'justify',
                          fontSize: '12pt'
                        }}>
                                  {line.trim()}
                                </p>;
                      }
                      if (line.trim().length > 20 && line.trim().length <= 50) {
                        // Shorter content lines - subheadings or brief statements
                        return <p key={lineIndex} className="mb-4 text-gray-800 leading-relaxed font-medium" style={{
                          marginBottom: '1rem',
                          lineHeight: '1.6',
                          fontSize: '11pt',
                          fontWeight: '500'
                        }}>
                                  {line.trim()}
                                </p>;
                      }
                      if (line.trim().length > 0) {
                        // Other content - brief lines
                        return <p key={lineIndex} className="mb-3 text-gray-700 leading-relaxed" style={{
                          marginBottom: '0.75rem',
                          lineHeight: '1.6',
                          fontSize: '12pt'
                        }}>
                                  {line.trim()}
                                </p>;
                      }
                      if (line.trim() === '') {
                        // Empty lines for spacing
                        return <div key={lineIndex} style={{
                          height: '0.5rem'
                        }}></div>;
                      }
                      return null;
                    });
                  })()}
                     </div>
                  </div>
                </div>}
            </div>)}
        </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { 
            margin: 0 !important; 
            padding: 0 !important;
            background: white !important;
            font-family: 'Times New Roman', serif !important;
            font-size: 12pt !important;
            line-height: 1.5 !important;
            color: black !important;
          }
          
          .page-break { 
            page-break-after: always !important;
            width: 210mm !important;
            min-height: 267mm !important; /* Adjusted height for 15mm margins */
            height: auto !important;
            padding: 15mm !important; /* 15mm padding */
            margin: 15mm !important; /* 15mm margin */
            box-sizing: border-box !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            display: block !important;
          }
          
          .page-break:last-child { 
            page-break-after: avoid !important; 
          }
          
          /* Remove all spacing between pages in print */
          .space-y-12 > * + * { 
            margin-top: 0 !important; 
          }
          
          /* Ensure consistent text styling in print */
          p {
            margin-bottom: 12pt !important;
            text-align: justify !important;
            line-height: 1.5 !important;
            font-size: 12pt !important;
            color: black !important;
          }
          
          h1, h2, h3 {
            color: black !important;
            page-break-after: avoid !important;
            margin-top: 18pt !important;
            margin-bottom: 12pt !important;
          }
          
          h1 {
            font-size: 18pt !important;
            font-weight: bold !important;
          }
          
          h2 {
            font-size: 16pt !important;
            font-weight: bold !important;
            border-bottom: 1pt solid black !important;
            padding-bottom: 6pt !important;
          }
          
          h3 {
            font-size: 14pt !important;
            font-weight: bold !important;
          }
          
          /* Background colors */
          .bg-gray-100, .bg-gray-50 {
            background: white !important;
          }
          
          /* Header and footer styling */
          .absolute {
            position: relative !important;
          }
          
          /* Page header and footer adjustments for print */
          .page-break .absolute:first-child {
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            margin-bottom: 20mm !important;
          }
          
          .page-break .absolute:last-child {
            position: relative !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            margin-top: 20mm !important;
          }
        }
        
        @page {
          size: A4 portrait;
          margin: 15mm; /* 15mm margin on all sides */
        }
        
        /* Ensure proper page structure */
        .report-content {
          widows: 2;
          orphans: 2;
        }
        
        .report-content p {
          page-break-inside: avoid;
        }
        
        .report-content h1, 
        .report-content h2, 
        .report-content h3 {
          page-break-after: avoid;
          page-break-inside: avoid;
        }
      `}</style>
    </div>;
};