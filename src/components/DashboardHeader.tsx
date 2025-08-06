import { StatusBadge } from "./StatusBadge";
import { MeetingDateTimePicker } from "./MeetingDateTimePicker";
import { TeamAttendeesDisplay, Attendee } from "./TeamAttendeesDisplay";
import { MeetingStatusSummary } from "./MeetingStatusSummary";
import { AISummaryButton } from "./AISummaryButton";
import { RobustMeetingSummary } from "./RobustMeetingSummary";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
interface DashboardHeaderProps {
  date: string;
  title: string;
  attendees: Attendee[];
  purpose: string;
  stats: {
    green: number;
    amber: number;
    red: number;
  };
  sections?: Array<{
    id: string;
    title: string;
    items: Array<{
      status: "green" | "amber" | "red" | "na";
      title?: string;
      observation?: string;
      trendsThemes?: string;
      details?: string;
      actions?: any[];
      lastReviewed?: string;
    }>;
  }>;
  actionsLog?: any[];
  onDataChange?: (field: string, value: string) => void;
  onAttendeesChange?: (attendees: Attendee[]) => void;
  readOnly?: boolean;
}
export const DashboardHeader = ({
  date,
  title,
  attendees,
  purpose,
  stats,
  sections,
  actionsLog,
  onDataChange,
  onAttendeesChange,
  readOnly = false
}: DashboardHeaderProps) => {
  const {
    profile,
    companies
  } = useAuth();
  const [editingField, setEditingField] = useState<string | null>(null);
  const currentCompany = companies.find(c => c.id === profile?.company_id);
  const handleFieldEdit = (field: string, value: string) => {
    setEditingField(null);
    onDataChange?.(field, value);
  };
  const EditableField = ({
    field,
    value,
    label,
    containerClass = "h-24",
    textClass = "font-semibold"
  }: {
    field: string;
    value: string;
    label: string;
    containerClass?: string;
    textClass?: string;
  }) => <div className={`p-4 pt-8 rounded-lg border border-gray-100 ${containerClass} bg-white`}>
      <h3 className="font-medium mb-2 text-base text-stone-950">{label}</h3>
      {readOnly ? <div className={`w-full min-h-12 p-2 text-sm ${textClass} text-foreground bg-gray-50 border border-gray-200 rounded whitespace-pre-wrap break-words overflow-wrap-anywhere`}>
          {value || `No ${label.toLowerCase()} provided.`}
        </div> : editingField === field ? <textarea defaultValue={value} className={`w-full min-h-12 p-2 text-sm ${textClass} text-foreground bg-white border border-gray-300 rounded resize-none whitespace-pre-wrap`} onBlur={e => handleFieldEdit(field, e.target.value)} onKeyDown={e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleFieldEdit(field, e.currentTarget.value);
      }
      if (e.key === "Escape") {
        setEditingField(null);
      }
    }} autoFocus /> : <button onClick={() => setEditingField(field)} className={`w-full text-left min-h-12 p-2 text-sm ${textClass} text-foreground hover:bg-white hover:border-gray-400 transition-colors rounded whitespace-pre-wrap break-words overflow-wrap-anywhere border border-gray-200`}>
            {value}
          </button>}
    </div>;
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{currentCompany?.name || "Dashboard"}</h1>
          {!readOnly && (
            <div className="flex gap-2">
              <AISummaryButton sections={sections} actionsLog={actionsLog} />
              <RobustMeetingSummary sections={sections} actionsLog={actionsLog} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <StatusBadge status="green" />
            <span className="text-sm text-gray-600">{stats.green}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status="amber" />
            <span className="text-sm text-gray-600">{stats.amber}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status="red" />
            <span className="text-sm text-gray-600">{stats.red}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {!readOnly ? (
          <MeetingDateTimePicker
            date={date}
            onChange={(newDate) => onDataChange?.("date", newDate)}
          />
        ) : (
          <EditableField
            field="date"
            value={date}
            label="Meeting Date & Time"
          />
        )}
        
        <EditableField
          field="title"
          value={title}
          label="Meeting Title"
        />
        
        <EditableField
          field="purpose"
          value={purpose}
          label="Meeting Purpose"
          containerClass="h-24"
        />
      </div>

      <div className="mt-4">
        {!readOnly ? (
          <TeamAttendeesDisplay
            attendees={attendees}
            onAttendeesChange={onAttendeesChange}
          />
        ) : (
          <div className="p-4 rounded-lg border border-gray-100 bg-white">
            <h3 className="font-medium mb-2 text-base text-stone-950">Attendees</h3>
            <div className="space-y-2">
              {attendees.map((attendee) => (
                <div key={attendee.id} className="flex items-center gap-2">
                  <span className="text-sm">{attendee.name}</span>
                  {attendee.attended && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Attended
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};