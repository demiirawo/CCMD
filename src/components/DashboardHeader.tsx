
import { StatusBadge } from "./StatusBadge";
import { MeetingDateTimePicker } from "./MeetingDateTimePicker";
import { TeamAttendeesDisplay, Attendee } from "./TeamAttendeesDisplay";
import { MeetingStatusSummary } from "./MeetingStatusSummary";
import { AISummaryButton } from "./AISummaryButton";
import { RobustMeetingSummary } from "./RobustMeetingSummary";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
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
  const { profile } = useAuth();
  const { currentCompany } = useCurrentCompany();
  const [editingField, setEditingField] = useState<string | null>(null);

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
  }) => (
    <div className={`p-4 pt-8 rounded-lg border border-gray-100 ${containerClass} bg-white`}>
      <h3 className="font-medium mb-2 text-base text-stone-950">{label}</h3>
      {readOnly ? (
        <div className={`w-full min-h-12 p-2 text-sm ${textClass} text-foreground bg-gray-50 border border-gray-200 rounded whitespace-pre-wrap break-words overflow-wrap-anywhere`}>
          {value || `No ${label.toLowerCase()} provided.`}
        </div>
      ) : editingField === field ? (
        <textarea
          defaultValue={value}
          className={`w-full min-h-12 p-2 text-sm ${textClass} text-foreground bg-white border border-gray-300 rounded resize-none whitespace-pre-wrap`}
          onBlur={(e) => handleFieldEdit(field, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleFieldEdit(field, e.currentTarget.value);
            }
            if (e.key === "Escape") {
              setEditingField(null);
            }
          }}
          autoFocus
        />
      ) : (
        <button
          onClick={() => setEditingField(field)}
          className={`w-full text-left min-h-12 p-2 text-sm ${textClass} text-foreground hover:bg-white hover:border-gray-400 transition-colors rounded whitespace-pre-wrap break-words overflow-wrap-anywhere border border-gray-200`}
        >
          {value}
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-primary/10 pt-14 pb-8 px-14 mb-8 rounded-xl shadow-sm -mx-8 outline-none">
      {/* Meeting Info Section */}
      <div className="grid grid-cols-2 gap-4 mb-10 items-start">
        <EditableField
          field="title"
          value={title}
          label="Meeting Title"
          textClass=""
          containerClass="h-32"
        />
        <div className="p-4 pt-8 rounded-lg border border-gray-100 h-32 bg-white">
          <h3 className="mb-2 text-stone-950 font-medium text-base">Meeting Date & Time</h3>
          {readOnly ? (
            <div className="w-full min-h-12 p-2 text-sm text-foreground bg-gray-50 border border-gray-200 rounded">
              {date || "No date provided."}
            </div>
          ) : (
            <MeetingDateTimePicker
              value={date}
              onChange={(value) => onDataChange?.("date", value)}
            />
          )}
        </div>
      </div>

      {/* Office Team and Meeting Summary Section */}
      <div className="grid grid-cols-2 gap-6 mb-6 items-start">
        {/* Office Team - 50% width */}
        <div className="p-4 rounded-lg border border-gray-100 min-h-24 bg-white">
          <h3 className="mb-2 py-[8px] text-base font-medium text-stone-950">Meeting Attendees</h3>
          <TeamAttendeesDisplay
            onAttendanceChange={readOnly ? undefined : onAttendeesChange}
            readOnly={readOnly}
          />
        </div>
        
        {/* Meeting Summary - 50% width */}
        <RobustMeetingSummary
          meetingDate={date}
          readOnly={readOnly}
          meetingData={{
            title,
            date,
            attendees,
            purpose,
            sections: sections || [],
            actionsLog: actionsLog || [],
            companyName: currentCompany?.name || "the organization"
          }}
        />
      </div>
    </div>
  );
};
