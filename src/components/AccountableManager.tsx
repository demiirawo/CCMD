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
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");

  const addFromAttendees = (name: string) => {
    if (name && !accountable.includes(name)) {
      onChange([...accountable, name]);
      setShowAddForm(false);
    }
  };

  const addCustomPerson = () => {
    if (newPersonName.trim() && !accountable.includes(newPersonName.trim())) {
      onChange([...accountable, newPersonName.trim()]);
      setNewPersonName("");
      setShowAddForm(false);
    }
  };

  const removePerson = (index: number) => {
    onChange(accountable.filter((_, i) => i !== index));
  };

  const availableAttendees = attendees.filter(attendee => !accountable.includes(attendee));

  return (
    <div className="space-y-1 w-full max-w-[120px]">
      {/* Current accountable people */}
      {accountable.length > 0 && (
        <div className="space-y-1">
          {accountable.map((person, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs"
            >
              <span className="truncate flex-1">{person}</span>
              <button
                onClick={() => removePerson(index)}
                className="text-gray-500 hover:text-red-500 transition-colors ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add button or form */}
      {!showAddForm ? (
        <Button
          onClick={() => setShowAddForm(true)}
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs"
        >
          <Plus className="h-3 w-3" />
        </Button>
      ) : (
        <div className="space-y-1">
          {/* Select from attendees */}
          {availableAttendees.length > 0 && (
            <Select onValueChange={addFromAttendees}>
              <SelectTrigger className="h-8 text-xs bg-white">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {availableAttendees.map((attendee) => (
                  <SelectItem key={attendee} value={attendee} className="text-xs">
                    {attendee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Add custom person */}
          <div className="flex gap-1">
            <Input
              placeholder="Add person..."
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomPerson()}
              className="h-8 text-xs bg-white flex-1"
            />
            <Button
              onClick={addCustomPerson}
              size="sm"
              variant="outline"
              className="h-8 px-2"
              disabled={!newPersonName.trim()}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          <Button
            onClick={() => {
              setShowAddForm(false);
              setNewPersonName("");
            }}
            size="sm"
            variant="ghost"
            className="w-full h-6 text-xs"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};