import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useOpenAI } from "@/hooks/useOpenAI";
import { useToast } from "@/hooks/use-toast";

interface AISummaryButtonProps {
  onSummaryGenerated?: (summary: string) => void;
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

export const AISummaryButton = ({ onSummaryGenerated, meetingData }: AISummaryButtonProps) => {
  const { generateResponse, isLoading } = useOpenAI();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const collectMeetingData = () => {
    console.log('Starting data collection with structured data...');
    
    if (!meetingData) {
      console.log('No meeting data provided, falling back to DOM scraping');
      // Fallback to DOM scraping if no data provided (for backward compatibility)
      return collectFromDOM();
    }

    let allData = "";
    
    // Meeting basic information
    if (meetingData.title) {
      allData += `Meeting Title: ${meetingData.title}\n`;
    }
    
    if (meetingData.date) {
      allData += `Meeting Date: ${meetingData.date}\n`;
    }
    
    if (meetingData.attendees && meetingData.attendees.length > 0) {
      const attendeeNames = meetingData.attendees
        .map(attendee => typeof attendee === 'string' ? attendee : attendee.name || attendee.email)
        .filter(name => name && name.trim())
        .join(', ');
      if (attendeeNames) {
        allData += `Attendees: ${attendeeNames}\n`;
      }
    }
    
    if (meetingData.purpose && meetingData.purpose.trim()) {
      allData += `Current Meeting Purpose: ${meetingData.purpose}\n`;
    }
    
    // Dashboard sections and items
    if (meetingData.sections && meetingData.sections.length > 0) {
      meetingData.sections.forEach((section: any) => {
        if (!section.items || section.items.length === 0) return;
        
        // Check if any items in this section have meaningful content
        const itemsWithContent = section.items.filter((item: any) => 
          item.observation?.trim() || 
          item.trendsThemes?.trim() || 
          item.details?.trim() ||
          (item.actions && item.actions.length > 0) ||
          item.status !== 'green'
        );
        
        if (itemsWithContent.length > 0) {
          allData += `\n=== ${section.title} ===\n`;
          
          itemsWithContent.forEach((item: any) => {
            allData += `- ${item.title}`;
            if (item.status && item.status !== 'green') {
              allData += ` (Status: ${item.status})`;
            }
            if (item.lastReviewed) {
              allData += ` (Last Reviewed: ${item.lastReviewed})`;
            }
            allData += '\n';
            
            if (item.observation?.trim()) {
              allData += `  Observation: ${item.observation.trim()}\n`;
            }
            
            if (item.trendsThemes?.trim()) {
              allData += `  Trends/Themes: ${item.trendsThemes.trim()}\n`;
            }
            
            if (item.details?.trim()) {
              allData += `  Details: ${item.details.trim()}\n`;
            }
            
            if (item.actions && item.actions.length > 0) {
              allData += `  Actions:\n`;
              item.actions.forEach((action: any) => {
                allData += `    - ${action.text || action.action}\n`;
              });
            }
          });
        }
      });
    }
    
    // Actions log
    if (meetingData.actionsLog && meetingData.actionsLog.length > 0) {
      allData += '\n=== Actions from Meeting ===\n';
      meetingData.actionsLog.forEach((action: any) => {
        allData += `- ${action.action || action.text}`;
        if (action.assignee) {
          allData += ` (Assignee: ${action.assignee})`;
        }
        if (action.dueDate) {
          allData += ` (Due: ${action.dueDate})`;
        }
        if (action.status) {
          allData += ` (Status: ${action.status})`;
        }
        allData += '\n';
      });
    }

    console.log('Data collection completed. Total data length:', allData.length);
    return allData;
  };

  // Fallback DOM scraping method (simplified)
  const collectFromDOM = () => {
    let allData = "";
    
    // Get meeting title
    const titleElement = document.querySelector('[data-testid="meeting-title"], .meeting-title');
    if (titleElement?.textContent) {
      allData += `Meeting Title: ${titleElement.textContent.trim()}\n`;
    }
    
    // Get dashboard sections with observations
    const sections = document.querySelectorAll('[data-section-id]');
    sections.forEach((section) => {
      const sectionTitle = section.querySelector('h2, h3')?.textContent;
      if (sectionTitle) {
        const observations = section.querySelectorAll('textarea[value], textarea');
        let sectionHasContent = false;
        let sectionData = `\n=== ${sectionTitle} ===\n`;
        
        observations.forEach((textarea) => {
          const value = (textarea as HTMLTextAreaElement).value?.trim();
          if (value) {
            sectionHasContent = true;
            const itemTitle = textarea.closest('[data-item-id]')?.querySelector('h4, h5')?.textContent || 'Item';
            sectionData += `- ${itemTitle}: ${value}\n`;
          }
        });
        
        if (sectionHasContent) {
          allData += sectionData;
        }
      }
    });
    
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
      const companyName = meetingData?.companyName || "the organization";
      const collectedData = collectMeetingData();
      console.log('Collected meeting data:', collectedData);
      
      if (!collectedData.trim()) {
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
          content: `You are an AI assistant that creates factual meeting summaries for care management meetings. Your job is to summarize only what was actually discussed and decided in the meeting.

Instructions:
- State only the facts of what was discussed, reviewed, or decided
- When referring to the company, use "${companyName}" instead of generic terms like "provider" or "the organization"
- Avoid cliche phrases about "commitment to compliance" or "quality care" 
- Do not add editorial commentary or assessments
- Use simple, direct language
- Focus on specific items that were reviewed, their status, and any actions taken
- Keep it to 150 words or less
- Write in paragraph form without bullet points`
        },
        {
          role: "user" as const,
          content: `Create a factual summary for ${companyName} based on this meeting data:\n\n${collectedData}`
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