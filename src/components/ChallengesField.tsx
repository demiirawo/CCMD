import { useState, useRef, useEffect } from "react";

interface ChallengesFieldProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  itemId: string;
}

export const ChallengesField = ({ value, onChange, readOnly = false, itemId }: ChallengesFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Auto-save with debounce
  useEffect(() => {
    if (!isEditing) return;
    
    const timeoutId = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [localValue, onChange, value, isEditing]);

  const handleEdit = () => {
    if (readOnly) return;
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleSave = () => {
    onChange(localValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSave();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      handleSave();
    }, 100);
  };

  const labelText = itemId === "achievements-learning" ? "CHALLENGES" : "ADDITIONAL NOTES";

  if (readOnly) {
    return (
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-0.5 block">
          {labelText}
        </label>
        <div className="w-full p-3 rounded-lg text-sm min-h-[40px] flex items-start border border-border/30 bg-muted/20">
          <span className="break-words w-full whitespace-pre-wrap">
            {value || `No ${labelText.toLowerCase()}`}
          </span>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-0.5 block">
          {labelText}
        </label>
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full p-3 rounded-lg border border-border bg-background resize-none min-h-[40px] text-sm text-black"
          placeholder=""
          autoFocus
        />
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-0.5 block">
        {labelText}
      </label>
      <button 
        onClick={handleEdit}
        className="w-full text-left p-3 rounded-lg transition-colors text-sm min-h-[40px] flex items-start border border-border/30 break-words overflow-hidden bg-white text-black hover:border-border/40 focus:outline-none focus:ring-2 focus:ring-border/30"
      >
        <span className="break-words w-full whitespace-pre-wrap">
          {value || ""}
        </span>
      </button>
    </div>
  );
};