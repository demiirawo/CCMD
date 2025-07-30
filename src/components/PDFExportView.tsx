import { StatusItemData } from "@/components/StatusItem";
import { ActionItem } from "@/components/ActionForm";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MeetingSummaryPanel } from "@/components/MeetingSummaryPanel";
import { ActionsLog, ActionLogEntry } from "@/components/ActionsLog";
import { KeyDocumentTracker, DocumentData } from "@/components/KeyDocumentTracker";
import { DashboardSection } from "@/components/DashboardSection";
import { Attendee } from "@/components/MeetingAttendeesManager";
import { Users, Calendar, HeartHandshake, Shield, TrendingUp } from "lucide-react";

interface PDFExportViewProps {
  headerData: {
    date: string;
    title: string;
    attendees: Attendee[];
    purpose: string;
  };
  actionsLog: ActionLogEntry[];
  keyDocuments: DocumentData[];
  dashboardData: {
    sections: Array<{
      id: string;
      title: string;
      icon?: React.ReactNode;
      items: StatusItemData[];
    }>;
  };
  stats: {
    green: number;
    amber: number;
    red: number;
  };
  getAttendeesList: () => string[];
  meetingDate: Date;
  meetingId: string;
}

export const PDFExportView = ({
  headerData,
  actionsLog,
  keyDocuments,
  dashboardData,
  stats,
  getAttendeesList,
  meetingDate,
  meetingId
}: PDFExportViewProps) => {
  // Dummy handlers for PDF view (no interactions needed)
  const dummyHandler = () => {};
  const dummyAsyncHandler = async () => {};

  return (
    <div 
      id="pdf-export-container" 
      className="bg-gray-100 p-8"
      style={{
        // Set 10mm margins (approximately 37.8px at 96 DPI)
        margin: '10mm',
        minHeight: '100vh',
        width: 'calc(100% - 20mm)' // Account for left and right margins
      }}
    >
      <div className="w-full mx-auto space-y-6">
        <DashboardHeader 
          date={headerData.date} 
          title={headerData.title} 
          attendees={headerData.attendees}
          purpose={headerData.purpose}
          stats={stats}
          onDataChange={dummyHandler}
          onAttendeesChange={dummyHandler}
        />
        
        <MeetingSummaryPanel 
          purpose={headerData.purpose}
          onPurposeChange={dummyHandler}
        />
        
        <ActionsLog
          actions={actionsLog} 
          onActionComplete={dummyAsyncHandler} 
          onActionDelete={dummyAsyncHandler} 
          onResetActions={dummyAsyncHandler}
          onActionEdit={dummyAsyncHandler}
          attendees={getAttendeesList()}
          forceOpen={true} // Always expanded for PDF
          onPanelStateChange={dummyHandler}
        />
        
        <KeyDocumentTracker 
          documents={keyDocuments}
          onDocumentsChange={dummyAsyncHandler}
          attendees={getAttendeesList()}
          forceOpen={true} // Always expanded for PDF
          onPanelStateChange={dummyHandler}
        />
        
        {dashboardData.sections.filter(section => section.id !== "meeting-overview").map(section => {
          return (
            <DashboardSection 
              key={section.id} 
              title={section.title} 
              items={section.items} 
              onItemStatusChange={dummyHandler} 
              onItemObservationChange={dummyHandler}
              onItemActionsChange={dummyHandler}
              onItemDocumentsChange={dummyHandler}
              onItemMetadataChange={dummyHandler}
              onActionCreated={dummyAsyncHandler}
              onSubsectionActionEdit={dummyHandler}
              onSubsectionActionComplete={dummyAsyncHandler}
              onSubsectionActionDelete={dummyAsyncHandler}
              attendees={getAttendeesList()}
              meetingDate={meetingDate}
              meetingId={meetingId}
              forceOpen={true} // Always expanded for PDF
              onPanelStateChange={dummyHandler}
            />
          );
        })}
      </div>
    </div>
  );
};