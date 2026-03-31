import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface DashboardMeetingAnalyticsPreviewProps {
  meetingId: string;
}

interface ResourcingData {
  onboarding: number;
  on_probation: number;
  active: number;
}

export const DashboardMeetingAnalyticsPreview: React.FC<DashboardMeetingAnalyticsPreviewProps> = ({ meetingId }) => {
  const { profile } = useAuth();

  const [hasData, setHasData] = useState({
    resourcing: false,
    supervisions: false,
    spotChecks: false,
    staffTraining: false,
    staffDocuments: false,
    feedback: false,
    incidents: false,
  });

  const [resourcing, setResourcing] = useState<ResourcingData | null>(null);
  const [supervisionsOverdue, setSupervisionsOverdue] = useState<number>(0);
  const [spotChecksOverdue, setSpotChecksOverdue] = useState<number>(0);
  const [staffTraining, setStaffTraining] = useState({
    onboardingCompliant: 0,
    onProbationCompliant: 0,
    activeCompliant: 0,
  });
  const [staffDocuments, setStaffDocuments] = useState({
    onboardingCompliant: 0,
    onProbationCompliant: 0,
    activeCompliant: 0,
  });
  const [feedbackTotals, setFeedbackTotals] = useState({
    compliments: 0,
    complaints: 0,
    suggestions: 0,
    resolved: 0,
  });
  const [incidentTotals, setIncidentTotals] = useState({
    incidents: 0,
    accidents: 0,
    safeguarding: 0,
    resolved: 0,
  });

  useEffect(() => {
    if (!profile?.company_id) return;

    // Load all analytics in parallel
    const loadAll = async () => {
      const companyId = profile.company_id as string;

      // Resourcing overview (no meeting_id column)
      const resourcingPromise = supabase
        .from("resourcing_overview")
        .select("onboarding, on_probation, active")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false })
        .limit(1);

      // Supervisions (meeting-scoped)
      const supervisionsPromise = supabase
        .from("supervision_analytics")
        .select("monthly_data, updated_at")
        .eq("company_id", companyId)
        .eq("meeting_id", meetingId)
        .order("updated_at", { ascending: false })
        .limit(1);

      // Spot checks (meeting-scoped)
      const spotChecksPromise = supabase
        .from("spot_check_analytics")
        .select("monthly_data, updated_at")
        .eq("company_id", companyId)
        .eq("meeting_id", meetingId)
        .order("updated_at", { ascending: false })
        .limit(1);

      // Staff training (no meeting_id)
      const staffTrainingPromise = supabase
        .from("staff_training_analytics")
        .select("training_data, updated_at")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false })
        .limit(1);

      // Staff documents (no meeting_id)
      const staffDocsPromise = supabase
        .from("staff_documents_analytics")
        .select("documents_data, updated_at")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false })
        .limit(1);

      // Feedback (meeting-scoped)
      const feedbackPromise = supabase
        .from("feedback_analytics")
        .select("monthly_data, updated_at")
        .eq("company_id", companyId)
        .eq("meeting_id", meetingId)
        .order("updated_at", { ascending: false })
        .limit(1);

      // Incidents (meeting-scoped)
      const incidentsPromise = supabase
        .from("incidents_analytics")
        .select("monthly_data, updated_at")
        .eq("company_id", companyId)
        .eq("meeting_id", meetingId)
        .order("updated_at", { ascending: false })
        .limit(1);

      const [resourcingRes, supervisionsRes, spotChecksRes, staffTrainingRes, staffDocsRes, feedbackRes, incidentsRes] = await Promise.all([
        resourcingPromise,
        supervisionsPromise,
        spotChecksPromise,
        staffTrainingPromise,
        staffDocsPromise,
        feedbackPromise,
        incidentsPromise,
      ]);

      // Resourcing
      if (resourcingRes.data && resourcingRes.data[0]) {
        const r = resourcingRes.data[0] as any;
        const rData: ResourcingData = {
          onboarding: r.onboarding || 0,
          on_probation: r.on_probation || 0,
          active: r.active || 0,
        };
        setResourcing(rData);
        if ((rData.onboarding || rData.on_probation || rData.active) > 0) {
          setHasData((prev) => ({ ...prev, resourcing: true }));
        }
      }

      // Supervisions
      if (supervisionsRes.data && supervisionsRes.data[0]) {
        const sd = (supervisionsRes.data[0] as any).monthly_data || {};
        const overdue = Number(sd.overdueSupervisions || 0);
        setSupervisionsOverdue(overdue);
        if (overdue > 0) setHasData((prev) => ({ ...prev, supervisions: true }));
      }

      // Spot checks
      if (spotChecksRes.data && spotChecksRes.data[0]) {
        const sc = (spotChecksRes.data[0] as any).monthly_data || {};
        const overdue = Number(sc.overdueSpotChecks || 0);
        setSpotChecksOverdue(overdue);
        if (overdue > 0) setHasData((prev) => ({ ...prev, spotChecks: true }));
      }

      // Staff training
      if (staffTrainingRes.data && staffTrainingRes.data[0]) {
        const td = (staffTrainingRes.data[0] as any).training_data || {};
        const has = (Number(td.onboardingCompliant || 0) + Number(td.onProbationCompliant || 0) + Number(td.activeCompliant || 0)) > 0;
        setStaffTraining({
          onboardingCompliant: Number(td.onboardingCompliant || 0),
          onProbationCompliant: Number(td.onProbationCompliant || 0),
          activeCompliant: Number(td.activeCompliant || 0),
        });
        if (has) setHasData((prev) => ({ ...prev, staffTraining: true }));
      }

      // Staff documents
      if (staffDocsRes.data && staffDocsRes.data[0]) {
        const dd = (staffDocsRes.data[0] as any).documents_data || {};
        const has = (Number(dd.onboardingCompliant || 0) + Number(dd.onProbationCompliant || 0) + Number(dd.activeCompliant || 0)) > 0;
        setStaffDocuments({
          onboardingCompliant: Number(dd.onboardingCompliant || 0),
          onProbationCompliant: Number(dd.onProbationCompliant || 0),
          activeCompliant: Number(dd.activeCompliant || 0),
        });
        if (has) setHasData((prev) => ({ ...prev, staffDocuments: true }));
      }

      // Feedback
      if (feedbackRes.data && feedbackRes.data[0]) {
        const arr = (feedbackRes.data[0] as any).monthly_data as any[];
        if (Array.isArray(arr)) {
          const totals = arr.reduce(
            (acc, m) => ({
              compliments: acc.compliments + (m.compliments || 0),
              complaints: acc.complaints + (m.complaints || 0),
              suggestions: acc.suggestions + (m.suggestions || 0),
              resolved: acc.resolved + (m.resolved || 0),
            }),
            { compliments: 0, complaints: 0, suggestions: 0, resolved: 0 }
          );
          setFeedbackTotals(totals);
          if (totals.compliments + totals.complaints + totals.suggestions + totals.resolved > 0) {
            setHasData((prev) => ({ ...prev, feedback: true }));
          }
        }
      }

      // Incidents
      if (incidentsRes.data && incidentsRes.data[0]) {
        const arr = (incidentsRes.data[0] as any).monthly_data as any[];
        if (Array.isArray(arr)) {
          const totals = arr.reduce(
            (acc, m) => ({
              incidents: acc.incidents + (m.incidents || 0),
              accidents: acc.accidents + (m.accidents || 0),
              safeguarding: acc.safeguarding + (m.safeguarding || 0),
              resolved: acc.resolved + (m.resolved || 0),
            }),
            { incidents: 0, accidents: 0, safeguarding: 0, resolved: 0 }
          );
          setIncidentTotals(totals);
          if (totals.incidents + totals.accidents + totals.safeguarding + totals.resolved > 0) {
            setHasData((prev) => ({ ...prev, incidents: true }));
          }
        }
      }
    };

    loadAll();
  }, [profile?.company_id, meetingId]);

  const totalStaff = (resourcing?.onboarding || 0) + (resourcing?.on_probation || 0) + (resourcing?.active || 0);
  const supervisionCompliance = totalStaff > 0 ? Math.round(((totalStaff - supervisionsOverdue) / totalStaff) * 100) : null;
  const spotCheckCompliance = totalStaff > 0 ? Math.round(((totalStaff - spotChecksOverdue) / totalStaff) * 100) : null;

  const showAny = Object.values(hasData).some(Boolean);
  if (!showAny) return null;

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Analytics Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hasData.resourcing && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Resourcing Overview</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex items-center justify-between"><span>Onboarding</span><span className="text-foreground font-medium">{resourcing?.onboarding || 0}</span></div>
              <div className="flex items-center justify-between"><span>On Probation</span><span className="text-foreground font-medium">{resourcing?.on_probation || 0}</span></div>
              <div className="flex items-center justify-between"><span>Active</span><span className="text-foreground font-medium">{resourcing?.active || 0}</span></div>
            </CardContent>
          </Card>
        )}

        {hasData.supervisions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Staff Supervisions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex items-center justify-between"><span>Overdue</span><span className="text-foreground font-medium">{supervisionsOverdue}</span></div>
              {supervisionCompliance !== null && (
                <div className="flex items-center justify-between"><span>Compliance</span><span className="text-foreground font-medium">{supervisionCompliance}%</span></div>
              )}
            </CardContent>
          </Card>
        )}

        {hasData.spotChecks && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Spot Checks</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex items-center justify-between"><span>Overdue</span><span className="text-foreground font-medium">{spotChecksOverdue}</span></div>
              {spotCheckCompliance !== null && (
                <div className="flex items-center justify-between"><span>Compliance</span><span className="text-foreground font-medium">{spotCheckCompliance}%</span></div>
              )}
            </CardContent>
          </Card>
        )}

        {hasData.staffTraining && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Staff Training</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex items-center justify-between"><span>Onboarding Compliant</span><span className="text-foreground font-medium">{staffTraining.onboardingCompliant}</span></div>
              <div className="flex items-center justify-between"><span>On Probation Compliant</span><span className="text-foreground font-medium">{staffTraining.onProbationCompliant}</span></div>
              <div className="flex items-center justify-between"><span>Active Compliant</span><span className="text-foreground font-medium">{staffTraining.activeCompliant}</span></div>
            </CardContent>
          </Card>
        )}

        {hasData.staffDocuments && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Safer Recruitment</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex items-center justify-between"><span>Onboarding Compliant</span><span className="text-foreground font-medium">{staffDocuments.onboardingCompliant}</span></div>
              <div className="flex items-center justify-between"><span>On Probation Compliant</span><span className="text-foreground font-medium">{staffDocuments.onProbationCompliant}</span></div>
              <div className="flex items-center justify-between"><span>Active Compliant</span><span className="text-foreground font-medium">{staffDocuments.activeCompliant}</span></div>
            </CardContent>
          </Card>
        )}

        {hasData.feedback && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Feedback</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex items-center justify-between"><span>Compliments</span><span className="text-foreground font-medium">{feedbackTotals.compliments}</span></div>
              <div className="flex items-center justify-between"><span>Complaints</span><span className="text-foreground font-medium">{feedbackTotals.complaints}</span></div>
              <div className="flex items-center justify-between"><span>Suggestions</span><span className="text-foreground font-medium">{feedbackTotals.suggestions}</span></div>
              <div className="flex items-center justify-between"><span>Resolved</span><span className="text-foreground font-medium">{feedbackTotals.resolved}</span></div>
            </CardContent>
          </Card>
        )}

        {hasData.incidents && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Incidents</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex items-center justify-between"><span>Incidents</span><span className="text-foreground font-medium">{incidentTotals.incidents}</span></div>
              <div className="flex items-center justify-between"><span>Accidents</span><span className="text-foreground font-medium">{incidentTotals.accidents}</span></div>
              <div className="flex items-center justify-between"><span>Safeguarding</span><span className="text-foreground font-medium">{incidentTotals.safeguarding}</span></div>
              <div className="flex items-center justify-between"><span>Resolved</span><span className="text-foreground font-medium">{incidentTotals.resolved}</span></div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
