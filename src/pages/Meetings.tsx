import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MeetingDateTimePicker } from "@/components/MeetingDateTimePicker";
import { toast } from "@/hooks/use-toast";
export const Meetings = () => {
  const [meetingData, setMeetingData] = useState({
    title: "",
    dateTime: "",
    facilitator: "",
    attendance: "",
    agenda: ""
  });
  const handleInputChange = (field: string, value: string) => {
    setMeetingData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSave = () => {
    // Basic validation
    if (!meetingData.title || !meetingData.dateTime || !meetingData.facilitator) {
      toast({
        title: "Validation Error",
        description: "Please fill in the required fields: Title, Date & Time, and Facilitator",
        variant: "destructive"
      });
      return;
    }

    // TODO: Save to database
    toast({
      title: "Success",
      description: "Meeting has been saved successfully"
    });
  };
  const handleClear = () => {
    setMeetingData({
      title: "",
      dateTime: "",
      facilitator: "",
      attendance: "",
      agenda: ""
    });
    toast({
      title: "Cleared",
      description: "Meeting form has been cleared"
    });
  };
  return <div className="min-h-screen bg-background pt-20">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          
          
        </div>

        <Card className="bg-stone-50">
          <CardHeader className="bg-stone-50">
            
          </CardHeader>
          <CardContent className="space-y-6 bg-stone-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title *</Label>
                <Input id="title" value={meetingData.title} onChange={e => handleInputChange("title", e.target.value)} placeholder="Enter meeting title" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTime">Meeting Date & Time *</Label>
                <MeetingDateTimePicker value={meetingData.dateTime} onChange={value => handleInputChange("dateTime", value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facilitator">Meeting Facilitator *</Label>
                <Input id="facilitator" value={meetingData.facilitator} onChange={e => handleInputChange("facilitator", e.target.value)} placeholder="Enter facilitator name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendance">Meeting Attendance</Label>
                <Textarea id="attendance" value={meetingData.attendance} onChange={e => handleInputChange("attendance", e.target.value)} placeholder="List attendees..." className="min-h-[100px]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agenda">Meeting Agenda</Label>
              <Textarea id="agenda" value={meetingData.agenda} onChange={e => handleInputChange("agenda", e.target.value)} placeholder="Enter meeting agenda and discussion points..." className="min-h-[200px]" />
            </div>

            <div className="flex gap-4 pt-6">
              <Button onClick={handleSave} className="flex-1">
                Save Meeting
              </Button>
              <Button onClick={handleClear} variant="outline" className="flex-1">
                Clear Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};