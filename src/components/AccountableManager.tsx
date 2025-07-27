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