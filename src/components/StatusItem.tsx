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
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);

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
    setShowMentionDropdown(false);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Check for @ mentions to show dropdown
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setShowMentionDropdown(true);
      
      // Calculate dropdown position
      const textarea = e.target;
      const textMetrics = getCaretCoordinates(textarea, cursorPosition);
      setDropdownPosition({
        top: textMetrics.top + 20,
        left: textMetrics.left
      });
    } else {
      setShowMentionDropdown(false);
    }
  };

  const selectMention = (attendee: string) => {
    if (!textareaRef) return;
    
    const value = textareaRef.value;
    const cursorPosition = textareaRef.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    // Find the @ position
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const mentionStart = textBeforeCursor.lastIndexOf('@');
      const beforeMention = value.substring(0, mentionStart);
      const template = `@${attendee} Action: [Enter action here] Date Due: [Enter date here]`;
      const newValue = beforeMention + template + textAfterCursor;
      
      textareaRef.value = newValue;
      textareaRef.focus();
      
      // Position cursor at the first bracket
      const actionStart = beforeMention.length + template.indexOf('[Enter action here]');
      textareaRef.setSelectionRange(actionStart, actionStart + 19); // Select "[Enter action here]"
    }
    
    setShowMentionDropdown(false);
  };

  const filteredAttendees = attendees.filter(attendee =>
    attendee.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Simple function to get caret coordinates (basic implementation)
  const getCaretCoordinates = (textarea: HTMLTextAreaElement, position: number) => {
    const div = document.createElement('div');
    const style = getComputedStyle(textarea);
    
    // Copy textarea styles to div
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.font = style.font;
    div.style.padding = style.padding;
    div.style.border = style.border;
    div.style.width = style.width;
    
    document.body.appendChild(div);
    
    const textBeforeCaret = textarea.value.substring(0, position);
    div.textContent = textBeforeCaret;
    
    const span = document.createElement('span');
    span.textContent = '|';
    div.appendChild(span);
    
    const coordinates = {
      top: span.offsetTop,
      left: span.offsetLeft
    };
    
    document.body.removeChild(div);
    return coordinates;
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
        
        <div className="flex-[4.6] min-w-0 relative">
          {isEditing ? (
            <div className="relative">
              <textarea 
                ref={setTextareaRef}
                defaultValue={item.comment} 
                className="w-full max-w-full p-3 rounded-lg border border-gray-100 bg-gray-25 resize-none min-h-[100px] text-sm break-words overflow-hidden whitespace-pre-wrap" 
                placeholder="Add your comment... (Type @ to mention someone and create an action)"
                onChange={handleTextareaChange}
                onBlur={e => {
                  // Delay to allow dropdown clicks
                  setTimeout(() => {
                    if (!showMentionDropdown) {
                      handleCommentSubmit(e.target.value);
                    }
                  }, 200);
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleCommentSubmit(e.currentTarget.value);
                  }
                  if (e.key === "Escape") {
                    setIsEditing(false);
                    setShowMentionDropdown(false);
                  }
                  if (e.key === "ArrowDown" && showMentionDropdown) {
                    e.preventDefault();
                  }
                  if (e.key === "ArrowUp" && showMentionDropdown) {
                    e.preventDefault();
                  }
                }} 
                autoFocus 
              />
              
              {/* Mention Dropdown */}
              {showMentionDropdown && filteredAttendees.length > 0 && (
                <div 
                  className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"
                  style={{
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    minWidth: '200px'
                  }}
                >
                  {filteredAttendees.map((attendee, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 text-sm first:rounded-t-lg last:rounded-b-lg"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur
                        selectMention(attendee);
                      }}
                    >
                      {attendee}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="w-full max-w-full text-left p-3 rounded-lg bg-gray-25 hover:bg-gray-50 transition-colors text-sm min-h-[100px] flex items-start border border-gray-100 break-words overflow-hidden">
              <span className="break-words w-full whitespace-pre-wrap">{item.comment || "Click to add comment..."}</span>
            </button>
          )}
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