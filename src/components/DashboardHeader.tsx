import { StatusBadge } from "./StatusBadge";
import { useState } from "react";

interface DashboardHeaderProps {
  date: string;
  title: string;
  attendees: string;
  purpose: string;
  stats: {
    green: number;
    amber: number;
    red: number;
  };
  onDataChange?: (field: string, value: string) => void;
}

export const DashboardHeader = ({ date, title, attendees, purpose, stats, onDataChange }: DashboardHeaderProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleFieldEdit = (field: string, value: string) => {
    setEditingField(null);
    onDataChange?.(field, value);
  };

  const EditableField = ({ field, value, label }: { field: string; value: string; label: string }) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-24">
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
          <EditableField field="date" value={date} label="Meeting Date" />
        </div>
        
        <div className="space-y-4">
          <EditableField field="attendees" value={attendees} label="Meeting Attendees" />
          <EditableField field="purpose" value={purpose} label="Meeting Purpose" />
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="flex gap-4 justify-center pt-4 border-t border-border/20">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-border/50">
          <div className="flex items-center gap-3">
            <StatusBadge status="green" />
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.green}</div>
              <div className="text-sm text-muted-foreground">On Track</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-lg border border-border/50">
          <div className="flex items-center gap-3">
            <StatusBadge status="amber" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.amber}</div>
              <div className="text-sm text-muted-foreground">At Risk</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-lg border border-border/50">
          <div className="flex items-center gap-3">
            <StatusBadge status="red" />
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.red}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};