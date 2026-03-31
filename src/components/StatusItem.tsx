import { StatusBadge, StatusType } from "./StatusBadge";
import { StaffDocumentsAnalytics } from "./StaffDocumentsAnalytics";
import { StaffTrainingAnalytics } from "./StaffTrainingAnalytics";
import { SpotCheckAnalytics } from "./SpotCheckAnalytics";
import { SupervisionAnalytics } from "./SupervisionAnalytics";
import { ResourcingOverview } from "./ResourcingOverview";
import { IncidentsAnalytics } from "./IncidentsAnalytics";
import { FeedbackAnalytics } from "./FeedbackAnalytics";
import { ChevronDown, ChevronRight, CalendarIcon, ExternalLink } from "lucide-react";
import { useState, memo, useCallback, useEffect } from "react";
import { CommentEditor } from "./CommentEditor";
import { ChallengesField } from "./ChallengesField";
import { LessonsLearnedField } from "./LessonsLearnedField";
import { TrendAnalysisField } from "./TrendAnalysisField";
import { ActionForm, ActionItem } from "./ActionForm";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { cn } from "@/lib/utils";
import { AccountableManager } from "./AccountableManager";
import { SubsectionMetadataDialog, SubsectionMetadata } from "./SubsectionMetadataDialog";
import { IframeDialog } from "./IframeDialog";
import { EvidenceLinkageDialog } from "./EvidenceLinkageDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubsectionTags } from "@/hooks/useSubsectionTags";
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
  trendsThemes?: string;
  lessonsLearned?: string;
  actions: ActionItem[];
  accountable?: string[];
  details?: string;
  documents?: DocumentData[];
  metadata?: SubsectionMetadata;
}
interface StatusItemProps {
  item: StatusItemData;
  sectionId?: string;
  onStatusChange?: (id: string, status: StatusType) => void;
  onObservationChange?: (id: string, observation: string) => void;
  onTrendsThemesChange?: (id: string, trendsThemes: string) => void;
  onLessonsLearnedChange?: (id: string, lessonsLearned: string) => void;
  onActionsChange?: (id: string, actions: ActionItem[]) => void;
  onAccountableChange?: (id: string, accountable: string[]) => void;
  onActionCreated?: (itemTitle: string, mentionedAttendee: string, comment: string, action: string, dueDate: string, subsectionActionId?: string) => void;
  onDocumentsChange?: (id: string, documents: DocumentData[]) => void;
  onSubsectionActionEdit?: (sectionId: string, actionId: string, updates: {
    comment?: string;
    dueDate?: string;
  }) => void;
  onSubsectionActionComplete?: (actionId: string) => void;
  onSubsectionActionDelete?: (actionId: string) => void;
  onMetadataChange?: (id: string, metadata: SubsectionMetadata) => void;
  attendees?: string[];
  monthlyStaffData?: Array<{
    month: string;
    currentStaff: number;
    probationStaff?: number;
  }>;
  onMonthlyStaffDataChange?: (data: Array<{
    month: string;
    currentStaff: number;
    probationStaff?: number;
  }>) => void;
  meetingDate?: Date;
  meetingId?: string;
  readOnly?: boolean;
}
export const StatusItem = memo(({
  item,
  sectionId,
  onStatusChange,
  onObservationChange,
  onTrendsThemesChange,
  onLessonsLearnedChange,
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
  meetingId,
  readOnly = false
}: StatusItemProps) => {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === 'admin';
  const { tags } = useSubsectionTags(sectionId, item.id);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingObservation, setIsEditingObservation] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(item.metadata?.description || "");
  const [showEvidenceLinkageDialog, setShowEvidenceLinkageDialog] = useState(false);
  const [globalEvidenceRefs, setGlobalEvidenceRefs] = useState<string[]>([]);

  // Update description value when metadata changes
  useEffect(() => {
    setDescriptionValue(item.metadata?.description || "");
  }, [item.metadata?.description]);
  const [iframeDialog, setIframeDialog] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
  }>({
    isOpen: false,
    url: '',
    title: ''
  });

  // Check if any iframe links are available
  const hasIframeLinks = item.metadata?.linkIsIframe || item.metadata?.link2IsIframe;

  // Load global evidence linkage (read-only for everyone on dashboard)
  useEffect(() => {
    const loadGlobalEvidence = async () => {
      if (!sectionId) return;
      
      try {
        const { data, error } = await supabase
          .from('global_subsection_evidence')
          .select('linked_evidence_refs')
          .eq('section_id', sectionId)
          .eq('item_id', item.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading global evidence:', error);
          return;
        }

        if (data?.linked_evidence_refs && Array.isArray(data.linked_evidence_refs)) {
          console.log(`✅ Loaded ${data.linked_evidence_refs.length} evidence items for ${item.title}`, data.linked_evidence_refs);
          setGlobalEvidenceRefs(data.linked_evidence_refs as string[]);
        } else {
          console.log(`ℹ️ No evidence configured for ${item.title}`);
          setGlobalEvidenceRefs([]);
        }
      } catch (error) {
        console.error('Error loading global evidence:', error);
      }
    };

    loadGlobalEvidence();
  }, [sectionId, item.id, item.title]);
  const handleObservationSubmit = useCallback((observation: string) => {
    onObservationChange?.(item.id, observation);
    setIsEditingObservation(false);
  }, [item.id, onObservationChange]);
  const handleActionsChange = useCallback((actions: ActionItem[]) => {
    // Check if any actions were removed (deleted) by comparing with previous state
    const removedActions = item.actions.filter(oldAction => !actions.find(newAction => newAction.id === oldAction.id));

    // For each removed action, delete it from the main Actions Log
    removedActions.forEach(removedAction => {
      onSubsectionActionDelete?.(removedAction.id);
    });
    onActionsChange?.(item.id, actions);
  }, [item.actions, item.id, onActionsChange, onSubsectionActionDelete]);
  const handleActionCreated = useCallback((name: string, description: string, targetDate: string, actionId: string) => {
    // Create action entry for the actions log with the same ID for syncing
    onActionCreated?.(item.title, name, `Action from ${item.title}`, description, targetDate, actionId);
  }, [item.title, onActionCreated]);
  const handleActionCompleted = useCallback((actionId: string) => {
    console.log('StatusItem: Action completed callback called for:', actionId);
    // Mark the action as completed in the local actions (don't remove it)
    const updatedActions = item.actions.map(action => 
      action.id === actionId 
        ? { ...action, isCompleted: true, completedAt: new Date().toISOString() }
        : action
    );
    console.log('StatusItem: Updated actions:', updatedActions);
    onActionsChange?.(item.id, updatedActions);

    // Mark the action as completed in the main Actions Log
    onSubsectionActionComplete?.(actionId);
  }, [item.actions, item.id, onActionsChange, onSubsectionActionComplete]);
  const handleAccountableChange = useCallback((accountable: string[]) => {
    onAccountableChange?.(item.id, accountable);
  }, [item.id, onAccountableChange]);
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
      updatedDocuments[index] = {
        ...updatedDocuments[index],
        [field]: value
      };

      // Auto-calculate next review date when last review date or frequency changes
      if (field === 'lastReviewDate' || field === 'reviewFrequency') {
        updatedDocuments[index].nextReviewDate = calculateNextReviewDate(updatedDocuments[index].lastReviewDate, updatedDocuments[index].reviewFrequency);
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

  const handleDescriptionSave = () => {
    if (item.metadata) {
      handleMetadataChange({
        ...item.metadata,
        description: descriptionValue
      });
    }
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setDescriptionValue(item.metadata?.description || "");
    setIsEditingDescription(false);
  };

  const getStatusBackgroundClass = (status: StatusType) => {
    // Panel color is determined by the R/A/G status only
    switch (status) {
      case 'green':
        return 'bg-green-50 border border-green-200';
      case 'amber':
        return 'bg-amber-50 border border-amber-200';
      case 'red':
        return 'bg-red-50 border border-red-200';
      case 'na':
        return 'bg-gray-50 border border-gray-200';
      default:
        return 'bg-white border border-gray-200';
    }
  };
  return <div className={cn("relative w-full rounded-xl p-8 mb-3 shadow-md hover:scale-[1.01] transition-transform duration-300 min-h-[140px]", getStatusBackgroundClass(item.status))}>
      <div className="flex items-start gap-4 w-full outline-none">
        {hasIframeLinks && <button onClick={() => setIsExpanded(!isExpanded)} className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors" aria-label={isExpanded ? "Collapse details" : "Expand details"}>
            <ChevronDown className={cn("w-4 h-4 text-gray-600 transition-transform", isExpanded && "rotate-180")} />
          </button>}
        
        {readOnly ? <div className="flex-shrink-0">
            {item.id === "achievements-learning" ? <div className="invisible pointer-events-none">
                <StatusBadge status={item.status} />
              </div> : <StatusBadge status={item.status} />}
          </div> : item.id === "achievements-learning" ? <div className="flex-shrink-0 invisible pointer-events-none">
              <StatusBadge status={item.status} />
            </div> : <div className="flex-shrink-0">
              <button onClick={e => {
                e.stopPropagation();
                const statusOrder: StatusType[] = ["green", "amber", "red", "na"];
                const currentIndex = statusOrder.indexOf(item.status);
                const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
                onStatusChange?.(item.id, nextStatus);
              }} className="hover:scale-110 transition-transform">
                <StatusBadge status={item.status} />
              </button>
            </div>}
        
        <div className="flex-1 min-w-0 mr-3 flex flex-col justify-between h-full">
          <div>
            {readOnly ? <h4 className="font-semibold text-foreground text-sm truncate">
                {item.metadata?.customTitle || item.title}
              </h4> : <SubsectionMetadataDialog title={item.title} metadata={item.metadata} attendees={attendees} onSave={handleMetadataChange}>
                <h4 className="font-semibold text-foreground text-base cursor-pointer hover:text-primary transition-colors line-clamp-2">
                  {item.metadata?.customTitle || item.title}
                </h4>
              </SubsectionMetadataDialog>}
            
            {item.metadata?.accountableOwner && <p className="text-xs text-muted-foreground mt-1">
                Accountable: {item.metadata.accountableOwner}
              </p>}
            
            <p className="text-xs text-muted-foreground mt-1">
              {item.id === "achievements-learning" ? `${new Date().getFullYear()}` : `Updated: ${item.lastReviewed || item.metadata?.updated}`}
            </p>
            
            <button 
              onClick={() => setShowEvidenceLinkageDialog(true)}
              className="text-xs text-primary hover:underline mt-1 text-left"
            >
              Compliance Checklist
            </button>
            
            {/* Display metadata below title */}
            {item.metadata?.link && <div className="flex items-center gap-1 mt-1">
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                <a href={item.metadata.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate">
                  {item.metadata.linkText || item.metadata.link}
                </a>
              </div>}
            
            {item.metadata?.link2 && <div className="flex items-center gap-1 mt-1">
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                <a href={item.metadata.link2} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate">
                  {item.metadata.link2Text || item.metadata.link2}
                </a>
              </div>}
            
            {item.metadata?.description && !isEditingDescription && (
              <p 
                onDoubleClick={() => !readOnly && setIsEditingDescription(true)}
                className="text-xs text-muted-foreground mt-4 whitespace-pre-wrap italic cursor-pointer hover:bg-muted/30 p-2 rounded transition-colors"
              >
                {item.metadata.description}
              </p>
            )}

            {isEditingDescription && !readOnly && (
              <div className="mt-4">
                <Textarea
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  className="text-xs bg-white"
                  rows={3}
                  placeholder="Enter note..."
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <Button onClick={handleDescriptionSave} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Save
                  </Button>
                  <Button onClick={handleDescriptionCancel} size="sm" variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {!readOnly && <div className="mt-2">
                <AccountableManager accountable={item.accountable || []} attendees={attendees} onChange={newAccountable => onAccountableChange?.(item.id, newAccountable)} />
              </div>}
          </div>
        </div>
        
        <div className="flex-[5] min-w-0 space-y-3">
          {/* Observation Section */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {item.id === "achievements-learning" ? "ACHIEVEMENTS" : "LATEST UPDATE"}
            </label>
            {readOnly ? <div className="w-full p-3 rounded-lg text-sm min-h-[160px] flex items-start border border-border/30 bg-muted/20">
                <span className="break-words w-full whitespace-pre-wrap">
                  {item.observation || "No observation"}
                </span>
              </div> : isEditingObservation ? <CommentEditor initialValue={item.observation} onSubmit={handleObservationSubmit} onCancel={() => setIsEditingObservation(false)} placeholder="" autoSave={true} onAutoSave={value => onObservationChange?.(item.id, value)} /> : <button onClick={() => setIsEditingObservation(true)} className="w-full text-left p-3 rounded-lg transition-colors text-sm min-h-[160px] flex items-start border border-border/30 break-words overflow-hidden bg-white text-black hover:border-border/40 focus:outline-none focus:ring-2 focus:ring-border/30">
                <span className="break-words w-full whitespace-pre-wrap">
                  {item.observation}
                </span>
              </button>}
          </div>

          {/* Challenges Field */}
          <ChallengesField value={item.trendsThemes || ''} onChange={value => onTrendsThemesChange?.(item.id, value)} readOnly={readOnly} itemId={item.id} />

          {/* Actions Section / Duplicate LESSONS LEARNED for Achievements & Learning */}
          <div>
            {item.id === "achievements-learning" ? <>
                <LessonsLearnedField value={item.lessonsLearned || ''} onChange={value => onLessonsLearnedChange?.(item.id, value)} readOnly={readOnly} />
              </> : <>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">ACTIONS</label>
                {readOnly ? <div className="space-y-2">
                    {item.actions.filter(action => !action.isCompleted).length > 0 ? item.actions.filter(action => !action.isCompleted).map((action, index) => <div key={index} className="p-3 border border-border/30 rounded-lg bg-muted/20">
                          <div className="text-sm font-medium">{action.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Assigned to: {action.name} | Due: {action.targetDate}
                          </div>
                        </div>) : <div className="p-3 border border-border/30 rounded-lg bg-muted/20 text-sm text-muted-foreground">
                        No actions
                      </div>}
                  </div> : <ActionForm actions={item.actions} attendees={attendees} sectionStatus={item.status} onActionsChange={handleActionsChange} onActionCreated={handleActionCreated} onActionCompleted={handleActionCompleted} onActionEdit={(actionId, updates) => {
              // Handle action edit at the section level and sync with main Actions Log
              onSubsectionActionEdit?.(item.id, actionId, updates);
            }} />}
              </>}
          </div>

          {/* Actions section for Achievements & Learning */}
          {item.id === "achievements-learning" && <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">ACTIONS</label>
              {readOnly ? <div className="space-y-2">
                  {item.actions.length > 0 ? item.actions.map((action, index) => <div key={index} className="p-3 border border-border/30 rounded-lg bg-muted/20">
                        <div className="text-sm font-medium">{action.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Assigned to: {action.name} | Due: {action.targetDate}
                        </div>
                      </div>) : <div className="p-3 border border-border/30 rounded-lg bg-muted/20 text-sm text-muted-foreground">
                      No actions
                    </div>}
                </div> : <ActionForm actions={item.actions} attendees={attendees} sectionStatus={item.status} onActionsChange={handleActionsChange} onActionCreated={handleActionCreated} onActionCompleted={handleActionCompleted} onActionEdit={(actionId, updates) => {
            // Handle action edit at the section level and sync with main Actions Log
            onSubsectionActionEdit?.(item.id, actionId, updates);
          }} />}
            </div>}

        </div>
      </div>
      
      {isExpanded && hasIframeLinks && <div className="mt-6 pt-6 border-t border-border/30">
          <div className="space-y-4">
            {/* Display iframe links */}
            {item.metadata?.linkIsIframe && item.metadata.link && <div className="bg-white/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-foreground">
                    {item.metadata.linkText || 'External Content'}
                  </h4>
                  <button onClick={() => window.open(item.metadata.link, '_blank')} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Open in new tab
                  </button>
                </div>
                <div className="relative">
                  <iframe src={item.metadata.link} className="w-full h-[800px] border border-border rounded-lg" title={item.metadata.linkText || 'External Content'} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation" loading="lazy" onError={() => {
              console.log('Iframe failed to load, likely blocked by X-Frame-Options');
            }} />
                  <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-500 pointer-events-none opacity-0 iframe-fallback">
                    <div className="text-center">
                      <p>Content cannot be displayed in iframe</p>
                      <p className="text-xs">Click "Open in new tab" above</p>
                    </div>
                  </div>
                </div>
              </div>}
            
            {item.metadata?.link2IsIframe && item.metadata.link2 && <div className="bg-white/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-foreground">
                    {item.metadata.link2Text || 'External Content'}
                  </h4>
                  <button onClick={() => window.open(item.metadata.link2, '_blank')} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Open in new tab
                  </button>
                </div>
                <div className="relative">
                  <iframe src={item.metadata.link2} className="w-full h-[800px] border border-border rounded-lg" title={item.metadata.link2Text || 'External Content'} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation" loading="lazy" onError={() => {
              console.log('Iframe failed to load, likely blocked by X-Frame-Options');
            }} />
                  <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-500 pointer-events-none opacity-0 iframe-fallback">
                    <div className="text-center">
                      <p>Content cannot be displayed in iframe</p>
                      <p className="text-xs">Click "Open in new tab" above</p>
                    </div>
                  </div>
                </div>
              </div>}
          </div>
        </div>}
      
      {/* Display configured tags at bottom */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-4 pt-3 border-t mt-4">
          {tags.map((tag, index) => {
            const pastelColors = [
              'bg-blue-100 text-blue-800 border-blue-200',
              'bg-purple-100 text-purple-800 border-purple-200',
              'bg-pink-100 text-pink-800 border-pink-200',
              'bg-green-100 text-green-800 border-green-200',
              'bg-yellow-100 text-yellow-800 border-yellow-200',
              'bg-indigo-100 text-indigo-800 border-indigo-200',
              'bg-rose-100 text-rose-800 border-rose-200',
              'bg-cyan-100 text-cyan-800 border-cyan-200',
            ];
            const colorClass = pastelColors[index % pastelColors.length];
            
            return (
              <Badge 
                key={tag} 
                variant="outline"
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md w-44 min-w-44 max-w-44 h-auto whitespace-normal break-words ${colorClass}`}
              >
                {tag}
              </Badge>
            );
          })}
        </div>
      )}

      <IframeDialog isOpen={iframeDialog.isOpen} onClose={() => setIframeDialog({
        isOpen: false,
        url: '',
        title: ''
      })} url={iframeDialog.url} title={iframeDialog.title} />
      
      <EvidenceLinkageDialog
        isOpen={showEvidenceLinkageDialog}
        onClose={() => setShowEvidenceLinkageDialog(false)}
        subsectionTitle={item.title}
        linkedEvidenceRefs={globalEvidenceRefs}
        onSave={async () => {}} // Read-only - no save needed on dashboard
        isSuperAdmin={false} // Always read-only on dashboard
      />
    </div>;
});