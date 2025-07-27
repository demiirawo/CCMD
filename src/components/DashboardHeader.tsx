import { StatusBadge } from "./StatusBadge";
import { MeetingDateTimePicker } from "./MeetingDateTimePicker";
import { MeetingAttendeesManager, Attendee } from "./MeetingAttendeesManager";
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
  onDataChange?: (field: string, value: string) => void;
  onAttendeesChange?: (attendees: Attendee[]) => void;
}
export const DashboardHeader = ({
  date,
  title,
  attendees,
  purpose,
  stats,
  onDataChange,
  onAttendeesChange
}: DashboardHeaderProps) => {
  const { profile, companies } = useAuth();
  const [editingField, setEditingField] = useState<string | null>(null);
  
  const currentCompany = companies.find(c => c.id === profile?.company_id);
  
  const handleFieldEdit = (field: string, value: string) => {
    setEditingField(null);
    onDataChange?.(field, value);
  };
  const EditableField = ({
    field,
    value,
    label
  }: {
    field: string;
    value: string;
    label: string;
  }) => <div className="p-4 rounded-lg border border-gray-100 h-24 bg-primary/5">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{label}</h3>
      {editingField === field ? <textarea defaultValue={value} className="w-full h-12 p-2 text-lg font-semibold text-foreground bg-white border border-gray-300 rounded resize-none" onBlur={e => handleFieldEdit(field, e.target.value)} onKeyDown={e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleFieldEdit(field, e.currentTarget.value);
      }
      if (e.key === "Escape") {
        setEditingField(null);
      }
    }} autoFocus /> : <button onClick={() => setEditingField(field)} className="w-full text-left h-12 p-2 text-lg font-semibold text-foreground hover:bg-white hover:border-gray-400 transition-colors rounded">
          {value}
        </button>}
    </div>;
  return <div className="bg-primary/10 p-8 mb-8 rounded-xl shadow-sm">
      {/* Company Info and Meeting Overview Section */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Company Info Panel */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-gray-100 bg-primary/5 text-center">
            <h2 className="text-lg font-bold text-foreground mb-4">
              {currentCompany?.name || "No Company Selected"}
            </h2>
            {currentCompany?.logo_url && (
              <div className="flex justify-center">
                <img 
                  src={currentCompany.logo_url} 
                  alt={`${currentCompany.name} logo`}
                  className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                />
              </div>
            )}
          </div>
        </div>

        {/* Meeting Info Panel */}
        <div className="space-y-4">
          <EditableField field="title" value={title} label="Meeting Title" />
          <div className="p-4 rounded-lg border border-gray-100 min-h-24 bg-primary/5">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Office Team</h3>
            <MeetingAttendeesManager attendees={attendees} onChange={onAttendeesChange || (() => {})} />
          </div>
        </div>
        
        {/* Date and Purpose Panel */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-gray-100 h-24 bg-primary/5">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Meeting Date & Time</h3>
            <MeetingDateTimePicker value={date} onChange={value => onDataChange?.("date", value)} />
          </div>
          <EditableField field="purpose" value={purpose} label="Meeting Purpose" />
        </div>
      </div>
      
    </div>;
};