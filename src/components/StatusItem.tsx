import { StatusBadge, StatusType } from "./StatusBadge";
import { CapacityAnalytics } from "./CapacityAnalytics";
import { StaffDocumentsAnalytics } from "./StaffDocumentsAnalytics";
import { StaffTrainingAnalytics } from "./StaffTrainingAnalytics";
import { SpotCheckAnalytics } from "./SpotCheckAnalytics";
import { SupervisionAnalytics } from "./SupervisionAnalytics";
import { CarePlanAnalytics } from "./CarePlanAnalytics";
import { MedicationAnalytics } from "./MedicationAnalytics";
import { CareNotesAnalytics } from "./CareNotesAnalytics";
import { IncidentsAnalytics } from "./IncidentsAnalytics";
import { FeedbackAnalytics } from "./FeedbackAnalytics";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { CommentEditor } from "./CommentEditor";
import { ActionForm, ActionItem } from "./ActionForm";
import { AccountableManager } from "./AccountableManager";
export interface StatusItemData {
  id: string;
  title: string;
  status: StatusType;
  lastReviewed: string;
  observation: string;
  actions: ActionItem[];
  accountable?: string[];
  details?: string;
}
interface StatusItemProps {
  item: StatusItemData;
  onStatusChange?: (id: string, status: StatusType) => void;
  onObservationChange?: (id: string, observation: string) => void;
  onActionsChange?: (id: string, actions: ActionItem[]) => void;
  onAccountableChange?: (id: string, accountable: string[]) => void;
  onActionCreated?: (itemTitle: string, mentionedAttendee: string, comment: string, action: string, dueDate: string) => void;
  attendees?: string[];
  monthlyStaffData?: Array<{month: string, currentStaff: number, probationStaff?: number}>;
  onMonthlyStaffDataChange?: (data: Array<{month: string, currentStaff: number, probationStaff?: number}>) => void;
  meetingDate?: Date;
}
export const StatusItem = ({
  item,
  onStatusChange,
  onObservationChange,
  onActionsChange,
  onAccountableChange,
  onActionCreated,
  attendees = [],
  monthlyStaffData = [],
  onMonthlyStaffDataChange,
  meetingDate
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

  const handleAccountableChange = (accountable: string[]) => {
    onAccountableChange?.(item.id, accountable);
  };
  return <div className="relative w-full bg-white rounded-xl p-8 mb-3 shadow-md border border-border/30 hover:scale-[1.01] transition-transform duration-300 min-h-[140px]">
      <div className="flex items-start gap-4 w-full">
        <button onClick={() => setIsExpanded(!isExpanded)} className={`flex-shrink-0 p-1 rounded-lg hover:bg-accent/50 transition-colors bg-transparent ${item.title.toLowerCase().includes('risk register') || item.title.toLowerCase().includes('infection control') || item.title.toLowerCase().includes('audits') || item.title.toLowerCase().includes('call monitoring') || item.title.toLowerCase().includes('service user documents') || item.title.toLowerCase().includes('staff meetings') ? 'opacity-0 invisible pointer-events-none' : ''}`}>
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
        
        <div className="flex-1 min-w-0 mr-3 flex flex-col justify-between h-full">
          <div>
            <h4 className="font-semibold text-foreground text-sm truncate">{item.title}</h4>
            <p className="text-xs text-muted-foreground">Last: {item.lastReviewed}</p>
          </div>
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
      
      
      {isExpanded && <div className="mt-4 pt-4 space-y-4">
          {item.details && <div className="space-y-2">
              {/* Details content */}
            </div>}
          
          <div className="space-y-2">
            {/* Additional content */}
          </div>
          
          {item.title.toLowerCase().includes('resourcing') && <CapacityAnalytics onMonthlyStaffDataChange={onMonthlyStaffDataChange} meetingDate={meetingDate} />}
          
          {item.title.toLowerCase().includes('staff documents') && <StaffDocumentsAnalytics />}
          
          {item.title.toLowerCase().includes('training') && <StaffTrainingAnalytics />}
          
          {item.title.toLowerCase().includes('spot check') && <SpotCheckAnalytics monthlyStaffData={monthlyStaffData} meetingDate={meetingDate} />}
          
          {item.title.toLowerCase().includes('supervision') && <SupervisionAnalytics monthlyStaffData={monthlyStaffData} meetingDate={meetingDate} />}
          
          {item.title.toLowerCase().includes('care plans') && <CarePlanAnalytics meetingDate={meetingDate} />}
          
          {item.title.toLowerCase().includes('medication management') && <MedicationAnalytics meetingDate={meetingDate} />}
          
          {item.title.toLowerCase().includes('care notes') && <CareNotesAnalytics meetingDate={meetingDate} />}
          
          {item.title.toLowerCase().includes('incidents') && <IncidentsAnalytics meetingDate={meetingDate} />}
          
          {item.title.toLowerCase().includes('feedback') && <FeedbackAnalytics meetingDate={meetingDate} />}
          
        </div>}
    </div>;
};