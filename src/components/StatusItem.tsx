import { StatusBadge, StatusType } from "./StatusBadge";

import { StaffDocumentsAnalytics } from "./StaffDocumentsAnalytics";
import { StaffTrainingAnalytics } from "./StaffTrainingAnalytics";


import { SpotCheckAnalytics } from "./SpotCheckAnalytics";
import { SupervisionAnalytics } from "./SupervisionAnalytics";
import { ResourcingOverview } from "./ResourcingOverview";
import { CarePlanOverview } from "./CarePlanOverview";
import { ServiceUserDocumentsAnalytics } from "./ServiceUserDocumentsAnalytics";



import { IncidentsAnalytics } from "./IncidentsAnalytics";
import { FeedbackAnalytics } from "./FeedbackAnalytics";

import { ChevronDown, ChevronRight, CalendarIcon, ExternalLink } from "lucide-react";
import { useState } from "react";
import { CommentEditor } from "./CommentEditor";
import { ActionForm, ActionItem } from "./ActionForm";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { cn } from "@/lib/utils";
import { AccountableManager } from "./AccountableManager";
import { SubsectionMetadataDialog, SubsectionMetadata } from "./SubsectionMetadataDialog";

export interface DocumentData {
  documentName: string;
  documentOwner: string;
  lastReviewDate: Date | null;
  reviewFrequency: string;
  nextReviewDate: Date | null;
}

export interface StatusItemData {
  id: string;
  title: string;
  status: StatusType;
  lastReviewed: string;
  observation: string;
  actions: ActionItem[];
  accountable?: string[];
  details?: string;
  documents?: DocumentData[];
  metadata?: SubsectionMetadata;
}
interface StatusItemProps {
  item: StatusItemData;
  onStatusChange?: (id: string, status: StatusType) => void;
  onObservationChange?: (id: string, observation: string) => void;
  onActionsChange?: (id: string, actions: ActionItem[]) => void;
  onAccountableChange?: (id: string, accountable: string[]) => void;
  onActionCreated?: (itemTitle: string, mentionedAttendee: string, comment: string, action: string, dueDate: string, subsectionActionId?: string) => void;
  onDocumentsChange?: (id: string, documents: DocumentData[]) => void;
  onSubsectionActionEdit?: (sectionId: string, actionId: string, updates: { comment?: string; dueDate?: string }) => void;
  onSubsectionActionComplete?: (actionId: string) => void;
  onSubsectionActionDelete?: (actionId: string) => void;
  onMetadataChange?: (id: string, metadata: SubsectionMetadata) => void;
  attendees?: string[];
  monthlyStaffData?: Array<{month: string, currentStaff: number, probationStaff?: number}>;
  onMonthlyStaffDataChange?: (data: Array<{month: string, currentStaff: number, probationStaff?: number}>) => void;
  meetingDate?: Date;
  meetingId?: string;
}
export const StatusItem = ({
  item,
  onStatusChange,
  onObservationChange,
  onActionsChange,
  onAccountableChange,
  onActionCreated,
  onDocumentsChange,
  onSubsectionActionEdit,
  onSubsectionActionComplete,
  onSubsectionActionDelete,
  onMetadataChange,
  attendees = [],
  monthlyStaffData = [],
  onMonthlyStaffDataChange,
  meetingDate,
  meetingId
}: StatusItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  console.log('StatusItem: Rendering item:', item.title, 'isExpanded:', isExpanded, 'meetingId:', meetingId);
  const [isEditingObservation, setIsEditingObservation] = useState(false);
  
  const handleObservationSubmit = (observation: string) => {
    onObservationChange?.(item.id, observation);
    setIsEditingObservation(false);
  };
  const handleActionsChange = (actions: ActionItem[]) => {
    // Check if any actions were removed (deleted) by comparing with previous state
    const removedActions = item.actions.filter(oldAction => 
      !actions.find(newAction => newAction.id === oldAction.id)
    );
    
    // For each removed action, delete it from the main Actions Log
    removedActions.forEach(removedAction => {
      onSubsectionActionDelete?.(removedAction.id);
    });
    
    onActionsChange?.(item.id, actions);
  };
  const handleActionCreated = (name: string, description: string, targetDate: string, actionId: string) => {
    console.log('Action created in StatusItem:', { name, description, targetDate, actionId, itemTitle: item.title });
    // Create action entry for the actions log with the same ID for syncing
    onActionCreated?.(item.title, name, `Action from ${item.title}`, description, targetDate, actionId);
  };
  const handleActionCompleted = (actionId: string) => {
    // Remove the completed action from the local actions
    const updatedActions = item.actions.filter(action => action.id !== actionId);
    onActionsChange?.(item.id, updatedActions);
    
    // Mark the action as completed in the main Actions Log
    onSubsectionActionComplete?.(actionId);
  };

  const handleAccountableChange = (accountable: string[]) => {
    onAccountableChange?.(item.id, accountable);
  };

  const calculateNextReviewDate = (lastReviewDate: Date | null, frequency: string): Date | null => {
    if (!lastReviewDate || !frequency) return null;
    
    const freq = frequency.toLowerCase();
    if (freq.includes('day')) {
      const days = parseInt(freq) || 1;
      return addDays(lastReviewDate, days);
    } else if (freq.includes('week')) {
      const weeks = parseInt(freq) || 1;
      return addWeeks(lastReviewDate, weeks);
    } else if (freq.includes('month')) {
      const months = parseInt(freq) || 1;
      return addMonths(lastReviewDate, months);
    } else if (freq.includes('year')) {
      const years = parseInt(freq) || 1;
      return addYears(lastReviewDate, years);
    }
    return null;
  };

  const handleDocumentChange = (index: number, field: keyof DocumentData, value: any) => {
    const updatedDocuments = [...(item.documents || [])];
    if (updatedDocuments[index]) {
      updatedDocuments[index] = { ...updatedDocuments[index], [field]: value };
      
      // Auto-calculate next review date when last review date or frequency changes
      if (field === 'lastReviewDate' || field === 'reviewFrequency') {
        updatedDocuments[index].nextReviewDate = calculateNextReviewDate(
          updatedDocuments[index].lastReviewDate,
          updatedDocuments[index].reviewFrequency
        );
      }
      
      onDocumentsChange?.(item.id, updatedDocuments);
    }
  };

  const addDocument = () => {
    const newDocument: DocumentData = {
      documentName: '',
      documentOwner: '',
      lastReviewDate: null,
      reviewFrequency: '',
      nextReviewDate: null
    };
    const updatedDocuments = [...(item.documents || []), newDocument];
    onDocumentsChange?.(item.id, updatedDocuments);
  };

  const removeDocument = (index: number) => {
    const updatedDocuments = (item.documents || []).filter((_, i) => i !== index);
    onDocumentsChange?.(item.id, updatedDocuments);
  };

  const handleMetadataChange = (metadata: SubsectionMetadata) => {
    onMetadataChange?.(item.id, metadata);
  };
  return <div className="relative w-full bg-white rounded-xl p-8 mb-3 shadow-md border border-border/30 hover:scale-[1.01] transition-transform duration-300 min-h-[140px]">
      <div className="flex items-start gap-4 w-full">
        <button onClick={() => setIsExpanded(!isExpanded)} className={`flex-shrink-0 p-1 rounded-lg hover:bg-accent/50 transition-colors bg-transparent ${item.title.toLowerCase().includes('risk register') || item.title.toLowerCase().includes('infection control') || item.title.toLowerCase().includes('audits') || item.title.toLowerCase().includes('call monitoring') || item.title.toLowerCase().includes('staff meetings') || item.title.toLowerCase().includes('transportation') || item.title.toLowerCase().includes('information governance') || item.title.toLowerCase().includes('medication management') || item.title.toLowerCase().includes('care notes') ? 'opacity-0 invisible pointer-events-none' : ''}`}>
          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>
        
        <button onClick={e => {
        e.stopPropagation();
        const statusOrder: StatusType[] = ["green", "amber", "red", "na"];
        const currentIndex = statusOrder.indexOf(item.status);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
        onStatusChange?.(item.id, nextStatus);
      }} className="flex-shrink-0 hover:scale-110 transition-transform">
          <StatusBadge status={item.status} />
        </button>
        
        <div className="flex-1 min-w-0 mr-3 flex flex-col justify-between h-full">
          <div>
            <SubsectionMetadataDialog
              title={item.title}
              metadata={item.metadata}
              attendees={attendees}
              onSave={handleMetadataChange}
            >
              <h4 className="font-semibold text-foreground text-sm truncate cursor-pointer hover:text-primary transition-colors">
                {item.title}
              </h4>
            </SubsectionMetadataDialog>
            
            {item.metadata?.accountableOwner && (
              <p className="text-xs text-muted-foreground mt-1">
                Accountable: {item.metadata.accountableOwner}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground mt-1">
              Updated: {item.metadata?.updated || item.lastReviewed}
            </p>
            
            {/* Display metadata below title */}
            {item.metadata?.link && (
              <div className="flex items-center gap-1 mt-1">
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                <a 
                  href={item.metadata.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline truncate"
                >
                  {item.metadata.linkText || item.metadata.link}
                </a>
              </div>
            )}
            
            {item.metadata?.link2 && (
              <div className="flex items-center gap-1 mt-1">
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                <a 
                  href={item.metadata.link2} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline truncate"
                >
                  {item.metadata.link2Text || item.metadata.link2}
                </a>
              </div>
            )}
            
            {item.metadata?.description && (
              <p className="text-xs text-muted-foreground mt-4 whitespace-pre-wrap italic">
                {item.metadata.description}
              </p>
            )}
            <div className="mt-2">
              <AccountableManager
                accountable={item.accountable || []}
                attendees={attendees}
                onChange={(newAccountable) => onAccountableChange?.(item.id, newAccountable)}
              />
            </div>
          </div>
        </div>
        
        <div className="flex-[5] min-w-0 space-y-3">
          {/* Observation Section */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">COMMENT</label>
            {isEditingObservation ? <CommentEditor initialValue={item.observation} onSubmit={handleObservationSubmit} onCancel={() => setIsEditingObservation(false)} placeholder="Enter your observation..." autoSave={true} onAutoSave={(value) => onObservationChange?.(item.id, value)} /> : <button onClick={() => setIsEditingObservation(true)} className="w-full text-left p-3 rounded-lg transition-colors text-sm min-h-[80px] flex items-start border border-border/30 break-words overflow-hidden bg-white hover:border-border/40 focus:outline-none focus:ring-2 focus:ring-border/30">
                <span className="break-words w-full whitespace-pre-wrap">
                  {item.observation || "Click to add observation..."}
                </span>
              </button>}
          </div>

          {/* Actions Section */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">ACTIONS</label>
            <ActionForm 
              actions={item.actions} 
              attendees={attendees} 
              onActionsChange={handleActionsChange} 
              onActionCreated={handleActionCreated} 
              onActionCompleted={handleActionCompleted}
              onActionEdit={(actionId, updates) => {
                // Handle action edit at the section level and sync with main Actions Log
                onSubsectionActionEdit?.(item.id, actionId, updates);
              }}
            />
          </div>
        </div>
      </div>
      
      
      {isExpanded && <div className="mt-4 pt-4 space-y-4">
          {item.details && <div className="space-y-2">
              {/* Details content */}
            </div>}
          
          <div className="space-y-2">
            {/* Additional content */}
          </div>
          
          
          {item.title.toLowerCase().includes('resourcing') && <ResourcingOverview meetingDate={meetingDate} meetingId={meetingId} />}
          
          {item.title.toLowerCase().includes('training') && <StaffTrainingAnalytics meetingDate={meetingDate} meetingId={meetingId} />}
          
          
          
          {item.title.toLowerCase().includes('staff documents') && <StaffDocumentsAnalytics meetingDate={meetingDate} meetingId={meetingId} />}
          
          {item.title.toLowerCase().includes('spot check') && <SpotCheckAnalytics meetingDate={meetingDate} meetingId={meetingId} />}
          
          {item.title.toLowerCase().includes('supervision') && <SupervisionAnalytics meetingDate={meetingDate} meetingId={meetingId} />}
          
          
          {item.title.toLowerCase().includes('care plans') && <CarePlanOverview meetingDate={meetingDate} meetingId={meetingId} />}
          
          {item.title.toLowerCase().includes('service user documents') && <ServiceUserDocumentsAnalytics meetingDate={meetingDate} meetingId={meetingId} />}
          
          
          {item.title.toLowerCase().includes('incidents') && <IncidentsAnalytics meetingDate={meetingDate} meetingId={meetingId} />}
          
          {item.title.toLowerCase().includes('feedback') && <FeedbackAnalytics meetingDate={meetingDate} meetingId={meetingId} />}
          
        </div>}
    </div>;
};