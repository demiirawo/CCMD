import { StatusBadge } from "./StatusBadge";
import { MeetingDateTimePicker } from "./MeetingDateTimePicker";
import { MeetingAttendeesManager, Attendee } from "./MeetingAttendeesManager";
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
  onDataChange?: (field: string, value: string) => void;
  onAttendeesChange?: (attendees: Attendee[]) => void;
}

export const DashboardHeader = ({ date, title, attendees, purpose, stats, onDataChange, onAttendeesChange }: DashboardHeaderProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleFieldEdit = (field: string, value: string) => {
    setEditingField(null);
    onDataChange?.(field, value);
  };

  const EditableField = ({ field, value, label }: { field: string; value: string; label: string }) => (
    <div className="bg-gray-25 p-4 rounded-lg border border-gray-100 h-24">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{label}</h3>
      {editingField === field ? (
        <textarea
          defaultValue={value}
          className="w-full h-12 p-2 text-lg font-semibold text-foreground bg-white border border-gray-300 rounded resize-none"
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
          className="w-full text-left h-12 p-2 text-lg font-semibold text-foreground hover:bg-white hover:border-gray-400 transition-colors rounded"
        >
          {value}
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-white p-8 mb-8 rounded-xl shadow-sm">
      {/* Meeting Overview Section */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <EditableField field="title" value={title} label="Meeting Title" />
          <div className="bg-gray-25 p-4 rounded-lg border border-gray-100 h-24">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Meeting Date & Time</h3>
            <MeetingDateTimePicker 
              value={date}
              onChange={(value) => onDataChange?.("date", value)}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-25 p-4 rounded-lg border border-gray-100 min-h-24">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Meeting Attendees</h3>
            <MeetingAttendeesManager 
              attendees={attendees}
              onChange={onAttendeesChange || (() => {})}
            />
          </div>
          <EditableField field="purpose" value={purpose} label="Meeting Purpose" />
        </div>
      </div>
      
    </div>
  );
};