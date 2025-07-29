import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useOpenAI } from "@/hooks/useOpenAI";
import { useToast } from "@/hooks/use-toast";

interface AISummaryButtonProps {
  onSummaryGenerated?: (summary: string) => void;
}

export const AISummaryButton = ({ onSummaryGenerated }: AISummaryButtonProps) => {
  const { generateResponse, isLoading } = useOpenAI();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const collectMeetingData = () => {
    // Get meeting header data
    const headerElements = document.querySelectorAll('[class*="DashboardHeader"]');
    let headerData = "";
    
    // Get title
    const titleElement = document.querySelector('button[class*="text-left"]');
    if (titleElement) {
      headerData += `Meeting Title: ${titleElement.textContent}\n`;
    }
    
    // Get attendees
    const attendeesSection = document.querySelector('h3:contains("Office Team")');
    if (attendeesSection) {
      const attendeesList = attendeesSection.parentElement?.querySelectorAll('[class*="attendee"]');
      if (attendeesList && attendeesList.length > 0) {
        headerData += `Attendees: ${Array.from(attendeesList).map(el => el.textContent).join(', ')}\n`;
      }
    }

    // Get all dashboard sections content
    const sections = document.querySelectorAll('[class*="DashboardSection"]');
    let sectionsData = "";
    
    sections.forEach((section) => {
      const sectionTitle = section.querySelector('h2, h3, [class*="title"]');
      if (sectionTitle) {
        sectionsData += `\n\n=== ${sectionTitle.textContent} ===\n`;
        
        // Get all status items in this section
        const statusItems = section.querySelectorAll('[class*="StatusItem"], [class*="status"]');
        statusItems.forEach((item) => {
          const itemTitle = item.querySelector('[class*="title"], h4, h5');
          const observation = item.querySelector('[class*="observation"], [class*="comment"]');
          const status = item.querySelector('[class*="badge"], [class*="status"]');
          
          if (itemTitle) {
            sectionsData += `\n- ${itemTitle.textContent}`;
            if (status) sectionsData += ` (Status: ${status.textContent})`;
            if (observation) sectionsData += `\n  Observation: ${observation.textContent}`;
          }
        });
      }
    });

    // Get actions log
    const actionsSection = document.querySelector('[class*="ActionsLog"]');
    let actionsData = "";
    if (actionsSection) {
      actionsData += "\n\n=== Actions Log ===\n";
      const actionItems = actionsSection.querySelectorAll('[class*="action-item"]');
      actionItems.forEach((action) => {
        const actionText = action.textContent;
        if (actionText) {
          actionsData += `- ${actionText}\n`;
        }
      });
    }

    return headerData + sectionsData + actionsData;
  };

  const generateAISummary = async () => {
    console.log('AI Summary button clicked');
    if (isLoading || isGenerating) {
      console.log('Already generating, skipping');
      return;
    }
    
    setIsGenerating(true);
    try {
      const meetingData = collectMeetingData();
      console.log('Collected meeting data:', meetingData);
      
      if (!meetingData.trim()) {
        console.log('No meeting data found');
        toast({
          title: "No Data Found",
          description: "No meeting data available to summarize",
          variant: "destructive",
        });
        return;
      }

      const messages = [
        {
          role: "system" as const,
          content: "You are an AI assistant that creates concise meeting summaries. Generate a professional summary of the meeting data provided, highlighting key discussion points, status updates, and action items. Keep it to 250 words or less. Focus on the most important information and outcomes."
        },
        {
          role: "user" as const,
          content: `Please create a concise meeting summary (250 words or less) based on the following meeting data:\n\n${meetingData}`
        }
      ];

      console.log('Sending to OpenAI with messages:', messages);
      const summary = await generateResponse(messages, 'gpt-4.1-2025-04-14');
      console.log('Received summary:', summary);
      
      if (summary) {
        onSummaryGenerated?.(summary);
        toast({
          title: "AI Summary Generated",
          description: "Meeting summary has been generated successfully",
        });
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generateAISummary}
      disabled={isLoading || isGenerating}
      className="gap-2 bg-primary/5"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      AI Summary
    </Button>
  );
};