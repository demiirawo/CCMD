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
    keyDocuments?: any[];
    dashboardData?: {
      sections: any[];
    };
  };
}

export const AISummaryButton = ({ onSummaryGenerated, meetingData }: AISummaryButtonProps) => {
  const { generateResponse, isLoading } = useOpenAI();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const collectMeetingData = async () => {
    console.log('🔍 Starting comprehensive data collection for AI summary...');
    
    if (!meetingData) {
      console.log('No meeting data provided, falling back to DOM scraping');
      return collectFromDOM();
    }

    let allData = "";
    
    // Attendees information (but not title or date)
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
      allData += `Meeting Purpose: ${meetingData.purpose}\n`;
    }

    // Get meeting date for filtering relevant updates
    const meetingDate = meetingData.date ? new Date(meetingData.date) : new Date();
    const todayStart = new Date(meetingDate);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(meetingDate);
    todayEnd.setHours(23, 59, 59, 999);
    
    console.log('📅 Meeting date range:', { start: todayStart, end: todayEnd });

    // Enhanced dashboard data collection
    const dashboardSections = meetingData.dashboardData?.sections || meetingData.sections || [];
    
    if (dashboardSections.length > 0) {
      console.log('📋 Processing dashboard sections:', dashboardSections.map(s => s.title));
      
      dashboardSections.forEach((section: any) => {
        if (!section.items || section.items.length === 0) return;
        
        // Helper function to check if content is meaningful and relevant
        const hasRelevantContent = (item: any) => {
          // Check for meaningful observations, trends, or lessons learned
          const hasObservation = item.observation?.trim() && item.observation.length > 10;
          const hasTrends = item.trendsThemes?.trim() && item.trendsThemes.length > 10;
          const hasLessons = item.lessonsLearned?.trim() && item.lessonsLearned.length > 10;
          const hasDetails = item.details?.trim() && item.details.length > 10;
          
          // Check for recent updates based on timestamps
          const isRecentlyUpdated = () => {
            if (item.lastUpdated) {
              const itemDate = new Date(item.lastUpdated);
              return itemDate >= todayStart && itemDate <= todayEnd;
            }
            if (item.lastReviewed) {
              const reviewDate = new Date(item.lastReviewed);
              return reviewDate >= todayStart && reviewDate <= todayEnd;
            }
            return hasObservation || hasTrends || hasLessons || hasDetails;
          };
          
          // Check for new actions
          const hasNewActions = item.actions && item.actions.length > 0;
          
          // Check for status changes (non-green status indicates attention needed)
          const hasStatusChange = item.status && item.status !== 'green';
          
          return isRecentlyUpdated() || hasNewActions || hasStatusChange;
        };
        
        // Filter items with relevant content
        const relevantItems = section.items.filter(hasRelevantContent);
        
        if (relevantItems.length > 0) {
          allData += `\n=== ${section.title} ===\n`;
          
          relevantItems.forEach((item: any) => {
            allData += `\n• ${item.title}`;
            
            // Status information
            if (item.status && item.status !== 'green') {
              const statusLabels = {
                'amber': 'Needs Attention',
                'red': 'Critical',
                'na': 'Not Applicable'
              };
              allData += ` [${statusLabels[item.status as keyof typeof statusLabels] || item.status.toUpperCase()}]`;
            }
            
            // Last reviewed information
            if (item.lastReviewed) {
              allData += ` (Last Reviewed: ${item.lastReviewed})`;
            }
            
            allData += '\n';
            
            // Current observations
            if (item.observation?.trim() && item.observation.length > 10) {
              allData += `  Current Observation: ${item.observation.trim()}\n`;
            }
            
            // Trends and themes
            if (item.trendsThemes?.trim() && item.trendsThemes.length > 10) {
              allData += `  Trends & Themes: ${item.trendsThemes.trim()}\n`;
            }
            
            // Lessons learned
            if (item.lessonsLearned?.trim() && item.lessonsLearned.length > 10) {
              allData += `  Lessons Learned: ${item.lessonsLearned.trim()}\n`;
            }
            
            // Additional details
            if (item.details?.trim() && item.details.length > 10) {
              allData += `  Details: ${item.details.trim()}\n`;
            }
            
            // Actions associated with this item
            if (item.actions && item.actions.length > 0) {
              allData += `  Actions Identified:\n`;
              item.actions.forEach((action: any) => {
                const actionText = action.text || action.action || action.description;
                const assignedTo = action.assignedTo || action.assignee || action.owner;
                const dueDate = action.targetDate || action.dueDate || action.due_date;
                
                if (actionText) {
                  allData += `    - ${actionText}`;
                  if (assignedTo) allData += ` (Assigned: ${assignedTo})`;
                  if (dueDate) allData += ` (Due: ${dueDate})`;
                  if (action.status) allData += ` [${action.status}]`;
                  allData += '\n';
                }
              });
            }
          });
        }
      });
    }
    
    // Centralized actions log from meeting
    if (meetingData.actionsLog && meetingData.actionsLog.length > 0) {
      console.log('📋 Processing actions log:', meetingData.actionsLog.length, 'actions');
      
      const relevantActions = meetingData.actionsLog.filter((action: any) => {
        // Include actions created today or still active
        if (action.createdDate || action.dateAdded || action.timestamp) {
          const actionDate = new Date(action.createdDate || action.dateAdded || action.timestamp);
          const isFromToday = actionDate >= todayStart && actionDate <= todayEnd;
          const isActive = !action.closed && !action.isCompleted;
          return isFromToday || isActive;
        }
        // Include actions without dates (assumed relevant)
        return !action.closed && !action.isCompleted;
      });

      if (relevantActions.length > 0) {
        allData += '\n=== Action Items Status ===\n';
        relevantActions.forEach((action: any) => {
          const actionText = action.action_text || action.action || action.text;
          const assignee = action.mentioned_attendee || action.assignee || action.owner;
          const dueDate = action.due_date || action.dueDate || action.targetDate;
          const status = action.status || (action.closed ? 'Completed' : 'Open');
          const sourceItem = action.item_title;
          
          if (actionText) {
            allData += `• ${actionText}`;
            if (assignee) allData += ` (Owner: ${assignee})`;
            if (sourceItem) allData += ` (From: ${sourceItem})`;
            if (dueDate) allData += ` (Due: ${dueDate})`;
            allData += ` [${status}]\n`;
            
            if (action.comment?.trim()) {
              allData += `  Context: ${action.comment.trim()}\n`;
            }
          }
        });
      }
    }

    // Key documents status
    if (meetingData.keyDocuments && meetingData.keyDocuments.length > 0) {
      console.log('📄 Processing key documents:', meetingData.keyDocuments.length, 'documents');
      
      const documentsNeedingAttention = meetingData.keyDocuments.filter((doc: any) => {
        return doc.status !== 'complete' || doc.comment?.trim();
      });
      
      if (documentsNeedingAttention.length > 0) {
        allData += '\n=== Key Documents Update ===\n';
        documentsNeedingAttention.forEach((doc: any) => {
          allData += `• ${doc.name}`;
          if (doc.status) allData += ` [${doc.status}]`;
          if (doc.due_date || doc.nextReviewDate) allData += ` (Due: ${doc.due_date || doc.nextReviewDate})`;
          allData += '\n';
          
          if (doc.comment?.trim()) {
            allData += `  Notes: ${doc.comment.trim()}\n`;
          }
        });
      }
    }

    console.log('✅ Data collection completed. Total data length:', allData.length);
    console.log('📝 Collected data preview:', allData.substring(0, 500) + '...');
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
    console.log('🚀 AI Summary generation started');
    if (isLoading || isGenerating) {
      console.log('⏳ Already generating, skipping');
      return;
    }
    
    setIsGenerating(true);
    try {
      const companyName = meetingData?.companyName || "the organization";
      const collectedData = await collectMeetingData();
      console.log('📊 Collected meeting data length:', collectedData.length);
      
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
          content: `You are an AI assistant that creates meeting summaries for care management meetings. Create a factual summary focusing ONLY on what was reviewed and discussed in today's meeting.

Instructions:
- Create TWO sections only: "Overview" and "Key Areas Reviewed"
- DO NOT include meeting title, date, or actions/next steps sections
- In Overview: Brief summary of the meeting focus and purpose
- In Key Areas Reviewed: Summarize all sections that were reviewed with their current status
- Include specific observations, trends, and lessons learned discussed
- Highlight any areas requiring attention (amber/red status items)
- Include updates on key documents and compliance matters
- When referring to the company, use "${companyName}" 
- Use clear, professional language suitable for care management
- Focus on operational updates and what was reviewed
- Keep summary concise (150-200 words total)
- Write in paragraph form, not bullet points`
        },
        {
          role: "user" as const,
          content: `Create a meeting summary for ${companyName} based on today's meeting data:\n\n${collectedData}`
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