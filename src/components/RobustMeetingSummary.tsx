import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AISummaryButton } from "./AISummaryButton";
import { useMeetingSummaryResilience } from "@/hooks/useMeetingSummaryResilience";
import { Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RobustMeetingSummaryProps {
  meetingDate: string;
  readOnly?: boolean;
  meetingData?: {
    title: string;
    date: string;
    attendees: any[];
    purpose: string;
    sections: any[];
    actionsLog: any[];
    companyName?: string;
  };
}

export const RobustMeetingSummary = ({ 
  meetingDate, 
  readOnly = false, 
  meetingData 
}: RobustMeetingSummaryProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { 
    summary, 
    updateSummary, 
    isLoading, 
    isSaving,
    forceSave 
  } = useMeetingSummaryResilience(meetingDate);

  const handleEdit = (value: string) => {
    setIsEditing(false);
    updateSummary(value);
  };

  const handleInput = (value: string) => {
    updateSummary(value);
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

  const handleAISummary = (generatedSummary: string) => {
    const cleanSummary = stripMarkdown(generatedSummary);
    updateSummary(cleanSummary);
  };

  if (isLoading) {
    return (
      <div className="bg-primary/10 p-8 rounded-xl shadow-sm -mx-8 px-14 mb-8 outline-none">
        <Card className="w-full bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center min-h-24">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Loading meeting summary...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-primary/10 rounded-xl shadow-sm outline-none">
      <Card className="w-full bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Meeting Summary</CardTitle>
              {isSaving && (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              )}
              {!isSaving && summary && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
            {!readOnly && (
              <AISummaryButton 
                meetingData={meetingData}
                onSummaryGenerated={handleAISummary} 
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="min-h-24">
            {readOnly ? (
              <div className="w-full min-h-24 p-3 text-sm text-foreground bg-gray-50 border border-gray-200 rounded whitespace-pre-wrap break-words overflow-wrap-anywhere">
                {summary || "No meeting summary provided."}
              </div>
            ) : (
              isEditing ? (
                <textarea
                  defaultValue={summary}
                  className={cn(
                    "w-full min-h-24 p-3 text-sm text-foreground bg-white border rounded resize-none whitespace-pre-wrap",
                    isSaving ? "border-blue-300" : "border-gray-300"
                  )}
                  onBlur={(e) => handleEdit(e.target.value)}
                  onChange={(e) => handleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleEdit(e.currentTarget.value);
                    }
                    if (e.key === "Escape") {
                      setIsEditing(false);
                    }
                  }}
                  autoFocus
                  placeholder="Click to add meeting summary or use AI Summary to generate automatically..."
                />
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className={cn(
                    "w-full text-left min-h-24 p-3 text-sm text-foreground hover:bg-gray-50 transition-colors rounded border border-gray-200 hover:border-gray-300 whitespace-pre-wrap break-words overflow-wrap-anywhere",
                    isSaving && "bg-blue-50"
                  )}
                >
                  {summary || "Click to add meeting summary or use AI Summary to generate automatically..."}
                </button>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};