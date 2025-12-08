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

    // Get ALL dashboard sections and ALL items - no filtering
    const dashboardSections = meetingData.dashboardData?.sections || meetingData.sections || [];
    
    if (dashboardSections.length > 0) {
      console.log('📋 Processing ALL dashboard sections:', dashboardSections.map((s: any) => s.title));
      
      dashboardSections.forEach((section: any) => {
        if (!section.items || section.items.length === 0) return;
        
        allData += `\n=== ${section.title} ===\n`;
        
        // Process ALL items in the section - no filtering
        section.items.forEach((item: any) => {
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

    // Key documents status
    if (meetingData.keyDocuments && meetingData.keyDocuments.length > 0) {
      console.log('📄 Processing key documents:', meetingData.keyDocuments.length, 'documents');
      
      allData += '\n=== Key Documents ===\n';
      meetingData.keyDocuments.forEach((doc: any) => {
        allData += `• ${doc.name}`;
        if (doc.status) allData += ` [${doc.status}]`;
        if (doc.due_date || doc.nextReviewDate) allData += ` (Due: ${doc.due_date || doc.nextReviewDate})`;
        allData += '\n';
        
        if (doc.comment?.trim()) {
          allData += `  Notes: ${doc.comment.trim()}\n`;
        }
      });
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
          content: `You are an AI assistant that creates meeting summaries for care management meetings. Create a factual summary focusing ONLY on what was discussed in THIS meeting - do not include historical data or information from previous meetings.

Instructions:
- Create TWO sections only: "Overview" and "Key Areas Reviewed"
- DO NOT include meeting title, date, or actions/next steps sections
- In Overview: Brief summary of the meeting focus and purpose
- In Key Areas Reviewed: Cover ALL topic areas and sub-topics that were reviewed, organized by section
- Include specific observations, trends, challenges, and lessons learned that were discussed
- Highlight any areas requiring attention (amber/red status items)
- Include updates on key documents and compliance matters if reviewed
- When referring to the company, use "${companyName}"
- ONLY summarize content that has actual observations, notes, or updates entered - skip sub-topics with no content
- Use clear, professional language suitable for care management
- Focus on operational updates and what was reviewed in this meeting session
- Keep summary concise (200-300 words total)
- Write in paragraph form, not bullet points`
        },
        {
          role: "user" as const,
          content: `Create a meeting summary for ${companyName} based on the current meeting data. Only summarize topics where observations, trends, challenges, lessons learned, or actions were recorded:\n\n${collectedData}`
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