import { useState, useRef, useEffect } from "react";

interface CommentEditorProps {
  initialValue: string;
  onSubmit: (comment: string) => void;
  onCancel: () => void;
  placeholder?: string;
  isActionEditor?: boolean;
  autoSave?: boolean;
  onAutoSave?: (value: string) => void;
}

export const CommentEditor = ({ 
  initialValue, 
  onSubmit, 
  onCancel, 
  placeholder = "Type your comment...",
  isActionEditor = false,
  autoSave = false,
  onAutoSave
}: CommentEditorProps) => {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save functionality with debounce
  useEffect(() => {
    if (!autoSave || !onAutoSave) return;
    
    const timeoutId = setTimeout(() => {
      if (value !== initialValue) {
        onAutoSave(value);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [value, autoSave, onAutoSave, initialValue]);

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

  const handleBlur = () => {
    setTimeout(() => {
      handleSubmit();
    }, 100);
  };

  // Format actions for display
  const formatDisplayValue = (text: string) => {
    if (!isActionEditor) return text;
    
    // Replace captured actions with styled version
    return text.replace(/@([^,]+),([^,]+),([^@\n]+)/g, (match, name, action, date) => {
      return `@${name.trim()},${action.trim()},${date.trim()}`;
    });
  };

  return (
    <div className="relative">
      <textarea 
        ref={textareaRef}
        value={value}
        className="w-full p-3 rounded-lg border border-border bg-background resize-none min-h-[100px] text-sm" 
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus 
      />
      {isActionEditor && (
        <div className="absolute inset-0 p-3 pointer-events-none whitespace-pre-wrap text-sm leading-[1.4] overflow-hidden">
          <div 
            dangerouslySetInnerHTML={{
              __html: value.replace(/@([^,]+),([^,]+),([^@\n]+)/g, 
                '<span style="color: #2563eb; font-weight: bold; font-style: italic;">@$1,$2,$3</span>'
              )
            }}
          />
        </div>
      )}
    </div>
  );
};