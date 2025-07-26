import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  const [isOpen, setIsOpen] = useState(false);

  const addFromAttendees = (name: string) => {
    if (name && !accountable.includes(name)) {
      onChange([...accountable, name]);
    }
    setIsOpen(false);
  };

  const removePerson = (index: number) => {
    onChange(accountable.filter((_, i) => i !== index));
  };

  const availableAttendees = attendees.filter(attendee => !accountable.includes(attendee));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Current accountable people */}
      {accountable.map((person, index) => (
        <div
          key={index}
          className="flex items-center gap-1 bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm"
        >
          <span>{person}</span>
          <button
            onClick={() => removePerson(index)}
            className="text-gray-500 hover:text-red-500 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {/* Add button with dropdown */}
      {availableAttendees.length > 0 && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0 bg-white z-50" align="start">
            <div className="py-2">
              {availableAttendees.map((attendee) => (
                <button
                  key={attendee}
                  onClick={() => addFromAttendees(attendee)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                >
                  {attendee}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};