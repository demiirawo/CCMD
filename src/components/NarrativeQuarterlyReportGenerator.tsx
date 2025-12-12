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
    document_url?: string;
  }>;
}

interface MeetingNarrative {
  date: string;
  title: string;
  documentUrl?: string;
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
              trendAnalysis: item.trendAnalysis || item.trend_analysis || '',
              lastReviewed: item.lastReviewed || '',
              actions: item.actions || []
            };
          }) || []
        };
      }) || [];
      return {
        date: meeting.date,
        title: meeting.title,
        documentUrl: meeting.document_url,
        sectionUpdates
      };
    });
  };

  const generateNarrativeReport = async () => {
    console.log('🚀 Generate report button clicked');
    console.log('📋 Profile:', profile);
    console.log('🏢 Company ID:', profile?.company_id);
    console.log('📊 Meetings count:', meetings.length);
    
    if (!profile?.company_id) {
      console.error('❌ No company_id found in profile');
      toast({
        title: "Authentication Error",
        description: "Please ensure you're logged in and have a company selected.",
        variant: "destructive"
      });
      return;
    }
    
    if (meetings.length === 0) {
      console.warn('⚠️ No meetings found for this quarter');
      toast({
        title: "No Data Available",
        description: "No meetings found for this quarter to generate a report from.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);

    try {
      // 1) Meeting narratives from Dashboard (management meetings)
      const narratives = extractMeetingNarratives(meetings);
      // Sort meetings chronologically
      narratives.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Helper to count G/A/R
      const initCounts = () => ({ green: 0, amber: 0, red: 0 });
      const sumCounts = (a: any, b: any) => ({
        green: (a.green || 0) + (b.green || 0),
        amber: (a.amber || 0) + (b.amber || 0),
        red: (a.red || 0) + (b.red || 0),
      });

      // 2) Dashboard item-level RAG (exclude meeting-overview like the top summary)
      const dashboardItemCounts = initCounts();
      try {
        meetings?.forEach((m: any) => {
          (m.sections || []).forEach((section: any) => {
            if (section?.id === 'meeting-overview') return;
            (section.items || []).forEach((it: any) => {
              if (it?.status === 'green') dashboardItemCounts.green++;
              else if (it?.status === 'amber') dashboardItemCounts.amber++;
              else if (it?.status === 'red') dashboardItemCounts.red++;
            });
          });
        });
      } catch (e) {
        console.warn('Failed to compute dashboard item counts', e);
      }

      // 3) Actions RAG from actions_log
      const actionsCounts = initCounts();
      // 4) Key Review Dates RAG from key_documents (due_date-based)
      const keyDocsCounts = initCounts();

      // 5) Inspection evidence category RAG (CQC readiness checklist)
      const inspectionTotals = initCounts();
      let inspectionCategoriesSummary: Array<{ id: string; name: string; status: 'green' | 'amber' | 'red' }> = [];

      // Fetch in parallel for efficiency
      const [actionsRes, keyDocsRes, categoriesRes, evidenceRes, responsesRes] = await Promise.all([
        supabase.from('actions_log').select('status').eq('company_id', profile.company_id),
        supabase.from('key_documents').select('id, name, due_date').eq('company_id', profile.company_id),
        supabase.from('inspection_categories').select('id, name'),
        supabase.from('inspection_evidence').select('id, category_id'),
        supabase.from('inspection_company_responses').select('evidence_id, status, company_id').eq('company_id', profile.company_id),
      ]);

      // Actions counts
      if (!actionsRes.error && Array.isArray(actionsRes.data)) {
        actionsRes.data.forEach((a: any) => {
          if (a.status === 'green') actionsCounts.green++;
          else if (a.status === 'amber') actionsCounts.amber++;
          else if (a.status === 'red') actionsCounts.red++;
        });
      } else if (actionsRes.error) {
        console.warn('actions_log query error:', actionsRes.error);
      }

      // Key document counts based on due_date proximity
      const statusFromDueDate = (due: string | null): 'green' | 'amber' | 'red' => {
        if (!due) return 'green';
        const today = new Date();
        const review = new Date(due);
        if (isNaN(review.getTime())) return 'green';
        // Compare by date (ignore time)
        today.setHours(0, 0, 0, 0);
        review.setHours(0, 0, 0, 0);
        const diffDays = Math.round((review.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'red'; // overdue
        if (diffDays <= 5) return 'amber'; // due soon
        return 'green';
      };
      if (!keyDocsRes.error && Array.isArray(keyDocsRes.data)) {
        keyDocsRes.data.forEach((doc: any) => {
          const s = statusFromDueDate(doc?.due_date ?? null);
          if (s === 'green') keyDocsCounts.green++;
          else if (s === 'amber') keyDocsCounts.amber++;
          else if (s === 'red') keyDocsCounts.red++;
        });
      } else if (keyDocsRes.error) {
        console.warn('key_documents query error:', keyDocsRes.error);
      }

      // Inspection categories summary
      if (!categoriesRes.error && !evidenceRes.error && !responsesRes.error && Array.isArray(categoriesRes.data)) {
        const evidences: Array<{ id: string; category_id: string }> = Array.isArray(evidenceRes.data) ? evidenceRes.data as any : [];
        const responses: Array<{ evidence_id: string; status: 'green' | 'amber' | 'red' }> = Array.isArray(responsesRes.data) ? (responsesRes.data as any).map((r: any) => ({ evidence_id: r.evidence_id, status: r.status })) : [];
        inspectionCategoriesSummary = categoriesRes.data.map((cat: any) => {
          const evIds = evidences.filter(ev => ev.category_id === cat.id).map(ev => ev.id);
          const respForCat = responses.filter(r => evIds.includes(r.evidence_id));
          let status: 'green' | 'amber' | 'red' = 'green';
          if (respForCat.some(r => r.status === 'red')) status = 'red';
          else if (respForCat.some(r => r.status === 'amber')) status = 'amber';
          // else remains green
          return { id: cat.id, name: cat.name, status };
        });
        // Totals
        inspectionCategoriesSummary.forEach(c => {
          if (c.status === 'green') inspectionTotals.green++;
          else if (c.status === 'amber') inspectionTotals.amber++;
          else if (c.status === 'red') inspectionTotals.red++;
        });
      } else {
        if (categoriesRes.error) console.warn('inspection_categories query error:', categoriesRes.error);
        if (evidenceRes.error) console.warn('inspection_evidence query error:', evidenceRes.error);
        if (responsesRes.error) console.warn('inspection_company_responses query error:', responsesRes.error);
      }

      const combinedDashboardTotals = sumCounts(sumCounts(dashboardItemCounts, actionsCounts), keyDocsCounts);

      // Build explicit context to guide the AI
      const context = {
        clarification: {
          dashboard: 'The Dashboard is a recording of our management meetings (decisions, updates, actions).',
          inspection: 'The Inspection page is a checklist to verify our readiness for a CQC inspection (evidence categories and compliance).',
        },
        dashboardRAG: {
          items: dashboardItemCounts,
          actions: actionsCounts,
          keyReviewDates: keyDocsCounts,
          combinedTotals: combinedDashboardTotals,
        },
        inspectionRAG: {
          totals: inspectionTotals,
          categories: inspectionCategoriesSummary,
        },
      };

      const prompt = `You are an expert in care service compliance reporting for UK regulatory bodies including CQC, Ofsted, and local authorities.

Create a compelling quarterly narrative report for ${quarter} ${year} that tells the story of how this care service performed during this period.

SOURCE CONTEXT (do not repeat verbatim, use it to inform analysis):
${JSON.stringify(context, null, 2)}

MEETING DATA TO ANALYZE (Dashboard = management meetings record):
${JSON.stringify(narratives, null, 2)}

CRITICAL INSTRUCTIONS FOR USING MEETING DATA:

1. **USE ACTUAL HEADINGS FROM MEETINGS**: The report structure MUST be based on the section and subsection headings found in the meeting data. If a meeting has sections like "Staff", "Care Planning", "Safety", etc., use those exact headings.

2. **REFERENCE SPECIFIC NAMES AND DATES**: When the meeting data mentions specific staff names, service user references, dates, deadlines, or document names - USE THEM in the report. For example:
   - If an action mentions "John to complete DBS check by 15th January" - reference this specifically
   - If a training record mentions "Sarah completed medication training on 12/12/2024" - include this detail
   - If a meeting was held on a specific date with specific attendees - reference this

3. **HANDLE EMPTY SECTIONS HONESTLY**: If a section or subsection has NO latestUpdate, NO trendAnalysis, NO actions, and NO observations recorded for this quarter, you MUST write: "There was no discussion recorded for this area during ${quarter} ${year}." DO NOT invent or assume content.

4. **AVOID GENERIC LANGUAGE**: Do NOT use phrases like:
   - "The team continues to perform well"
   - "Good progress has been made"
   - "Training remains a priority"
   Unless there is SPECIFIC data to support these statements. Instead, cite actual updates, actions, or observations from the meetings.

REPORT REQUIREMENTS:

1. AUDIENCE: Internal stakeholders, CQC, Ofsted, and local authorities
2. STYLE: Professional, narrative-driven, regulatory compliance focused
3. STRUCTURE: Follow the structure below, but ONLY include sections that have actual data from meetings
4. FORMAT: Use markdown formatting for headings only - # for major sections, ## for subsections

DATA INPUTS TO CONSIDER:
- Latest Update, Trend Analysis, Actions, and any attached documents from meetings
- RAG summaries from the Dashboard (items, actions, key review dates) — convert to professional language (do not say "red/amber/green")
- Inspection checklist (CQC readiness) category statuses to evidence preparedness
- SPECIFIC dates, names, and details mentioned in meeting observations

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
2. Format major section headings with # and minor headings with ##
3. Write all content in natural paragraph format without other markdown
4. Tell a compelling narrative about the service's overall journey through the quarter
5. Focus on progression showing how challenges evolved and what actions were taken
6. Frame everything through the lens of quality, safety, and person-centered care
7. Base all content STRICTLY on the provided data — NEVER invent information or make assumptions
8. Use professional language appropriate for regulatory and senior stakeholder audiences
9. Show relationships between different areas and demonstrate continuous improvement
10. Transform RAG indicators into meaningful insights — DO NOT use the words "red", "amber", or "green"
11. Reference SPECIFIC staff names, dates, and actions mentioned in the meeting data
12. DO NOT mention anything related to Supported Housing unless explicitly present in the data
13. If a subsection has no recorded discussion or updates for this quarter, explicitly state: "There was no discussion recorded for this area during ${quarter} ${year}."
14. NOTE: Interactive 12-month analytics charts will be automatically included in Feedback and Incidents sections — do not reference charts explicitly.

Write approximately 1500-2500 words using only plain text. Be specific, cite actual data, and acknowledge when information is not available.`;

      const reportContent = await generateResponse([
        { role: 'system', content: 'You are an expert care service compliance report writer. You ONLY use data that is explicitly provided to you. You NEVER invent, assume, or generate generic content. When sections have no data, you clearly state that no discussion was recorded. You always reference specific names, dates, and details from the provided meeting data.' },
        { role: 'user', content: prompt }
      ], 'gpt-5-2025-08-07');

      if (reportContent) {
        // Save to Supabase with additional analytics/context
        const { error: supabaseError } = await supabase.from('quarterly_reports').upsert({
          company_id: profile.company_id,
          quarter,
          year: parseInt(year),
          report_content: reportContent,
          analytics_data: JSON.parse(JSON.stringify({
            narratives,
            ragSummary: context,
            generatedAt: new Date().toISOString(),
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
          title: 'Report Generated Successfully',
          description: `Your narrative quarterly report for ${quarter} ${year} has been created.`
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Generation Failed',
        description: 'There was an error generating the report. Please try again.',
        variant: 'destructive'
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
        <Button onClick={generateNarrativeReport} disabled={isGenerating || isLoading} className="w-full">
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
