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

  // Condense meeting data to reduce token count - only keep essential information
  const extractMeetingNarratives = (meetings: any[]): MeetingNarrative[] => {
    console.log('🔍 Extracting condensed narratives from meetings:', meetings.length);
    return meetings.map(meeting => {
      const sectionUpdates = meeting.sections?.map((section: any) => {
        // Filter out items with no meaningful content
        const meaningfulItems = section.items?.filter((item: any) => {
          const hasObservation = item.observation && item.observation.trim().length > 0;
          const hasTrend = item.trendAnalysis && item.trendAnalysis.trim().length > 0;
          const hasActions = item.actions && item.actions.length > 0;
          return hasObservation || hasTrend || hasActions;
        }) || [];
        
        return {
          sectionName: section.title || section.name || 'Unknown Section',
          subsectionUpdates: meaningfulItems.map((item: any) => ({
            name: item.title || item.name || 'Unknown Item',
            status: item.status || 'unknown',
            // Truncate very long observations to 500 chars
            latestUpdate: (item.observation || item.latest_update || '').slice(0, 500),
            trendAnalysis: (item.trendAnalysis || item.trend_analysis || '').slice(0, 300),
            // Simplify actions to just text and assignee
            actions: (item.actions || []).slice(0, 5).map((a: any) => ({
              text: typeof a === 'string' ? a : (a.text || a.action_text || ''),
              assignee: a.assignee || a.mentioned_attendee || ''
            }))
          }))
        };
      }).filter((s: any) => s.subsectionUpdates.length > 0) || []; // Remove empty sections
      
      return {
        date: meeting.date,
        title: meeting.title,
        sectionUpdates
      };
    }).filter(m => m.sectionUpdates.length > 0); // Remove meetings with no content
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

      // Build simplified context - only include non-zero counts
      const context = {
        dashboardRAG: combinedDashboardTotals,
        inspectionRAG: inspectionTotals,
      };

      // Simplified, concise prompt to reduce token count
      const prompt = `Create a quarterly narrative report for ${quarter} ${year} for a UK care service.

RAG STATUS: ${JSON.stringify(context)}

MEETING DATA:
${JSON.stringify(narratives)}

STRUCTURE (use # for major headings, ## for sub-headings):
# Executive Summary
# Staff (Resourcing, Documents, Training, Spot Checks, Supervisions, Meetings)
# Care Planning & Delivery (Care Plans, Service User Documents, Medication, Care Notes, Call Monitoring, Transportation)
# Safety (Incidents/Safeguarding, Risk Register, Infection Control, Information Governance)
# Continuous Improvement (Feedback, Audits)
# Successes and Achievements
# Learning Opportunities and Challenges
# Next Steps

RULES:
- Use SPECIFIC names, dates, actions from the data
- If a section has no data, write: "No discussion recorded for ${quarter} ${year}."
- Never invent content or use generic phrases
- Write 1500-2500 words in narrative paragraphs
- Never use words "red", "amber", "green"
- Avoid unexplained KPI references like "234 indicators" or "11 inspection lines" - only include figures if you clearly explain what they mean and why they matter
- Use plain language: state what happened, how it was measured, and why it matters`;

      // Use GPT-4.1 which doesn't have reasoning token overhead
      const reportContent = await generateResponse([
        { role: 'system', content: 'Expert UK care service compliance report writer. Only use provided data. Never invent content.' },
        { role: 'user', content: prompt }
      ], 'gpt-4.1-2025-04-14');

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
