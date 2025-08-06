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
  return;
};