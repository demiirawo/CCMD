import { useState, useRef, useEffect } from "react";

interface TrendAnalysisFieldProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export const TrendAnalysisField = ({ value, onChange, readOnly = false }: TrendAnalysisFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

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

  if (readOnly) {
    return (
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-0.5 block">TREND ANALYSIS</label>
        <div className="w-full p-3 rounded-lg text-sm min-h-[160px] flex items-start border border-border/30 bg-muted/20">
          <span className="break-words w-full whitespace-pre-wrap">
            {value || "No trend analysis"}
          </span>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-0.5 block">TREND ANALYSIS</label>
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full p-3 rounded-lg border border-border bg-background resize-none min-h-[160px] text-sm text-black"
          placeholder=""
          autoFocus
        />
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-0.5 block">TREND ANALYSIS</label>
      <button 
        onClick={handleEdit}
        className="w-full text-left p-3 rounded-lg transition-colors text-sm min-h-[80px] flex items-start border border-border/30 break-words overflow-hidden bg-white text-black hover:border-border/40 focus:outline-none focus:ring-2 focus:ring-border/30"
      >
        <span className="break-words w-full whitespace-pre-wrap">
          {value || ""}
        </span>
      </button>
    </div>
  );
};
