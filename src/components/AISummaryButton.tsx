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
    
    // Get meeting date from the header to filter recent updates
    const getCurrentMeetingDate = () => {
      // Try to get the meeting date from localStorage or URL params
      const meetingId = new URLSearchParams(window.location.search).get('meeting') || 
                       localStorage.getItem('currentMeetingId');
      
      // Look for date in the dashboard header
      const dateElements = document.querySelectorAll('[class*="meeting-date"], [class*="date"]');
      for (const element of dateElements) {
        const dateText = element.textContent?.trim();
        if (dateText) {
          const parsedDate = new Date(dateText);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
          }
        }
      }
      
      // Fallback to today if no meeting date found
      return new Date();
    };

    const meetingDate = getCurrentMeetingDate();
    const meetingDateStr = meetingDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log('Meeting date for filtering:', meetingDateStr);
    
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

    // Get all dashboard sections and their items (filter by meeting date)
    const sections = document.querySelectorAll('[data-section-id], [class*="DashboardSection"]');
    sections.forEach((section) => {
      const sectionTitle = section.querySelector('h2, h3, [class*="title"]');
      if (sectionTitle?.textContent) {
        let sectionHasRecentUpdates = false;
        let sectionData = `\n=== ${sectionTitle.textContent} ===\n`;
        
        // Get all items in this section
        const items = section.querySelectorAll('[class*="StatusItem"], [data-item-id]');
        items.forEach((item) => {
          const itemTitle = item.querySelector('h4, h5, [class*="title"]');
          const observation = item.querySelector('textarea, [class*="observation"]');
          const statusBadge = item.querySelector('[class*="badge"]');
          const lastReviewed = item.querySelector('[class*="last-reviewed"], [class*="lastReviewed"]');
          
          // Check if this item was updated during or after the meeting
          let isRecentlyUpdated = false;
          
          // Check last reviewed date
          if (lastReviewed?.textContent) {
            const lastReviewedText = lastReviewed.textContent.trim();
            const reviewDate = new Date(lastReviewedText);
            if (!isNaN(reviewDate.getTime()) && reviewDate >= meetingDate) {
              isRecentlyUpdated = true;
            }
          }
          
          // Check if observation has content (indicating recent update)
          const obsText = observation?.textContent || (observation as HTMLTextAreaElement)?.value;
          if (obsText?.trim() && obsText.trim().length > 0) {
            isRecentlyUpdated = true;
          }
          
          // Only include items that were recently updated
          if (isRecentlyUpdated && itemTitle?.textContent) {
            sectionHasRecentUpdates = true;
            sectionData += `- ${itemTitle.textContent}`;
            if (statusBadge?.textContent) {
              sectionData += ` (Status: ${statusBadge.textContent})`;
            }
            if (obsText?.trim()) {
              sectionData += `\n  Observation: ${obsText.trim()}`;
            }
            sectionData += '\n';
          }
        });
        
        // Only add section if it has recent updates
        if (sectionHasRecentUpdates) {
          allData += sectionData;
        }
      }
    });

    // Get actions from the actions log (filter by creation date)
    const actionsElements = document.querySelectorAll('[class*="ActionsLog"] [class*="action"], [data-action-id]');
    if (actionsElements.length > 0) {
      let recentActions: string[] = [];
      
      actionsElements.forEach((action) => {
        const actionText = action.textContent?.trim();
        const actionDate = action.querySelector('[class*="date"], [class*="created"]');
        
        // Check if action was created during or after the meeting
        let isRecentAction = true; // Default to true if no date found
        if (actionDate?.textContent) {
          const createdDate = new Date(actionDate.textContent.trim());
          if (!isNaN(createdDate.getTime()) && createdDate < meetingDate) {
            isRecentAction = false;
          }
        }
        
        if (actionText && isRecentAction) {
          recentActions.push(actionText);
        }
      });
      
      if (recentActions.length > 0) {
        allData += '\n=== New Actions from This Meeting ===\n';
        recentActions.forEach((action) => {
          allData += `- ${action}\n`;
        });
      }
    }

    console.log('Data collection completed. Total data length:', allData.length);
    console.log('Filtered data for meeting date:', meetingDateStr);
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
          content: "You are an AI assistant that creates narrative meeting summaries. Write a flowing, professional summary that reads like a coherent story of the meeting. Avoid bullet points and lists - instead use smooth transitions and connecting words to create a natural narrative flow. Highlight key discussion points, status updates, and outcomes in paragraph form. Keep it to 150 words or less and make it engaging to read."
        },
        {
          role: "user" as const,
          content: `Please create a concise meeting summary (150 words or less) based on the following meeting data:\n\n${meetingData}`
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