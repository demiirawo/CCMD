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
    console.log('Starting data collection...');
    let allData = "";
    
    // Get meeting title from the editable field
    const titleButton = document.querySelector('button[class*="text-left"]');
    if (titleButton) {
      const titleText = titleButton.textContent?.trim();
      if (titleText) {
        allData += `Meeting Title: ${titleText}\n`;
      }
    }
    
    // Get meeting purpose from the Meeting Summary section
    const purposeElements = document.querySelectorAll('button[class*="text-left"]');
    purposeElements.forEach((element) => {
      const text = element.textContent?.trim();
      if (text && text !== titleButton?.textContent?.trim()) {
        allData += `Meeting Purpose: ${text}\n`;
      }
    });
    
    // Get attendees - look for elements with attendee data
    const attendeeElements = document.querySelectorAll('[class*="attendee"], [class*="MeetingAttendeesManager"] input, [class*="MeetingAttendeesManager"] button');
    const attendees: string[] = [];
    attendeeElements.forEach((element) => {
      const text = element.textContent?.trim() || (element as HTMLInputElement).value?.trim();
      if (text && text.length > 0 && !attendees.includes(text)) {
        attendees.push(text);
      }
    });
    if (attendees.length > 0) {
      allData += `Attendees: ${attendees.join(', ')}\n`;
    }

    // Get all dashboard sections and their items
    const sections = document.querySelectorAll('[data-section-id], [class*="DashboardSection"]');
    sections.forEach((section) => {
      const sectionTitle = section.querySelector('h2, h3, [class*="title"]');
      if (sectionTitle?.textContent) {
        allData += `\n=== ${sectionTitle.textContent} ===\n`;
        
        // Get all items in this section
        const items = section.querySelectorAll('[class*="StatusItem"], [data-item-id]');
        items.forEach((item) => {
          const itemTitle = item.querySelector('h4, h5, [class*="title"]');
          const observation = item.querySelector('textarea, [class*="observation"]');
          const statusBadge = item.querySelector('[class*="badge"]');
          
          if (itemTitle?.textContent) {
            allData += `- ${itemTitle.textContent}`;
            if (statusBadge?.textContent) {
              allData += ` (Status: ${statusBadge.textContent})`;
            }
            if (observation?.textContent || (observation as HTMLTextAreaElement)?.value) {
              const obsText = observation?.textContent || (observation as HTMLTextAreaElement)?.value;
              if (obsText?.trim()) {
                allData += `\n  Observation: ${obsText.trim()}`;
              }
            }
            allData += '\n';
          }
        });
      }
    });

    // Get actions from the actions log
    const actionsElements = document.querySelectorAll('[class*="ActionsLog"] [class*="action"], [data-action-id]');
    if (actionsElements.length > 0) {
      allData += '\n=== Actions Log ===\n';
      actionsElements.forEach((action) => {
        const actionText = action.textContent?.trim();
        if (actionText) {
          allData += `- ${actionText}\n`;
        }
      });
    }

    console.log('Data collection completed. Total data length:', allData.length);
    return allData;
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