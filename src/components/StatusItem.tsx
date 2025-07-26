import { StatusBadge, StatusType } from "./StatusBadge";
import { CapacityAnalytics } from "./CapacityAnalytics";
import { StaffDocumentsAnalytics } from "./StaffDocumentsAnalytics";
import { StaffTrainingAnalytics } from "./StaffTrainingAnalytics";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { CommentEditor } from "./CommentEditor";
import { ActionForm, ActionItem } from "./ActionForm";
export interface StatusItemData {
  id: string;
  title: string;
  status: StatusType;
  lastReviewed: string;
  observation: string;
  actions: ActionItem[];
  details?: string;
}
interface StatusItemProps {
  item: StatusItemData;
  onStatusChange?: (id: string, status: StatusType) => void;
  onObservationChange?: (id: string, observation: string) => void;
  onActionsChange?: (id: string, actions: ActionItem[]) => void;
  onActionCreated?: (itemTitle: string, mentionedAttendee: string, comment: string, action: string, dueDate: string) => void;
  attendees?: string[];
}
export const StatusItem = ({
  item,
  onStatusChange,
  onObservationChange,
  onActionsChange,
  onActionCreated,
  attendees = []
}: StatusItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingObservation, setIsEditingObservation] = useState(false);
  
  const handleObservationSubmit = (observation: string) => {
    onObservationChange?.(item.id, observation);
    setIsEditingObservation(false);
  };
  const handleActionsChange = (actions: ActionItem[]) => {
    onActionsChange?.(item.id, actions);
  };
  const handleActionCreated = (name: string, description: string, targetDate: string) => {
    // Create action entry for the actions log
    onActionCreated?.(item.title, name, `Action from ${item.title}`, description, targetDate);
  };
  const handleActionCompleted = (actionId: string) => {
    // Remove the completed action from the local actions
    const updatedActions = item.actions.filter(action => action.id !== actionId);
    onActionsChange?.(item.id, updatedActions);
  };
  return <div className="w-full bg-white rounded-xl p-8 mb-3 shadow-md border border-border/30 hover:scale-[1.01] transition-transform duration-300 min-h-[140px]">
      <div className="flex items-center gap-4 w-full">
        <button onClick={() => setIsExpanded(!isExpanded)} className="flex-shrink-0 p-1 rounded-lg hover:bg-accent/50 transition-colors">
          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>
        
        <button onClick={e => {
        e.stopPropagation();
        const statusOrder: StatusType[] = ["green", "amber", "red"];
        const currentIndex = statusOrder.indexOf(item.status);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
        onStatusChange?.(item.id, nextStatus);
      }} className="flex-shrink-0 hover:scale-110 transition-transform">
          <StatusBadge status={item.status} />
        </button>
        
        <div className="flex-1 min-w-0 mr-3">
          <h4 className="font-semibold text-foreground text-sm truncate">{item.title}</h4>
          <p className="text-xs text-muted-foreground">Last: {item.lastReviewed}</p>
        </div>
        
        <div className="flex-[5] min-w-0 space-y-3">
          {/* Observation Section */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">OBSERVATION</label>
            {isEditingObservation ? <CommentEditor initialValue={item.observation} onSubmit={handleObservationSubmit} onCancel={() => setIsEditingObservation(false)} placeholder="Enter your observation..." /> : <button onClick={() => setIsEditingObservation(true)} className="w-full text-left p-3 rounded-lg transition-colors text-sm min-h-[80px] flex items-start border border-border/20 break-words overflow-hidden bg-white">
                <span className="break-words w-full whitespace-pre-wrap">
                  {item.observation || "Click to add observation..."}
                </span>
              </button>}
          </div>

          {/* Actions Section */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">ACTIONS</label>
            <ActionForm actions={item.actions} attendees={attendees} onActionsChange={handleActionsChange} onActionCreated={handleActionCreated} onActionCompleted={handleActionCompleted} />
          </div>
        </div>
      </div>
      
      {isExpanded && <div className="mt-4 pt-4 border-t border-border space-y-4">
          {item.details && <div className="space-y-2">
              {/* Details content */}
            </div>}
          
          <div className="space-y-2">
            {/* Additional content */}
          </div>
          
          {item.title.toLowerCase().includes('resourcing') && <CapacityAnalytics />}
          
          {item.title.toLowerCase().includes('staff documents') && <StaffDocumentsAnalytics />}
          
          {item.title.toLowerCase().includes('training') && <StaffTrainingAnalytics />}
          
        </div>}
    </div>;
};