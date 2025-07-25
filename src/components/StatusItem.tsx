import { StatusBadge, StatusType } from "./StatusBadge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
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
}
export const StatusItem = ({
  item,
  onStatusChange,
  onCommentChange
}: StatusItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const handleCommentSubmit = (comment: string) => {
    onCommentChange?.(item.id, comment);
    setIsEditing(false);
  };
  return <div className="w-full bg-white rounded-xl p-4 mb-3 shadow-md border border-border/30 hover:scale-[1.01] transition-transform duration-300">
      <div className="flex items-center gap-4 w-full">
        <button onClick={() => setIsExpanded(!isExpanded)} className="flex-shrink-0 p-1 rounded-lg hover:bg-accent/50 transition-colors">
          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>
        
        <div className="flex-shrink-0">
          <StatusBadge status={item.status} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate">{item.title}</h4>
          <p className="text-sm text-muted-foreground">{item.lastReviewed}</p>
        </div>
        
        <div className="flex-1">
          {isEditing ? <textarea defaultValue={item.comment} className="w-full p-2 rounded-lg border border-border bg-background resize-none min-h-[60px] text-sm" placeholder="Add your comment..." onBlur={e => handleCommentSubmit(e.target.value)} onKeyDown={e => {
          if (e.key === "Enter" && e.ctrlKey) {
            handleCommentSubmit(e.currentTarget.value);
          }
          if (e.key === "Escape") {
            setIsEditing(false);
          }
        }} autoFocus /> : <button onClick={() => setIsEditing(true)} className="w-full text-left p-2 rounded-lg hover:bg-accent/50 transition-colors text-sm">
              {item.comment || "Click to add comment..."}
            </button>}
        </div>
      </div>
      
      {isExpanded && <div className="mt-4 pt-4 border-t border-border space-y-4">
          {item.details && <div className="space-y-2">
              
              
            </div>}
          
          <div className="space-y-2">
            
            <div className="flex gap-2">
              {(["green", "amber", "red"] as StatusType[]).map(status => (
                <button
                  key={status}
                  onClick={() => onStatusChange?.(item.id, status)}
                  className="transition-transform hover:scale-105"
                >
                  <StatusBadge status={status} />
                </button>
              ))}
            </div>
          </div>
          
          
        </div>}
    </div>;
};