import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X } from "lucide-react";

interface AccountableManagerProps {
  accountable: string[];
  attendees: string[];
  onChange: (accountable: string[]) => void;
}

export const AccountableManager = ({
  accountable,
  attendees,
  onChange
}: AccountableManagerProps) => {
  const [newPersonName, setNewPersonName] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const addFromAttendees = (name: string) => {
    if (name && !accountable.includes(name)) {
      onChange([...accountable, name]);
    }
  };

  const addCustomPerson = () => {
    if (newPersonName.trim() && !accountable.includes(newPersonName.trim())) {
      onChange([...accountable, newPersonName.trim()]);
      setNewPersonName("");
      setIsPopoverOpen(false);
    }
  };

  const removePerson = (index: number) => {
    onChange(accountable.filter((_, i) => i !== index));
  };

  const availableAttendees = attendees.filter(attendee => !accountable.includes(attendee));

  return (
    <div className="space-y-2">
      {/* Current accountable people */}
      {accountable.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {accountable.map((person, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-muted text-foreground px-2 py-1 rounded-md text-sm"
            >
              <span>{person}</span>
              <button
                onClick={() => removePerson(index)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add from attendees */}
      {availableAttendees.length > 0 && (
        <div className="flex gap-2">
          <Select onValueChange={addFromAttendees}>
            <SelectTrigger className="flex-1 bg-background">
              <SelectValue placeholder="Select from attendees..." />
            </SelectTrigger>
            <SelectContent>
              {availableAttendees.map((attendee) => (
                <SelectItem key={attendee} value={attendee}>
                  {attendee}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Add custom person - popover with + button */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="w-8 h-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60" align="start">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Add Person</h4>
            <Input
              placeholder="Enter name..."
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomPerson()}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                onClick={addCustomPerson}
                size="sm"
                disabled={!newPersonName.trim()}
                className="flex-1"
              >
                Add
              </Button>
              <Button
                onClick={() => setIsPopoverOpen(false)}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};