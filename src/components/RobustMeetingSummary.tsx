import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { useMeetingSummary } from "@/hooks/useMeetingSummary";
import { AISummaryButton } from "./AISummaryButton";

interface RobustMeetingSummaryProps {
  meetingDate: string;
  meetingData?: {
    title: string;
    date: string;
    attendees: any[];
    sections: any[];
    actionsLog: any[];
    purpose: string;
  };
  readOnly?: boolean;
}

// Strip markdown formatting from AI-generated content
const stripMarkdown = (text: string): string => {
  return text
    .replace(/#+\s/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
    .trim();
};

export const RobustMeetingSummary = ({ 
  meetingDate, 
  meetingData, 
  readOnly = false 
}: RobustMeetingSummaryProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState('');
  
  const {
    summaryText,
    updateSummary,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    lastSaved,
    forceSave,
    loadFromDatabase
  } = useMeetingSummary({
    meetingDate,
    autoSaveDelay: 1500, // Faster auto-save for better UX
    enableBackup: true
  });

  // Status indicator
  const getStatusBadge = () => {
    if (isLoading) {
      return (
        <Badge variant="secondary" className="gap-1">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Loading...
        </Badge>
      );
    }
    
    if (isSaving) {
      return (
        <Badge variant="secondary" className="gap-1">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Saving...
        </Badge>
      );
    }
    
    if (hasUnsavedChanges) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          Unsaved Changes
        </Badge>
      );
    }
    
    if (lastSaved) {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Saved
        </Badge>
      );
    }
    
    return null;
  };

  // Handle editing start
  const handleStartEdit = () => {
    setIsEditing(true);
    setLocalText(summaryText);
  };

  // Handle editing save
  const handleSaveEdit = () => {
    updateSummary(localText);
    setIsEditing(false);
  };

  // Handle editing cancel
  const handleCancelEdit = () => {
    setLocalText(summaryText);
    setIsEditing(false);
  };

  // Handle AI summary generation
  const handleAISummaryGenerated = (aiSummary: string) => {
    const cleanSummary = stripMarkdown(aiSummary);
    updateSummary(cleanSummary);
    if (isEditing) {
      setLocalText(cleanSummary);
    }
  };

  // Handle manual save
  const handleManualSave = async () => {
    await forceSave();
  };

  // Handle reload
  const handleReload = async () => {
    await loadFromDatabase();
    if (isEditing) {
      setLocalText(summaryText);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Meeting Summary</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {!readOnly && (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReload}
                  disabled={isLoading || isSaving}
                  title="Reload from database"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                {hasUnsavedChanges && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualSave}
                    disabled={isSaving}
                    title="Force save now"
                  >
                    <Save className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* AI Summary Button */}
        {!readOnly && meetingData && (
          <div className="flex justify-end">
            <AISummaryButton
              meetingData={meetingData}
              onSummaryGenerated={handleAISummaryGenerated}
            />
          </div>
        )}
        
        {/* Summary Content */}
        <div className="space-y-3">
          {readOnly ? (
            <div className="min-h-24 p-3 text-sm text-foreground bg-muted/30 rounded-md whitespace-pre-wrap break-words">
              {summaryText || "No meeting summary provided."}
            </div>
          ) : isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                className="min-h-24 resize-none"
                placeholder="Enter meeting summary or use AI Summary to generate automatically..."
                disabled={isLoading || isSaving}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isLoading || isSaving}
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isLoading || isSaving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleStartEdit}
              disabled={isLoading || isSaving}
              className="w-full text-left min-h-24 p-3 text-sm text-foreground hover:bg-muted/50 transition-colors rounded-md border border-border whitespace-pre-wrap break-words"
            >
              {summaryText || "Click to add meeting summary or use AI Summary to generate automatically..."}
            </button>
          )}
        </div>
        
        {/* Status Information */}
        {lastSaved && !readOnly && (
          <div className="text-xs text-muted-foreground">
            Last saved: {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};