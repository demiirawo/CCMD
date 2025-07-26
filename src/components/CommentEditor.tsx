import { useState, useRef } from "react";

interface CommentEditorProps {
  initialValue: string;
  onSubmit: (comment: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

export const CommentEditor = ({ 
  initialValue, 
  onSubmit, 
  onCancel, 
  placeholder = "Type actions in format: @'Name' / Action / Date" 
}: CommentEditorProps) => {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    </div>
  );
};