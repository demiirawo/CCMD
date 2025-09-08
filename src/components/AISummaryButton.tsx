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

    // Get today's date for filtering recent updates
    const meetingDate = meetingData.date ? new Date(meetingData.date) : new Date();
    const todayStart = new Date(meetingDate);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(meetingDate);
    todayEnd.setHours(23, 59, 59, 999);
    
    // Dashboard sections and items (filter for today's updates only)
    if (meetingData.sections && meetingData.sections.length > 0) {
      meetingData.sections.forEach((section: any) => {
        if (!section.items || section.items.length === 0) return;
        
        // Helper function to check if an item was updated today
        const isUpdatedToday = (item: any) => {
          if (item.lastUpdated) {
            const itemDate = new Date(item.lastUpdated);
            return itemDate >= todayStart && itemDate <= todayEnd;
          }
          if (item.lastReviewed) {
            const reviewDate = new Date(item.lastReviewed);
            return reviewDate >= todayStart && reviewDate <= todayEnd;
          }
          // If no timestamp available, check if there's meaningful new content
          return item.observation?.trim() || item.trendsThemes?.trim() || item.details?.trim();
        };
        
        // Filter items to only include those updated today or with new content
        const todaysItems = section.items.filter((item: any) => {
          // Include if updated today
          if (isUpdatedToday(item)) return true;
          
          // Include if it has new actions from today
          if (item.actions && item.actions.length > 0) {
            return item.actions.some((action: any) => {
              if (action.createdDate) {
                const actionDate = new Date(action.createdDate);
                return actionDate >= todayStart && actionDate <= todayEnd;
              }
              return true; // Include actions without dates (assumed to be new)
            });
          }
          
          // Include if status changed and item seems recently updated
          if (item.status && item.status !== 'green') {
            return true;
          }
          
          return false;
        });
        
        if (todaysItems.length > 0) {
          allData += `\n=== ${section.title} (Today's Updates) ===\n`;
          
          todaysItems.forEach((item: any) => {
            allData += `- ${item.title}`;
            if (item.status && item.status !== 'green') {
              allData += ` (Status: ${item.status})`;
            }
            if (item.lastReviewed) {
              allData += ` (Last Reviewed: ${item.lastReviewed})`;
            }
            allData += '\n';
            
            // Only include observations if they seem to be from today
            if (item.observation?.trim() && isUpdatedToday(item)) {
              allData += `  Today's Observation: ${item.observation.trim()}\n`;
            }
            
            if (item.trendsThemes?.trim() && isUpdatedToday(item)) {
              allData += `  Current Trends/Themes: ${item.trendsThemes.trim()}\n`;
            }
            
            if (item.details?.trim() && isUpdatedToday(item)) {
              allData += `  Latest Details: ${item.details.trim()}\n`;
            }
            
            // Filter actions to today's actions only
            if (item.actions && item.actions.length > 0) {
              const todaysActions = item.actions.filter((action: any) => {
                if (action.createdDate) {
                  const actionDate = new Date(action.createdDate);
                  return actionDate >= todayStart && actionDate <= todayEnd;
                }
                return true; // Include actions without dates
              });
              
              if (todaysActions.length > 0) {
                allData += `  New Actions:\n`;
                todaysActions.forEach((action: any) => {
                  allData += `    - ${action.text || action.action}\n`;
                });
              }
            }
          });
        }
      });
    }
    
    // Actions log (filter for today's actions only)
    if (meetingData.actionsLog && meetingData.actionsLog.length > 0) {
      const todaysActions = meetingData.actionsLog.filter((action: any) => {
        if (action.createdDate) {
          const actionDate = new Date(action.createdDate);
          return actionDate >= todayStart && actionDate <= todayEnd;
        }
        if (action.dateAdded) {
          const actionDate = new Date(action.dateAdded);
          return actionDate >= todayStart && actionDate <= todayEnd;
        }
        // Include actions without dates (assumed to be from today's meeting)
        return true;
      });

      if (todaysActions.length > 0) {
        allData += '\n=== New Actions from Today\'s Meeting ===\n';
        todaysActions.forEach((action: any) => {
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
          content: `You are an AI assistant that creates factual meeting summaries for care management meetings. Your job is to summarize only what was actually discussed and decided in today's specific meeting.

Instructions:
- Focus ONLY on updates, observations, and actions from today's meeting date
- State only the facts of what was discussed, reviewed, or decided today
- When referring to the company, use "${companyName}" instead of generic terms like "provider" or "the organization"
- Avoid cliche phrases about "commitment to compliance" or "quality care" 
- Do not add editorial commentary or assessments
- Use simple, direct language
- Focus on specific items that were reviewed today, their current status, and any new actions taken
- Ignore historical comments unless they provide essential context for today's updates
- Keep it to 150 words or less
- Write in paragraph form without bullet points
- Emphasize that this summary covers today's meeting updates only`
        },
        {
          role: "user" as const,
          content: `Create a factual summary for ${companyName} based on today's meeting updates and new information discussed:\n\n${collectedData}`
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