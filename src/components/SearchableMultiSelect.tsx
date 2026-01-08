import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  name: string;
  subtitle?: string;
}

interface SearchableMultiSelectProps {
  options: Option[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  allLabel?: string;
  className?: string;
}

export const SearchableMultiSelect = ({
  options,
  selectedIds,
  onSelectionChange,
  placeholder = "Select items...",
  emptyMessage = "No items found.",
  allLabel = "All Items",
  className,
}: SearchableMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Ensure selectedIds is always an array
  const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (option.subtitle && option.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isAllSelected = safeSelectedIds.length === 0;

  const handleSelectAll = () => {
    onSelectionChange([]);
    setOpen(false);
  };

  const handleToggleItem = (id: string) => {
    if (safeSelectedIds.includes(id)) {
      const newIds = safeSelectedIds.filter(i => i !== id);
      onSelectionChange(newIds);
    } else {
      onSelectionChange([...safeSelectedIds, id]);
    }
  };

  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(safeSelectedIds.filter(i => i !== id));
  };

  const getDisplayText = () => {
    if (safeSelectedIds.length === 0) {
      return allLabel;
    }
    if (safeSelectedIds.length === 1) {
      const item = options.find(o => o.id === safeSelectedIds[0]);
      return item?.name || placeholder;
    }
    return `${safeSelectedIds.length} selected`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between bg-white min-w-[200px]", className)}
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 bg-white z-50" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="bg-white"
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={handleSelectAll}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    isAllSelected ? "opacity-100" : "opacity-0"
                  )}
                />
                {allLabel}
              </CommandItem>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.id}
                  onSelect={() => handleToggleItem(option.id)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      safeSelectedIds.includes(option.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{option.name}</span>
                    {option.subtitle && (
                      <span className="text-xs text-muted-foreground">{option.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {safeSelectedIds.length > 0 && (
          <div className="border-t p-2 flex flex-wrap gap-1">
            {safeSelectedIds.slice(0, 3).map(id => {
              const item = options.find(o => o.id === id);
              return (
                <Badge key={id} variant="secondary" className="text-xs">
                  {item?.name}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={(e) => handleRemoveItem(id, e)}
                  />
                </Badge>
              );
            })}
            {safeSelectedIds.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{safeSelectedIds.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
