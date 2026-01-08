import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const TagInput = ({ tags, onChange, placeholder = "Add item...", className = "" }: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={className}>
      <div className="flex gap-2 mb-2">
        <Input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="bg-white border-gray-800 flex-1"
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="border-gray-800 shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemove(tag)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
