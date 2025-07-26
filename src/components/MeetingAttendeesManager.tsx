import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
export interface Attendee {
  id: string;
  name: string;
  email: string;
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
  const updateAttendee = (id: string, field: 'name' | 'email', value: string) => {
    onChange(attendees.map(attendee => attendee.id === id ? {
      ...attendee,
      [field]: value
    } : attendee));
  };
  return <div className="space-y-3">
      {attendees.map((attendee, index) => <div key={attendee.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          <Input placeholder="Name" value={attendee.name} onChange={e => updateAttendee(attendee.id, 'name', e.target.value)} className="text-sm bg-white" />
          <Input placeholder="Email" type="email" value={attendee.email} onChange={e => updateAttendee(attendee.id, 'email', e.target.value)} className="text-sm bg-white" />
          {attendees.length > 1 && <Button variant="ghost" size="sm" onClick={() => removeAttendee(attendee.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>}
        </div>)}
      
      <Button variant="outline" size="sm" onClick={addAttendee} className="w-full gap-2 text-sm bg-purple-600 hover:bg-purple-500">
        <Plus className="h-4 w-4" />
      </Button>
    </div>;
};