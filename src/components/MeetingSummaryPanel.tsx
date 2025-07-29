import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { AISummaryButton } from "./AISummaryButton";

interface MeetingSummaryPanelProps {
  purpose: string;
  onPurposeChange?: (value: string) => void;
}

export const MeetingSummaryPanel = ({ purpose, onPurposeChange }: MeetingSummaryPanelProps) => {
  const [editingPurpose, setEditingPurpose] = useState(false);

  const handlePurposeEdit = (value: string) => {
    setEditingPurpose(false);
    onPurposeChange?.(value);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Meeting Summary</CardTitle>
          </div>
          <AISummaryButton onSummaryGenerated={(summary) => onPurposeChange?.(summary)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="min-h-24">
          {editingPurpose ? (
            <textarea
              defaultValue={purpose}
              className="w-full min-h-24 p-3 text-sm text-foreground bg-white border border-gray-300 rounded resize-none whitespace-pre-wrap"
              onBlur={(e) => handlePurposeEdit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handlePurposeEdit(e.currentTarget.value);
                }
                if (e.key === "Escape") {
                  setEditingPurpose(false);
                }
              }}
              autoFocus
              placeholder="Click to add meeting summary or use AI Summary to generate automatically..."
            />
          ) : (
            <button
              onClick={() => setEditingPurpose(true)}
              className="w-full text-left min-h-24 p-3 text-sm text-foreground hover:bg-gray-50 transition-colors rounded border border-transparent hover:border-gray-300 whitespace-pre-wrap break-words overflow-wrap-anywhere"
            >
              {purpose || "Click to add meeting summary or use AI Summary to generate automatically..."}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};