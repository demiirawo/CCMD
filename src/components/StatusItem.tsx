import { StatusBadge, StatusType } from "./StatusBadge";
import { CapacityAnalytics } from "./CapacityAnalytics";
import { StaffComplianceAnalytics } from "./StaffComplianceAnalytics";
import { ChevronDown, ChevronRight, Calendar, Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";

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
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const handleCommentSubmit = (comment: string) => {
    // Detect completed actions in format: @name action due:date
    const actionRegex = /@(\w+)\s+(.+?)\s+due:(\d{4}-\d{2}-\d{2})/g;
    let match;
    
    while ((match = actionRegex.exec(comment)) !== null) {
      const [, mentionedName, action, dueDate] = match;
      const attendee = attendees.find(a => 
        a.toLowerCase().includes(mentionedName.toLowerCase())
      );
      
      if (attendee && action.trim()) {
        onActionCreated?.(item.title, mentionedName, comment, action.trim(), dueDate);
      }
    }
    
    onCommentChange?.(item.id, comment);
    setIsEditing(false);
    setShowMentionDropdown(false);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setShowMentionDropdown(true);
      
      // Calculate dropdown position
      const textarea = e.target;
      const rect = textarea.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    } else {
      setShowMentionDropdown(false);
    }
  };

  const selectMention = (attendee: string, textareaElement: HTMLTextAreaElement) => {
    const value = textareaElement.value;
    const cursorPosition = textareaElement.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    // Find the @ position
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const mentionStart = textBeforeCursor.lastIndexOf('@');
      const beforeMention = value.substring(0, mentionStart);
      const template = `@${attendee} [action] due:[click for date]`;
      const newValue = beforeMention + template + textAfterCursor;
      
      textareaElement.value = newValue;
      textareaElement.focus();
      
      // Position cursor at [action]
      const actionStart = beforeMention.length + template.indexOf('[action]');
      textareaElement.setSelectionRange(actionStart, actionStart + 8);
    }
    
    setShowMentionDropdown(false);
  };

  const insertDate = (date: Date, textareaElement: HTMLTextAreaElement) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    const value = textareaElement.value;
    const newValue = value.replace('[click for date]', formattedDate);
    textareaElement.value = newValue;
    textareaElement.focus();
  };

  const filteredAttendees = attendees.filter(attendee =>
    attendee.toLowerCase().includes(mentionQuery.toLowerCase())
  );

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
            <div className="relative">
              <textarea 
                ref={(el) => {
                  if (el) {
                    // Handle date picker clicks
                    el.addEventListener('click', (e) => {
                      const target = e.target as HTMLTextAreaElement;
                      const cursorPosition = target.selectionStart;
                      const value = target.value;
                      const clickText = value.substring(cursorPosition - 15, cursorPosition + 1);
                      
                      if (clickText.includes('[click for date]')) {
                        // Show date picker
                        const dateButton = document.getElementById(`date-picker-${item.id}`);
                        if (dateButton) {
                          dateButton.click();
                        }
                      }
                    });
                  }
                }}
                defaultValue={item.comment} 
                className="w-full max-w-full p-3 rounded-lg border border-gray-100 bg-gray-25 resize-none min-h-[100px] text-sm break-words overflow-hidden whitespace-pre-wrap" 
                placeholder="Type @ to mention someone and create an action..."
                onChange={handleTextareaChange}
                onBlur={(e) => {
                  setTimeout(() => {
                    if (!showMentionDropdown) {
                      handleCommentSubmit(e.target.value);
                    }
                  }, 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleCommentSubmit(e.currentTarget.value);
                  }
                  if (e.key === "Escape") {
                    setIsEditing(false);
                    setShowMentionDropdown(false);
                  }
                }} 
                autoFocus 
              />
              
              {/* Mention Dropdown */}
              {showMentionDropdown && filteredAttendees.length > 0 && (
                <div 
                  className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto min-w-[200px]"
                  style={{
                    top: dropdownPosition.top,
                    left: dropdownPosition.left
                  }}
                >
                  {filteredAttendees.map((attendee, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm first:rounded-t-lg last:rounded-b-lg"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                        if (textarea) {
                          selectMention(attendee, textarea);
                        }
                      }}
                    >
                      {attendee}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Hidden Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id={`date-picker-${item.id}`}
                    variant="ghost"
                    className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
                  >
                    <Calendar />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    onSelect={(date) => {
                      if (date) {
                        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                        if (textarea) {
                          insertDate(date, textarea);
                        }
                      }
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditing(true)} 
              className="w-full max-w-full text-left p-3 rounded-lg bg-gray-25 hover:bg-gray-50 transition-colors text-sm min-h-[100px] flex items-start border border-gray-100 break-words overflow-hidden"
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
