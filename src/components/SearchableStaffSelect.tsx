import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface StaffOption {
  id: string;
  name: string;
  score: number;
}

interface SearchableStaffSelectProps {
  options: StaffOption[];
  onSelect: (staffId: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

export const SearchableStaffSelect = ({
  options,
  onSelect,
  placeholder = "Select staff...",
  className,
  triggerClassName
}: SearchableStaffSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Sort by score (highest first for best match) and filter by search
  const filteredOptions = useMemo(() => {
    const sorted = [...options].sort((a, b) => b.score - a.score);
    if (!searchQuery.trim()) return sorted;
    return sorted.filter(opt => 
      opt.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const handleSelect = (staffId: string) => {
    onSelect(staffId);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between h-8 text-xs font-normal bg-white", triggerClassName)}
        >
          <span className="text-muted-foreground truncate">{placeholder}</span>
          <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0 bg-white z-50", className)} align="start">
        <div className="p-2 border-b">
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50">
            <Search className="h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 border-0 bg-transparent p-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
        <Command>
          <CommandList className="max-h-[200px]">
            <CommandEmpty className="py-3 text-center text-xs text-muted-foreground">
              No staff found.
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={opt.id}
                  onSelect={() => handleSelect(opt.id)}
                  className="cursor-pointer text-xs"
                >
                  <span>{opt.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
