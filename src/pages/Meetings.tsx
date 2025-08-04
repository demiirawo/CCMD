import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MeetingDateTimePicker } from "@/components/MeetingDateTimePicker";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
export const Meetings = () => {
  const {
    profile
  } = useAuth();
  const [meetingData, setMeetingData] = useState({
    title: "",
    dateTime: "",
    facilitator: "",
    attendance: "",
    agenda: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const handleInputChange = (field: string, value: string) => {
    setMeetingData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const getQuarter = (date: Date) => {
    const month = date.getMonth() + 1;
    if (month <= 3) return 'Q1';
    if (month <= 6) return 'Q2';
    if (month <= 9) return 'Q3';
    return 'Q4';
  };
  const handleSave = async () => {
    console.log("Save button clicked!", meetingData);
    // Basic validation
    if (!meetingData.title || !meetingData.dateTime || !meetingData.facilitator) {
      toast({
        title: "Validation Error",
        description: "Please fill in the required fields: Title, Date & Time, and Facilitator",
        variant: "destructive"
      });
      return;
    }
    if (!profile?.company_id) {
      toast({
        title: "Error",
        description: "No company selected",
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      // Parse the dateTime string correctly (format: dd/MM/yyyy HH:mm)
      const [datePart, timePart] = meetingData.dateTime.split(' ');
      const [day, month, year] = datePart.split('/').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);

      // Create date with correct month (month is 0-indexed in JavaScript)
      const meetingDate = new Date(year, month - 1, day, hours, minutes);
      const quarter = getQuarter(meetingDate);
      const meetingYear = meetingDate.getFullYear();

      // Convert attendance text to attendees array
      const attendeesArray = meetingData.attendance.split('\n').filter(line => line.trim()).map((name, index) => ({
        id: `attendee-${index}`,
        name: name.trim(),
        email: ""
      }));

      // Create sections structure with meeting detail
      const sections = [{
        id: "meeting-details",
        title: "Meeting Details",
        items: [{
          id: "facilitator",
          title: "Facilitator",
          status: "green",
          lastReviewed: "",
          observation: meetingData.facilitator,
          actions: [],
          details: "",
          metadata: {}
        }, {
          id: "agenda",
          title: "Meeting Detail",
          status: "green",
          lastReviewed: "",
          observation: meetingData.agenda,
          actions: [],
          details: "",
          metadata: {}
        }]
      }];
      const meetingPayload = {
        title: meetingData.title,
        date: meetingDate.toISOString(),
        quarter,
        year: meetingYear,
        company_id: profile.company_id,
        purpose: `Facilitated by: ${meetingData.facilitator}`,
        attendees: JSON.stringify(attendeesArray),
        sections: JSON.stringify(sections),
        actions_log: JSON.stringify([])
      };
      const {
        error
      } = await supabase.from('meetings').insert(meetingPayload);
      if (error) {
        console.error('Error saving meeting:', error);
        toast({
          title: "Save Failed",
          description: "Failed to save the meeting. Please try again.",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "Success",
        description: "Meeting has been saved successfully and will appear in Reports"
      });

      // Clear the form after successful save
      setMeetingData({
        title: "",
        dateTime: "",
        facilitator: "",
        attendance: "",
        agenda: ""
      });
    } catch (error) {
      console.error('Error saving meeting:', error);
      toast({
        title: "Save Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  return <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto p-6 pt-20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2 ml-auto">
            <Button onClick={() => {
            console.log("Button clicked - calling handleSave");
            handleSave();
          }} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <div style={{
        backgroundColor: '#DFE1E3'
      }} className="rounded-lg p-6 px-[20px] py-[29px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Meeting Title Card */}
            <Card className="bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="font-medium text-base text-stone-950">Meeting Title</CardTitle>
              </CardHeader>
              <CardContent>
                <Input value={meetingData.title} onChange={e => handleInputChange("title", e.target.value)} className="text-base" />
              </CardContent>
            </Card>

            {/* Meeting Date & Time Card */}
            <Card className="bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="font-medium text-base text-stone-950">Meeting Date & Time</CardTitle>
              </CardHeader>
              <CardContent>
                <MeetingDateTimePicker value={meetingData.dateTime} onChange={value => handleInputChange("dateTime", value)} />
              </CardContent>
            </Card>

            {/* Meeting Attendees Card */}
            <Card className="bg-white">
              <CardHeader className="pb-4">
                
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="facilitator">Meeting Facilitator *</Label>
                  <Input id="facilitator" value={meetingData.facilitator} onChange={e => handleInputChange("facilitator", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendance">Attendees</Label>
                  <Textarea id="attendance" value={meetingData.attendance} onChange={e => handleInputChange("attendance", e.target.value)} className="min-h-[120px]" />
                </div>
              </CardContent>
            </Card>

            {/* Meeting Summary Card */}
            <Card className="bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="font-medium text-base text-stone-950">Meeting Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={meetingData.agenda} onChange={e => handleInputChange("agenda", e.target.value)} className="min-h-[200px]" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>;
};