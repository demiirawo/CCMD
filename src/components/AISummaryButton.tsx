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

  const collectMeetingData = async (meetingDateStr: string) => {
    console.log('🔍 Starting comprehensive data collection for AI summary...');
    console.log('📅 Meeting date for filtering:', meetingDateStr);
    
    if (!meetingData) {
      console.log('No meeting data provided, falling back to DOM scraping');
      return collectFromDOM();
    }

    let allData = "";
    
    // Parse the meeting date for comparison
    const meetingDate = new Date(meetingDateStr);
    const meetingDateFormatted = meetingDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Helper to check if a date matches the meeting date
    const isReviewedToday = (lastReviewed: string | undefined): boolean => {
      if (!lastReviewed) return false;
      
      // Try various date formats
      const reviewDate = new Date(lastReviewed);
      if (isNaN(reviewDate.getTime())) {
        // Try parsing dd/MM/yyyy format
        const parts = lastReviewed.split('/');
        if (parts.length === 3) {
          const parsed = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          if (!isNaN(parsed.getTime())) {
            return parsed.toDateString() === meetingDate.toDateString();
          }
        }
        return false;
      }
      return reviewDate.toDateString() === meetingDate.toDateString();
    };
    
    // Attendees information
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

    // Get ALL dashboard sections but ONLY include items reviewed today
    const dashboardSections = meetingData.dashboardData?.sections || meetingData.sections || [];
    
    let topicsReviewedCount = 0;
    
    if (dashboardSections.length > 0) {
      console.log('📋 Processing dashboard sections, filtering for items reviewed on:', meetingDateFormatted);
      
      dashboardSections.forEach((section: any) => {
        if (!section.items || section.items.length === 0) return;
        
        // Filter items to only those reviewed on the meeting date
        const reviewedItems = section.items.filter((item: any) => isReviewedToday(item.lastReviewed));
        
        if (reviewedItems.length === 0) {
          console.log(`⏭️ Skipping section "${section.title}" - no items reviewed today`);
          return;
        }
        
        console.log(`✅ Section "${section.title}" has ${reviewedItems.length} items reviewed today`);
        allData += `\n=== ${section.title} ===\n`;
        
        // Process ONLY items reviewed today
        reviewedItems.forEach((item: any) => {
          topicsReviewedCount++;
          allData += `\n• ${item.title}`;
          
          // Status information
          if (item.status) {
            const statusLabels: Record<string, string> = {
              'green': 'On Track',
              'amber': 'Needs Attention',
              'red': 'Critical',
              'na': 'Not Applicable'
            };
            allData += ` [${statusLabels[item.status] || item.status.toUpperCase()}]`;
          }
          
          // Last reviewed
          if (item.lastReviewed) {
            allData += ` (Last Reviewed: ${item.lastReviewed})`;
          }
          
          allData += '\n';
          
          // Current observations - include all content
          if (item.observation?.trim()) {
            allData += `  Current Observation: ${item.observation.trim()}\n`;
          }
          
          // Trends and themes
          if (item.trendsThemes?.trim()) {
            allData += `  Trends & Themes: ${item.trendsThemes.trim()}\n`;
          }
          
          // Lessons learned
          if (item.lessonsLearned?.trim()) {
            allData += `  Lessons Learned: ${item.lessonsLearned.trim()}\n`;
          }
          
          // Challenges
          if (item.challenges?.trim()) {
            allData += `  Challenges: ${item.challenges.trim()}\n`;
          }
          
          // Additional details
          if (item.details?.trim()) {
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
      });
    }
    
    // Actions log - only from current meeting session
    if (meetingData.actionsLog && meetingData.actionsLog.length > 0) {
      console.log('📋 Processing actions log:', meetingData.actionsLog.length, 'actions');
      
      allData += '\n=== Action Items ===\n';
      meetingData.actionsLog.forEach((action: any) => {
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

    // Key documents status - only if reviewed today
    if (meetingData.keyDocuments && meetingData.keyDocuments.length > 0) {
      const reviewedDocs = meetingData.keyDocuments.filter((doc: any) => 
        isReviewedToday(doc.lastReviewed) || isReviewedToday(doc.updated_at)
      );
      
      if (reviewedDocs.length > 0) {
        console.log('📄 Processing key documents reviewed today:', reviewedDocs.length, 'documents');
        
        allData += '\n=== Key Documents ===\n';
        reviewedDocs.forEach((doc: any) => {
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

    console.log('✅ Data collection completed. Topics reviewed today:', topicsReviewedCount);
    console.log('📝 Total data length:', allData.length);
    console.log('📝 Collected data preview:', allData.substring(0, 500) + '...');
    return { data: allData, topicsCount: topicsReviewedCount };
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
      const meetingDateStr = meetingData?.date || new Date().toISOString();
      const result = await collectMeetingData(meetingDateStr);
      
      // Handle both old string return and new object return
      const collectedData = typeof result === 'string' ? result : result.data;
      const topicsCount = typeof result === 'string' ? -1 : result.topicsCount;
      
      console.log('📊 Collected meeting data length:', collectedData.length);
      console.log('📊 Topics reviewed today:', topicsCount);
      
      if (!collectedData.trim() || topicsCount === 0) {
        console.log('No meeting data found for today');
        toast({
          title: "No Updates Found",
          description: "No topics were reviewed on the meeting date. Update topic 'Last Reviewed' dates to include them in the summary.",
          variant: "destructive",
        });
        return;
      }

      const meetingDate = new Date(meetingDateStr);
      const formattedDate = meetingDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      
      const messages = [
        {
          role: "system" as const,
          content: `You are an AI assistant that creates concise meeting summaries in British English. 

CRITICAL INSTRUCTIONS:
- Write in British English (organisation, colour, behaviour, recognised, etc.)
- Create TWO sections: "Overview" and "Key Areas Reviewed"
- DO NOT include meeting title, date, or actions/next steps
- ONLY summarise information that is EXPLICITLY provided in the data below
- DO NOT invent, fabricate, or assume any information not in the data
- DO NOT mention specific numbers (e.g., "2 staff overdue") unless that exact figure appears in the data
- If data for a topic is sparse or vague, summarise what IS there without elaboration
- When referring to the company, use "${companyName}"
- Keep summary to 100 words MAXIMUM
- Write in paragraph form, not bullet points
- If unsure about something, omit it rather than guess`
        },
        {
          role: "user" as const,
          content: `Create a 100-word max summary in British English for ${companyName}. ONLY summarise the information explicitly provided below - do not add any information that is not in this data:\n\n${collectedData}`
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