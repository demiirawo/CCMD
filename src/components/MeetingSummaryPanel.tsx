import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { AISummaryButton } from "./AISummaryButton";

interface MeetingSummaryPanelProps {
  purpose: string;
  onPurposeChange?: (value: string) => void;
  readOnly?: boolean;
  meetingData?: {
    title: string;
    date: string;
    attendees: any[];
    purpose: string;
    sections: any[];
    actionsLog: any[];
  };
}

export const MeetingSummaryPanel = ({ purpose, onPurposeChange, readOnly = false, meetingData }: MeetingSummaryPanelProps) => {
  const [editingPurpose, setEditingPurpose] = useState(false);

  const handlePurposeEdit = (value: string) => {
    setEditingPurpose(false);
    onPurposeChange?.(value);
  };

  // Auto-save as user types
  const handlePurposeInput = (value: string) => {
    onPurposeChange?.(value);
  };

  const stripMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
      .replace(/^\s*[-+*]\s+/gm, '• ') // Convert list items to bullets
      .replace(/^\s*\d+\.\s+/gm, '• ') // Convert numbered lists to bullets
      .replace(/\n{3,}/g, '\n\n') // Clean up excessive line breaks
      .trim();
  };

  return (
    <div className="bg-primary/10 p-8 rounded-xl shadow-sm -mx-8 px-14 mb-8 outline-none">
      <Card className="w-full bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Meeting Summary</CardTitle>
            </div>
            {!readOnly && (
              <AISummaryButton 
                meetingData={meetingData}
                onSummaryGenerated={(summary) => onPurposeChange?.(stripMarkdown(summary))} 
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="min-h-24">
            {readOnly ? (
              <div className="w-full min-h-24 p-3 text-sm text-foreground bg-gray-50 border border-gray-200 rounded whitespace-pre-wrap break-words overflow-wrap-anywhere">
                {purpose || "No meeting summary provided."}
              </div>
            ) : (
              editingPurpose ? (
                <textarea
                  defaultValue={purpose}
                  className="w-full min-h-24 p-3 text-sm text-foreground bg-white border border-gray-300 rounded resize-none whitespace-pre-wrap"
                  onBlur={(e) => handlePurposeEdit(e.target.value)}
                  onChange={(e) => handlePurposeInput(e.target.value)}
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
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};