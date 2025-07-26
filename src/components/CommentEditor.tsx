import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Calendar } from "lucide-react";

interface CommentEditorProps {
  initialValue: string;
  attendees: string[];
  onSubmit: (comment: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

interface MentionDropdownProps {
  attendees: string[];
  position: { top: number; left: number };
  query: string;
  onSelect: (attendee: string) => void;
  visible: boolean;
}

interface DatePickerPopoverProps {
  trigger: React.ReactNode;
  onDateSelect: (date: Date) => void;
}

const MentionDropdown = ({ attendees, position, query, onSelect, visible }: MentionDropdownProps) => {
  const filteredAttendees = attendees.filter(attendee =>
    attendee.toLowerCase().includes(query.toLowerCase())
  );

  if (!visible || filteredAttendees.length === 0) return null;

  return (
    <div 
      className="fixed z-50 bg-background border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto min-w-[200px]"
      style={{
        top: position.top,
        left: position.left
      }}
    >
      {filteredAttendees.map((attendee, index) => (
        <button
          key={index}
          className="w-full text-left px-3 py-2 hover:bg-accent text-sm first:rounded-t-lg last:rounded-b-lg"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(attendee);
          }}
        >
          {attendee}
        </button>
      ))}
    </div>
  );
};

const DatePickerPopover = ({ trigger, onDateSelect }: DatePickerPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          mode="single"
          onSelect={(date) => {
            if (date) {
              onDateSelect(date);
            }
          }}
          initialFocus
          className="p-3 pointer-events-auto"
          disabled={(date) => date < new Date()}
        />
      </PopoverContent>
    </Popover>
  );
};

export const CommentEditor = ({ 
  initialValue, 
  attendees, 
  onSubmit, 
  onCancel, 
  placeholder = "Type @ to mention someone and create an action..." 
}: CommentEditorProps) => {
  const [value, setValue] = useState(initialValue);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [datePickerKey, setDatePickerKey] = useState(0);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setShowMentionDropdown(true);
      
      // Calculate dropdown position
      const rect = e.target.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX
      });
    } else {
      setShowMentionDropdown(false);
    }
  };

  const selectMention = (attendee: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    // Find the @ position
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const mentionStart = textBeforeCursor.lastIndexOf('@');
      const beforeMention = value.substring(0, mentionStart);
      const template = `@${attendee} [action] due:📅`;
      const newValue = beforeMention + template + textAfterCursor;
      
      setValue(newValue);
      setShowMentionDropdown(false);
      
      // Focus and position cursor at [action]
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const actionStart = beforeMention.length + template.indexOf('[action]');
          textareaRef.current.setSelectionRange(actionStart, actionStart + 8);
        }
      }, 0);
    }
  };

  const handleDateClick = () => {
    // Force re-render of date picker to ensure it opens
    setDatePickerKey(prev => prev + 1);
  };

  const insertDate = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    const newValue = value.replace('📅', formattedDate);
    setValue(newValue);
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmit = () => {
    onSubmit(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSubmit();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Only submit if not interacting with dropdown or date picker
    setTimeout(() => {
      if (!showMentionDropdown && !document.querySelector('[data-radix-popper-content-wrapper]')) {
        handleSubmit();
      }
    }, 200);
  };

  return (
    <div className="relative">
      <textarea 
        ref={textareaRef}
        value={value}
        className="w-full p-3 rounded-lg border border-border bg-background resize-none min-h-[100px] text-sm" 
        placeholder={placeholder}
        onChange={handleTextareaChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={(e) => {
          const target = e.target as HTMLTextAreaElement;
          const cursorPosition = target.selectionStart;
          const char = value.charAt(cursorPosition) || value.charAt(cursorPosition - 1);
          
          if (char === '📅') {
            handleDateClick();
          }
        }}
        autoFocus 
      />
      
      <MentionDropdown
        attendees={attendees}
        position={dropdownPosition}
        query={mentionQuery}
        onSelect={selectMention}
        visible={showMentionDropdown}
      />
      
      <DatePickerPopover
        key={datePickerKey}
        trigger={
          <Button
            variant="ghost"
            className="absolute -top-10 -left-10 w-0 h-0 opacity-0 pointer-events-auto"
            onClick={handleDateClick}
          >
            <Calendar />
          </Button>
        }
        onDateSelect={insertDate}
      />
    </div>
  );
};