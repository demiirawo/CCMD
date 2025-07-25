import { StatusBadge, StatusType } from "./StatusBadge";
import { CapacityAnalytics } from "./CapacityAnalytics";
import { StaffComplianceAnalytics } from "./StaffComplianceAnalytics";
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
  onMentionDetected?: (itemTitle: string, mentionedAttendee: string, comment: string, action: string, dueDate: string) => void;
  attendees?: string[];
}
export const StatusItem = ({
  item,
  onStatusChange,
  onCommentChange,
  onMentionDetected,
  attendees = []
}: StatusItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const handleCommentSubmit = (comment: string) => {
    // Check for completed inline actions (format: @Name Action: [action] Date Due: [date])
    const inlineActionRegex = /@(\w+)\s+Action:\s*([^D]+?)\s*Date\s+Due:\s*(\S+)/g;
    let match;
    
    while ((match = inlineActionRegex.exec(comment)) !== null) {
      const [, mentionedName, action, dueDate] = match;
      
      if (action.trim() && dueDate.trim() && attendees.length > 0) {
        const foundAttendee = attendees.find(attendee => 
          attendee.toLowerCase().includes(mentionedName.toLowerCase())
        );
        
        if (foundAttendee) {
          onMentionDetected?.(item.title, mentionedName, comment, action.trim(), dueDate.trim());
        }
      }
    }
    
    onCommentChange?.(item.id, comment);
    setIsEditing(false);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Check for @ mentions and insert inline template
    const mentionRegex = /@(\w+)(?!\s+Action:)/g;
    let match;
    let newValue = value;
    let offset = 0;
    
    while ((match = mentionRegex.exec(value)) !== null) {
      const [fullMatch, mentionedName] = match;
      
      if (attendees.some(attendee => attendee.toLowerCase().includes(mentionedName.toLowerCase()))) {
        const matchStart = match.index + offset;
        const matchEnd = matchStart + fullMatch.length;
        const template = `@${mentionedName} Action: _______ Date Due: _______`;
        
        newValue = newValue.substring(0, matchStart) + template + newValue.substring(matchEnd);
        offset += template.length - fullMatch.length;
        
        // Update cursor position if it was after the match
        if (cursorPosition > matchEnd) {
          setTimeout(() => {
            e.target.setSelectionRange(
              cursorPosition + offset, 
              cursorPosition + offset
            );
          }, 0);
        }
      }
    }
    
    if (newValue !== value) {
      e.target.value = newValue;
    }
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
        
        <div className="flex-[2] min-w-0 mr-4">
          <h4 className="font-semibold text-foreground truncate">{item.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">Last Discussed: {item.lastReviewed}</p>
        </div>
        
        <div className="flex-[4.6] min-w-0">
          {isEditing ? <textarea 
            defaultValue={item.comment} 
            className="w-full max-w-full p-3 rounded-lg border border-gray-100 bg-gray-25 resize-none min-h-[100px] text-sm break-words overflow-hidden whitespace-pre-wrap" 
            placeholder="Add your comment... (Type @Name to create an action)"
            onChange={handleTextareaChange}
            onBlur={e => handleCommentSubmit(e.target.value)} 
            onKeyDown={e => {
              if (e.key === "Enter" && e.ctrlKey) {
                handleCommentSubmit(e.currentTarget.value);
              }
              if (e.key === "Escape") {
                setIsEditing(false);
              }
            }} 
            autoFocus 
          /> : <button onClick={() => setIsEditing(true)} className="w-full max-w-full text-left p-3 rounded-lg bg-gray-25 hover:bg-gray-50 transition-colors text-sm min-h-[100px] flex items-start border border-gray-100 break-words overflow-hidden">
              <span className="break-words w-full whitespace-pre-wrap">{item.comment || "Click to add comment..."}</span>
            </button>}
        </div>
      </div>
      
      {isExpanded && <div className="mt-4 pt-4 border-t border-border space-y-4">
          {item.details && <div className="space-y-2">
              
              
            </div>}
          
          <div className="space-y-2">
            
          </div>
          
          {item.title.toLowerCase().includes('recruitment') && (
            <CapacityAnalytics />
          )}
          
          {item.title.toLowerCase().includes('staff') && (
            <StaffComplianceAnalytics />
          )}
          
        </div>}
    </div>;
};