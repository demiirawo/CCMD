import { StatusBadge, StatusType } from "./StatusBadge";
import { CapacityAnalytics } from "./CapacityAnalytics";
import { StaffComplianceAnalytics } from "./StaffComplianceAnalytics";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { CommentEditor } from "./CommentEditor";
import { parseActionsFromComment, validateAttendee } from "@/utils/actionParser";

export interface StatusItemData {
  id: string;
  title: string;
  status: StatusType;
  lastReviewed: string;
  comment: string;
  details?: string;
}

interface StatusItemProps {
  item: StatusItemData;
  onStatusChange?: (id: string, status: StatusType) => void;
  onCommentChange?: (id: string, comment: string) => void;
  onActionCreated?: (itemTitle: string, mentionedAttendee: string, comment: string, action: string, dueDate: string) => void;
  attendees?: string[];
}

export const StatusItem = ({
  item,
  onStatusChange,
  onCommentChange,
  onActionCreated,
  attendees = []
}: StatusItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleCommentSubmit = (comment: string) => {
    // Parse actions from the comment
    const actions = parseActionsFromComment(comment);
    
    // Create actions for valid attendees
    actions.forEach(({ mentionedName, action, dueDate }) => {
      const attendee = validateAttendee(mentionedName, attendees);
      if (attendee && action.trim()) {
        onActionCreated?.(item.title, mentionedName, comment, action, dueDate);
      }
    });
    
    onCommentChange?.(item.id, comment);
    setIsEditing(false);
  };

  return (
    <div className="w-full bg-white rounded-xl p-8 mb-3 shadow-md border border-border/30 hover:scale-[1.01] transition-transform duration-300 min-h-[140px]">
      <div className="flex items-center gap-4 w-full">
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="flex-shrink-0 p-1 rounded-lg hover:bg-accent/50 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            const statusOrder: StatusType[] = ["green", "amber", "red"];
            const currentIndex = statusOrder.indexOf(item.status);
            const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
            onStatusChange?.(item.id, nextStatus);
          }} 
          className="flex-shrink-0 hover:scale-110 transition-transform"
        >
          <StatusBadge status={item.status} />
        </button>
        
        <div className="flex-[2] min-w-0 mr-4">
          <h4 className="font-semibold text-foreground truncate">{item.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">Last Discussed: {item.lastReviewed}</p>
        </div>
        
        <div className="flex-[4.6] min-w-0 relative">
          {isEditing ? (
            <CommentEditor
              initialValue={item.comment}
              attendees={attendees}
              onSubmit={handleCommentSubmit}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <button 
              onClick={() => setIsEditing(true)} 
              className="w-full max-w-full text-left p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors text-sm min-h-[100px] flex items-start border border-border/20 break-words overflow-hidden"
            >
              <span className="break-words w-full whitespace-pre-wrap">
                {item.comment || "Click to add comment..."}
              </span>
            </button>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          {item.details && (
            <div className="space-y-2">
              {/* Details content */}
            </div>
          )}
          
          <div className="space-y-2">
            {/* Additional content */}
          </div>
          
          {item.title.toLowerCase().includes('recruitment') && (
            <CapacityAnalytics />
          )}
          
          {item.title.toLowerCase().includes('staff') && (
            <StaffComplianceAnalytics />
          )}
        </div>
      )}
    </div>
  );
};
