import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [showAdditionalSelect, setShowAdditionalSelect] = useState(false);

  const addFromAttendees = (name: string) => {
    if (name && !accountable.includes(name)) {
      onChange([...accountable, name]);
      setShowAdditionalSelect(false);
    }
  };

  const addAdditionalPerson = (name: string) => {
    if (name && !accountable.includes(name)) {
      onChange([...accountable, name]);
      setShowAdditionalSelect(false);
    }
  };

  const addCustomPerson = () => {
    if (newPersonName.trim() && !accountable.includes(newPersonName.trim())) {
      onChange([...accountable, newPersonName.trim()]);
      setNewPersonName("");
    }
  };
  const removePerson = (index: number) => {
    onChange(accountable.filter((_, i) => i !== index));
  };
  const availableAttendees = attendees.filter(attendee => !accountable.includes(attendee));
  return <div className="space-y-2">
      {/* Label and dropdown on same line */}
      <div className="flex items-center gap-2 ml-0">
        <label className="text-xs font-medium text-muted-foreground">ACCOUNTABLE:</label>
        <Select onValueChange={addFromAttendees}>
          <SelectTrigger className="flex-1 bg-white">
            <SelectValue placeholder="Select from attendees..." />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {availableAttendees.map(attendee => <SelectItem key={attendee} value={attendee}>
                {attendee}
              </SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Plus button below dropdown */}
      {availableAttendees.length > 0 && (
        <div className="flex justify-start">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAdditionalSelect(!showAdditionalSelect)}
            className="h-6 w-6 p-0 text-blue-500 hover:bg-blue-50"
            title="Add another person"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Additional select when + is clicked */}
      {showAdditionalSelect && availableAttendees.length > 0 && (
        <div className="ml-4">
          <Select onValueChange={addAdditionalPerson}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select another person..." />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {availableAttendees.map(attendee => <SelectItem key={attendee} value={attendee}>
                  {attendee}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Current accountable people - shown as a vertical list */}
      {accountable.length > 0 && (
        <div className="space-y-1">
          {accountable.map((person, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
              <span className="text-sm text-gray-800">{person}</span>
              <button 
                onClick={() => removePerson(index)} 
                className="text-gray-500 hover:text-red-500 transition-colors"
                title="Remove person"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>;
};