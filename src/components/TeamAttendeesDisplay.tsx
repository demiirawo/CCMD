import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Attendee {
  id: string;
  name: string;
  email?: string;
  attended?: boolean;
}

interface TeamAttendeesDisplayProps {
  onAttendanceChange?: (attendees: Attendee[]) => void;
  readOnly?: boolean;
}

export const TeamAttendeesDisplay = ({ onAttendanceChange, readOnly = false }: TeamAttendeesDisplayProps) => {
  const { profile } = useAuth();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, [profile?.company_id]);

  const fetchTeamMembers = async () => {
    if (!profile?.company_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, name, email')
        .eq('company_id', profile.company_id)
        .order('name', { ascending: true });

      if (error) throw error;

      const teamAttendees: Attendee[] = (data || []).map(member => ({
        id: member.id,
        name: member.name,
        email: member.email || '',
        attended: undefined // Default to no attendance marked
      }));

      setAttendees(teamAttendees);
      onAttendanceChange?.(teamAttendees);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (id: string, attended: boolean) => {
    const updatedAttendees = attendees.map(attendee => 
      attendee.id === id ? { ...attendee, attended } : attendee
    );
    setAttendees(updatedAttendees);
    onAttendanceChange?.(updatedAttendees);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading team members...</div>;
  }

  if (attendees.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No team members found. Add team members in Settings to track meeting attendance.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {attendees.map((attendee) => (
        <div key={attendee.id} className="grid grid-cols-[1fr_auto] gap-2 items-center">
          <div className="text-sm font-medium bg-white px-3 py-2 rounded border border-gray-200">
            {attendee.name}
          </div>
          
          {readOnly ? (
            <div className="flex gap-1">
              <span className={`px-3 py-1 text-xs font-medium rounded ${
                attendee.attended === true 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                Present
              </span>
              <span className={`px-3 py-1 text-xs font-medium rounded ${
                attendee.attended === false 
                  ? 'bg-red-100 text-red-700 border border-red-300' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                Absent
              </span>
            </div>
          ) : (
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
          )}
        </div>
      ))}
    </div>
  );
};