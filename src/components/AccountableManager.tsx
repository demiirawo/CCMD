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
  const addFromAttendees = (name: string) => {
    if (name && !accountable.includes(name)) {
      onChange([...accountable, name]);
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
      {/* Current accountable people */}
      {accountable.length > 0 && <div className="flex flex-wrap gap-2">
          {accountable.map((person, index) => <div key={index} className="flex items-center gap-1 bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm">
              <span>{person}</span>
              <button onClick={() => removePerson(index)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </div>)}
        </div>}

      {/* Add from attendees */}
      {availableAttendees.length > 0 && <div className="flex gap-2">
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
        </div>}

      {/* Add custom person - just + icon */}
      <div className="flex gap-2">
        
        
      </div>
    </div>;
};