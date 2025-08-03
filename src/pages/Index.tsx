import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Attendee } from "@/components/TeamAttendeesDisplay";
import { DashboardSection } from "@/components/DashboardSection";
import { ActionsLog, ActionLogEntry } from "@/components/ActionsLog";
import { RobustMeetingSummary } from "@/components/RobustMeetingSummary";
import { KeyDocumentTracker, DocumentData } from "@/components/KeyDocumentTracker";
import { StatusItemData } from "@/components/StatusItem";
import { ActionItem } from "@/components/ActionForm";
import { StatusType } from "@/components/StatusBadge";
import { Users, Target, BarChart3, FileText, Heart, Shield, Calendar, UserCheck, ClipboardList, HeartHandshake, TrendingUp, Save, Download, ChevronDown, ChevronUp, Copy, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  // Check if user has edit permissions
  const canEdit = profile?.permission === 'edit' || profile?.permission === 'company_admin' || profile?.role === 'admin';

  // Header data state (simplified without purpose)
  const [headerData, setHeaderData] = useState({
    date: (() => {
      const now = new Date();
      return now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) + ' ' + now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    })(),
    title: "Management Meeting",
    attendees: [] as Attendee[]
  });

  // Data change handler (simplified)
  const handleDataChange = async (field: string, value: string) => {
    const updatedHeaderData = { ...headerData, [field]: value };
    setHeaderData(updatedHeaderData);
    // TODO: Add save logic if needed
  };

  // Attendees change handler (simplified)
  const handleAttendeesChange = async (attendees: Attendee[]) => {
    const updatedHeaderData = { ...headerData, attendees };
    setHeaderData(updatedHeaderData);
    // TODO: Add save logic if needed
  };

  // Placeholder dashboard data
  const [dashboardData] = useState({
    sections: [{
      id: "staff",
      title: "Staff",
      icon: <Users className="w-6 h-6 text-blue-600" />,
      items: []
    }]
  });

  // Placeholder states
  const [actionsLog] = useState<ActionLogEntry[]>([]);
  const [keyDocuments] = useState<DocumentData[]>([]);

  // Meeting data for the robust summary component
  const meetingData = {
    title: headerData.title,
    date: headerData.date,
    attendees: headerData.attendees,
    sections: dashboardData.sections,
    actionsLog: actionsLog,
    purpose: "" // Will be managed by RobustMeetingSummary
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Management Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Main Dashboard Container */}
      <div id="dashboard-container" className="space-y-6">
        {/* Dashboard Header - Simplified without purpose */}
        <DashboardHeader 
          date={headerData.date} 
          title={headerData.title} 
          attendees={headerData.attendees} 
          purpose="" // Remove purpose from header
          stats={{ green: 0, amber: 0, red: 0 }}
          sections={dashboardData.sections}
          actionsLog={actionsLog}
          onDataChange={canEdit ? handleDataChange : undefined}
          onAttendeesChange={canEdit ? handleAttendeesChange : undefined}
          readOnly={!canEdit}
        />

        {/* New Robust Meeting Summary Component */}
        <RobustMeetingSummary
          meetingDate={headerData.date}
          meetingData={meetingData}
          readOnly={!canEdit}
        />

        {/* Actions Log */}
        <ActionsLog 
          actions={actionsLog}
          onActionComplete={undefined}
          onActionDelete={undefined}
          onActionUndo={undefined}
          onResetActions={undefined}
          onActionEdit={undefined}
          attendees={headerData.attendees.map(a => a.name)}
          onPanelStateChange={undefined}
          panelStateTracker={0}
          readOnly={!canEdit}
          currentUsername={profile?.username}
        />

        {/* Key Documents */}
        <KeyDocumentTracker 
          documents={keyDocuments}
          onDocumentsChange={undefined}
          readOnly={!canEdit}
        />

        {/* Dashboard Sections */}
        {dashboardData.sections.map((section) => (
          <DashboardSection 
            key={section.id}
            title={section.title}
            items={section.items}
            onItemStatusChange={undefined}
            onItemObservationChange={undefined}
            onItemTrendsThemesChange={undefined}
            onItemActionsChange={undefined}
            onItemDocumentsChange={undefined}
            onItemMetadataChange={undefined}
            onActionCreated={undefined}
            onSubsectionActionEdit={undefined}
            onSubsectionActionComplete={undefined}
            onSubsectionActionDelete={undefined}
            attendees={headerData.attendees.map(a => a.name)}
            meetingDate={new Date(headerData.date)}
            meetingId={null}
            onPanelStateChange={undefined}
            panelStateTracker={0}
            readOnly={!canEdit}
          />
        ))}
      </div>
    </div>
  );
};

export default Index;