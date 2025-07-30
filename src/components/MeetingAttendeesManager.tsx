import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Minus } from "lucide-react";
export interface Attendee {
  id: string;
  name: string;
  attended?: boolean;
}
interface MeetingAttendeesManagerProps {
  attendees: Attendee[];
  onChange: (attendees: Attendee[]) => void;
}
export const MeetingAttendeesManager = ({
  attendees,
  onChange
}: MeetingAttendeesManagerProps) => {
  const addAttendee = () => {
    const newAttendee: Attendee = {
      id: `attendee-${Date.now()}`,
      name: ""
    };
    onChange([...attendees, newAttendee]);
  };
  const removeAttendee = (id: string) => {
    onChange(attendees.filter(attendee => attendee.id !== id));
  };
  const updateAttendee = (id: string, field: 'name' | 'attended', value: string | boolean) => {
    onChange(attendees.map(attendee => attendee.id === id ? {
      ...attendee,
      [field]: value
    } : attendee));
  };
  const toggleAttendance = (id: string, attended: boolean) => {
    updateAttendee(id, 'attended', attended);
  };
  return <div className="space-y-3">
      {attendees.map((attendee, index) => <div key={attendee.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
          <Input 
            placeholder="Name" 
            value={attendee.name} 
            onChange={e => updateAttendee(attendee.id, 'name', e.target.value)} 
            className="text-sm bg-white" 
          />
          
          <div className="flex gap-1">
            <button 
              onClick={() => toggleAttendance(attendee.id, true)} 
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                attendee.attended === true 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-green-50'
              }`}
              title="Mark as present"
            >
              Present
            </button>
            <button 
              onClick={() => toggleAttendance(attendee.id, false)} 
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                attendee.attended === false 
                  ? 'bg-red-100 text-red-700 border border-red-300' 
                  : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-red-50'
              }`}
              title="Mark as absent"
            >
              Absent
            </button>
          </div>
          
          {attendees.length > 1 && <Button variant="ghost" size="sm" onClick={() => removeAttendee(attendee.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
              <Minus className="h-4 w-4" />
            </Button>}
        </div>)}
      
      <Button variant="default" size="sm" onClick={addAttendee} className="w-full gap-2 text-sm">
        <Plus className="h-4 w-4" />
      </Button>
    </div>;
};