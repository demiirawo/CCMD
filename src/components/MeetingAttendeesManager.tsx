import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Check, X, Minus } from "lucide-react";
export interface Attendee {
  id: string;
  name: string;
  email: string;
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
      name: "",
      email: ""
    };
    onChange([...attendees, newAttendee]);
  };
  const removeAttendee = (id: string) => {
    onChange(attendees.filter(attendee => attendee.id !== id));
  };
  const updateAttendee = (id: string, field: 'name' | 'email' | 'attended', value: string | boolean) => {
    onChange(attendees.map(attendee => attendee.id === id ? {
      ...attendee,
      [field]: value
    } : attendee));
  };
  
  const toggleAttendance = (id: string, attended: boolean) => {
    updateAttendee(id, 'attended', attended);
  };
  return <div className="space-y-3">
      {attendees.map((attendee, index) => <div key={attendee.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
          <Input placeholder="Name" value={attendee.name} onChange={e => updateAttendee(attendee.id, 'name', e.target.value)} className="text-sm bg-white" />
          <div className="flex items-center gap-2">
            <Input placeholder="Email" type="email" value={attendee.email} onChange={e => updateAttendee(attendee.id, 'email', e.target.value)} className="text-sm bg-white" />
            <div className="flex gap-1">
              <button 
                onClick={() => toggleAttendance(attendee.id, true)}
                className={`p-1 hover:scale-110 transition-transform ${attendee.attended === true ? 'opacity-100' : 'opacity-30'}`}
                title="Present"
              >
                <Check className="h-4 w-4 text-green-600" />
              </button>
              <button 
                onClick={() => toggleAttendance(attendee.id, false)}
                className={`p-1 hover:scale-110 transition-transform ${attendee.attended === false ? 'opacity-100' : 'opacity-30'}`}
                title="Absent"
              >
                <X className="h-4 w-4 text-red-500" />
              </button>
            </div>
          </div>
          {attendees.length > 1 && <Button variant="ghost" size="sm" onClick={() => removeAttendee(attendee.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
              <Minus className="h-4 w-4" />
            </Button>}
        </div>)}
      
      <Button variant="outline" size="sm" onClick={addAttendee} className="w-full gap-2 text-sm bg-gray-400 hover:bg-gray-300">
        <Plus className="h-4 w-4" />
      </Button>
    </div>;
};