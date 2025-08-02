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
  useEffect(() => {
    checkExistingReport();
  }, [quarter, year, profile?.company_id]);
  const checkExistingReport = async () => {
    if (!profile?.company_id) return;
    try {
      const {
        data,
        error
      } = await supabase.from('quarterly_reports').select('*').eq('company_id', profile.company_id).eq('quarter', quarter).eq('year', parseInt(year)).single();
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
    console.log('🔍 Extracting narratives from meetings:', meetings.length);
    return meetings.map(meeting => {
      console.log('📋 Processing meeting:', meeting.title, meeting.date);
      const sectionUpdates = meeting.sections?.map((section: any) => {
        console.log(`📝 Section: ${section.title}, Items: ${section.items?.length || 0}`);
        return {
          sectionName: section.title || section.name || 'Unknown Section',
          subsectionUpdates: section.items?.map((item: any) => {
            if (item.observation) {
              console.log(`✏️ Found observation in ${item.title}: "${item.observation}"`);
            }
            return {
              name: item.title || item.name || 'Unknown Item',
              status: item.status || 'unknown',
              latestUpdate: item.observation || item.latest_update || '',
              lastReviewed: item.lastReviewed || '',
              actions: item.actions || []
            };
          }) || []
        };
      }) || [];
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
3. STRUCTURE: Follow the exact structure below with these headings and subheadings
4. FORMAT: Use markdown formatting for headings only - # for major sections, ## for subsections
5. FORMATTING: Major headings use # and minor headings use ##

REQUIRED REPORT STRUCTURE (in this exact order):

Executive Summary

Staff
- Resourcing
- Staff Documents  
- Training
- Spot Checks
- Staff Supervisions
- Staff Meetings

Care Planning & Delivery (Changes to "Support Planning & Delivery" for companies with only Supported Housing services)
- Care Plans & Risk Assessments (becomes "Support Plans & Risk Assessments" for supported housing)
- Service User Documents
- Medication Management
- Care Notes
- Call Monitoring
- Transportation

Safety
- Incidents, Accidents and Safeguarding
- Risk Register
- Infection Control
- Information Governance

Continuous Improvement
- Feedback
- Audits

Successes and Achievements

Learning Opportunities and Challenges

Next Steps

CRITICAL WRITING INSTRUCTIONS:

1. Use ONLY the headings and subheadings provided above
2. Format major section headings with # (e.g., "# Executive Summary")
3. Format minor headings (subheadings) with ## (e.g., "## Resourcing")
4. Write all content in natural paragraph format without other markdown
5. Tell a compelling narrative about the service's overall journey through the quarter
6. Focus on progression showing how challenges evolved and what actions were taken
7. Frame everything through the lens of quality, safety, and person-centered care
8. Base all content strictly on the meeting data provided - never invent information
9. Use professional language appropriate for regulatory and senior stakeholder audiences
10. Show relationships between different areas and demonstrate continuous improvement
11. Transform status indicators into meaningful insights about service quality
12. DO NOT make specific references to individual names - focus on how the service overall performed
13. DO NOT use "red", "amber", or "green" status language - instead use professional terms like "critical", "risk", "positive", "excellent", "concerning", "satisfactory"
14. DO NOT mention anything related to Supported Housing unless explicitly present in the meeting data
15. If information is not available for a section, simply omit that section
16. NOTE: Interactive 12-month analytics charts will be automatically included in the "## Feedback" and "## Incidents, Accidents and Safeguarding" sections - do not reference these charts in your written content as they are added automatically

Write approximately 1500-2500 words using only plain text formatting that regulatory bodies would find comprehensive and reassuring about the service's commitment to quality and continuous improvement.`;
      const reportContent = await generateResponse([{
        role: 'system',
        content: 'You are an expert care service compliance report writer.'
      }, {
        role: 'user',
        content: prompt
      }], 'gpt-4.1-2025-04-14');
      if (reportContent) {
        // Save to Supabase
        const {
          error: supabaseError
        } = await supabase.from('quarterly_reports').upsert({
          company_id: profile.company_id,
          quarter,
          year: parseInt(year),
          report_content: reportContent,
          analytics_data: JSON.parse(JSON.stringify({
            narratives,
            generatedAt: new Date().toISOString()
          }))
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
          title: "Report Generated Successfully",
          description: `Your narrative quarterly report for ${quarter} ${year} has been created.`
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating the report. Please try again.",
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
    if (!profile?.company_id) return;
    try {
      const {
        error
      } = await supabase.from('quarterly_reports').delete().eq('company_id', profile.company_id).eq('quarter', quarter).eq('year', parseInt(year));
      if (error) {
        console.error('Error deleting report:', error);
      }

      // Also remove from local storage
      localStorage.removeItem(`quarterly-report-${quarter}-${year}-${profile.company_id}`);
      setHasGeneratedReport(false);
      toast({
        title: "Report Deleted",
        description: "The quarterly report has been removed."
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Deletion Failed",
        description: "There was an error deleting the report.",
        variant: "destructive"
      });
    }
  };
  if (hasGeneratedReport) {
    return <Card className="bg-transparent border-0">
        
        <CardContent className="bg-transparent">
          
          <div className="flex gap-2">
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
      </Card>;
  }
  return <Card className="bg-transparent border-0 shadow-none">
      
      <CardContent>
        
        
        <Button onClick={generateNarrativeReport} disabled={isGenerating || isLoading} className="w-full">
          {isGenerating || isLoading ? <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Narrative Report...
            </> : <>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </>}
        </Button>
      </CardContent>
    </Card>;
};