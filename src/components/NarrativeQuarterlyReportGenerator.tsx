import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOpenAI } from '@/hooks/useOpenAI';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Eye, Trash2, Loader2 } from 'lucide-react';

interface NarrativeQuarterlyReportGeneratorProps {
  quarter: string;
  year: string;
  meetings: Array<{
    id: string;
    title: string;
    date: string;
    sections: any[];
    actions_log: any[];
  }>;
}

interface MeetingNarrative {
  date: string;
  title: string;
  sectionUpdates: {
    sectionName: string;
    subsectionUpdates: {
      name: string;
      status: string;
      latestUpdate: string;
      trendAnalysis: string;
      actions: any[];
    }[];
  }[];
}

export const NarrativeQuarterlyReportGenerator: React.FC<NarrativeQuarterlyReportGeneratorProps> = ({ 
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

  useEffect(() => {
    checkExistingReport();
  }, [quarter, year, profile?.company_id]);

  const checkExistingReport = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('quarterly_reports')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('quarter', quarter)
        .eq('year', parseInt(year))
        .single();

      if (data && !error) {
        setHasGeneratedReport(true);
      } else {
        setHasGeneratedReport(false);
        // Check local storage as fallback
        const localReport = localStorage.getItem(`quarterly-report-${quarter}-${year}-${profile.company_id}`);
        if (localReport) {
          setHasGeneratedReport(true);
        }
      }
    } catch (error) {
      console.error('Error checking existing report:', error);
      setHasGeneratedReport(false);
    }
  };

  const extractMeetingNarratives = (meetings: any[]): MeetingNarrative[] => {
    return meetings.map(meeting => {
      const sectionUpdates = meeting.sections?.map((section: any) => ({
        sectionName: section.title || section.name || 'Unknown Section',
        subsectionUpdates: section.subsections?.map((subsection: any) => ({
          name: subsection.title || subsection.name || 'Unknown Subsection',
          status: subsection.status || 'unknown',
          latestUpdate: subsection.latestUpdate || subsection.latest_update || '',
          trendAnalysis: subsection.trendAnalysis || subsection.trend_analysis || '',
          actions: subsection.actions || []
        })) || []
      })) || [];

      return {
        date: meeting.date,
        title: meeting.title,
        sectionUpdates
      };
    });
  };

  const generateNarrativeReport = async () => {
    if (!profile?.company_id) return;

    setIsGenerating(true);
    try {
      const narratives = extractMeetingNarratives(meetings);
      
      // Sort meetings chronologically
      narratives.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const prompt = `You are an expert in care service compliance reporting for UK regulatory bodies including CQC, Ofsted, and local authorities. 

Create a compelling quarterly narrative report for ${quarter} ${year} that tells the story of how this care service performed during this period.

MEETING DATA TO ANALYZE:
${JSON.stringify(narratives, null, 2)}

REPORT REQUIREMENTS:

1. AUDIENCE: Internal stakeholders, CQC, Ofsted, and local authorities
2. STYLE: Professional, narrative-driven, regulatory compliance focused
3. STRUCTURE: Chronological progression showing the service's journey through ${quarter} ${year}

NARRATIVE FRAMEWORK:
Write a flowing narrative that weaves together insights from these key service areas:

• **Staff Management & Development**: Workforce stability, recruitment, training, competency, supervision effectiveness
• **Care Planning & Service Delivery**: Person-centered planning, risk management, documentation quality, medication safety
• **Safety & Safeguarding**: Incident management, risk mitigation, infection control, information governance
• **Quality Improvement**: Feedback integration, audit outcomes, continuous improvement initiatives
• **Supported Housing** (if applicable): Tenancy support, property safety, benefits management

CRITICAL WRITING INSTRUCTIONS:

1. **Tell a Story**: Transform the meeting updates into a compelling narrative about the service's journey through the quarter
2. **Focus on Progression**: Show how challenges evolved, what actions were taken, and what outcomes were achieved
3. **Regulatory Lens**: Frame everything through the lens of quality, safety, and person-centered care
4. **Evidence-Based**: Base all content strictly on the meeting data provided - never invent information
5. **Professional Tone**: Use language appropriate for regulatory and senior stakeholder audiences
6. **Connect the Dots**: Show relationships between different areas (e.g., how staff training impacts care quality)
7. **Highlight Improvements**: Demonstrate commitment to continuous improvement and learning
8. **Action Orientation**: Show how the service identifies issues and takes decisive action

CONTENT RULES:
- Transform status indicators into meaningful insights about service quality
- Convert action items into evidence of proactive management and improvement
- If information is not available for a section, simply omit it rather than stating it's unavailable
- Focus on the human impact - what these developments mean for service users and staff
- Maintain truthfulness while presenting information in the most positive appropriate light

Write approximately 1500-2500 words that regulatory bodies would find comprehensive and reassuring about the service's commitment to quality and continuous improvement.`;

      const reportContent = await generateResponse([
        { role: 'system', content: 'You are an expert care service compliance report writer.' },
        { role: 'user', content: prompt }
      ], 'gpt-4.1-2025-04-14');

      if (reportContent) {
        // Save to Supabase
        const { error: supabaseError } = await supabase
          .from('quarterly_reports')
          .upsert({
            company_id: profile.company_id,
            quarter,
            year: parseInt(year),
            report_content: reportContent,
            analytics_data: JSON.parse(JSON.stringify({ narratives, generatedAt: new Date().toISOString() }))
          });

        if (supabaseError) {
          console.error('Supabase error:', supabaseError);
          // Fallback to local storage
          localStorage.setItem(
            `quarterly-report-${quarter}-${year}-${profile.company_id}`,
            JSON.stringify({ content: reportContent, generatedAt: new Date().toISOString() })
          );
        }

        setHasGeneratedReport(true);
        toast({
          title: "Report Generated Successfully",
          description: `Your narrative quarterly report for ${quarter} ${year} has been created.`,
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const viewReport = () => {
    navigate(`/quarterly-report?quarter=${quarter}&year=${year}`);
  };

  const deleteReport = async () => {
    if (!profile?.company_id) return;

    try {
      const { error } = await supabase
        .from('quarterly_reports')
        .delete()
        .eq('company_id', profile.company_id)
        .eq('quarter', quarter)
        .eq('year', parseInt(year));

      if (error) {
        console.error('Error deleting report:', error);
      }

      // Also remove from local storage
      localStorage.removeItem(`quarterly-report-${quarter}-${year}-${profile.company_id}`);
      
      setHasGeneratedReport(false);
      toast({
        title: "Report Deleted",
        description: "The quarterly report has been removed.",
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Deletion Failed",
        description: "There was an error deleting the report.",
        variant: "destructive",
      });
    }
  };

  if (hasGeneratedReport) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <FileText className="h-5 w-5" />
            Narrative Report Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 mb-4">
            A comprehensive narrative quarterly report for {quarter} {year} has been generated.
          </p>
          <div className="flex gap-2">
            <Button onClick={viewReport} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View Report
            </Button>
            <Button 
              variant="outline" 
              onClick={deleteReport}
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Report
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate Narrative Quarterly Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Create a comprehensive narrative report for {quarter} {year} that transforms your meeting data 
          into a compelling story for regulatory bodies and stakeholders.
        </p>
        <div className="text-sm text-muted-foreground mb-4">
          <strong>Report will include:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Chronological narrative of service developments</li>
            <li>Evidence of quality improvement initiatives</li>
            <li>Regulatory compliance focus</li>
            <li>Professional tone suitable for CQC, Ofsted, and local authorities</li>
          </ul>
        </div>
        <Button 
          onClick={generateNarrativeReport} 
          disabled={isGenerating || isLoading}
          className="w-full"
        >
          {(isGenerating || isLoading) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Narrative Report...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Generate Narrative Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};