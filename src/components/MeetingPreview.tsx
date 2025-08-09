import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Attendee {
  id: string;
  name: string;
  email?: string;
}

interface SectionItem {
  id: string;
  title: string;
  observation?: string;
  status?: "green" | "amber" | "red" | "na";
}

interface Section {
  id: string;
  title: string;
  items?: SectionItem[];
}

interface MeetingRecord {
  id: string;
  title: string;
  date: string;
  purpose?: string | null;
  attendees: Attendee[] | string;
  sections: Section[] | string;
}

function formatDate(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }) +
    " " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function MeetingPreview({ meetingId }: { meetingId: string }) {
  const { profile } = useAuth();
  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!profile?.company_id) return;
      try {
        const { data, error } = await supabase
          .from("meetings")
          .select("*")
          .eq("id", meetingId)
          .eq("company_id", profile.company_id)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          const parsed: MeetingRecord = {
            ...data,
            attendees: typeof data.attendees === "string" ? JSON.parse(data.attendees) : (data.attendees || []),
            sections: typeof data.sections === "string" ? JSON.parse(data.sections) : (data.sections || []),
          };
          setMeeting(parsed);
        }
      } catch (e) {
        console.error("Failed to load meeting", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [meetingId, profile?.company_id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading meeting preview…</div>
    );
  }

  if (!meeting) {
    return (
      <div className="p-8 text-center text-muted-foreground">Meeting not found</div>
    );
  }

  const attendees: Attendee[] = Array.isArray(meeting.attendees) ? meeting.attendees : [];
  const sections: Section[] = Array.isArray(meeting.sections) ? meeting.sections : [];

  // Extract facilitator: prefer purpose "Facilitated by: X", else from section item id/title
  const facilitatorFromPurpose = (meeting.purpose || "").replace(/^Facilitated by:\s*/i, "").trim();
  const facilitatorFromSection = sections
    .flatMap(s => s.items || [])
    .find(i => i.id === "facilitator" || /facilitator/i.test(i.title || ""))?.observation || "";
  const facilitator = facilitatorFromPurpose || facilitatorFromSection || "—";

  // Extract summary from agenda/meeting detail item
  const summary = sections
    .flatMap(s => s.items || [])
    .find(i => i.id === "agenda" || /meeting\s*(detail|summary)/i.test(i.title || ""))?.observation || "—";

  return (
    <div className="space-y-6 p-4">
      {/* Header: Title and Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Meeting Title</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full min-h-10 p-2 text-sm font-medium text-foreground bg-muted/20 border border-border/30 rounded">
              {meeting.title || "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Meeting Date & Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full min-h-10 p-2 text-sm text-foreground bg-muted/20 border border-border/30 rounded">
              {formatDate(meeting.date)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Facilitator */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Facilitator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full min-h-10 p-2 text-sm text-foreground bg-muted/20 border border-border/30 rounded">
            {facilitator}
          </div>
        </CardContent>
      </Card>

      {/* Attendees */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Attendees</CardTitle>
        </CardHeader>
        <CardContent>
          {attendees.length ? (
            <div className="flex flex-wrap gap-2">
              {attendees.map(a => (
                <Badge key={a.id} variant="secondary">
                  {a.name}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No attendees listed</div>
          )}
        </CardContent>
      </Card>

      {/* Meeting Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Meeting Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full min-h-24 p-3 text-sm text-foreground bg-muted/20 border border-border/30 rounded whitespace-pre-wrap break-words">
            {summary}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
