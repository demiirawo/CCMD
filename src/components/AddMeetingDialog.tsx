import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
interface AddMeetingDialogProps {
  onMeetingAdded: () => void;
}
export const AddMeetingDialog = ({
  onMeetingAdded
}: AddMeetingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    date: undefined as Date | undefined
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const {
    profile
  } = useAuth();
  const {
    toast
  } = useToast();
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };
  const uploadDocument = async (meetingId: string): Promise<string | null> => {
    if (!selectedFile || !profile?.company_id) return null;
    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${meetingId}_${Date.now()}.${fileExt}`;
    const filePath = `${profile.company_id}/${fileName}`;
    const {
      error: uploadError
    } = await supabase.storage.from('meeting-documents').upload(filePath, selectedFile);
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload document');
    }
    const {
      data: {
        publicUrl
      }
    } = supabase.storage.from('meeting-documents').getPublicUrl(filePath);
    return publicUrl;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !profile?.company_id) return;
    setLoading(true);
    try {
      // Create the meeting
      const currentYear = formData.date.getFullYear();
      const currentMonth = formData.date.getMonth();
      const quarter = `Q${Math.floor(currentMonth / 3) + 1}`;
      const meetingData = {
        title: formData.title,
        purpose: null,
        date: formData.date.toISOString(),
        year: currentYear,
        quarter,
        company_id: profile.company_id,
        attendees: [],
        sections: [],
        actions_log: []
      };
      const {
        data: meeting,
        error: meetingError
      } = await supabase.from('meetings').insert(meetingData).select().single();
      if (meetingError) {
        throw meetingError;
      }

      // Upload document if provided
      let documentUrl = null;
      if (selectedFile && meeting) {
        documentUrl = await uploadDocument(meeting.id);

        // Update meeting with document URL
        if (documentUrl) {
          const {
            error: updateError
          } = await supabase.from('meetings').update({
            document_url: documentUrl
          }).eq('id', meeting.id);
          if (updateError) {
            console.error('Error updating meeting with document URL:', updateError);
          }
        }
      }
      toast({
        title: "Meeting added successfully",
        description: selectedFile ? "Meeting created with document attached" : "Meeting created"
      });
      setFormData({
        title: "",
        date: undefined
      });
      setSelectedFile(null);
      setOpen(false);
      onMeetingAdded();
    } catch (error) {
      console.error('Error adding meeting:', error);
      toast({
        title: "Error",
        description: "Failed to add meeting. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mb-6 py-[9px] my-[22px]">
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Custom Meeting</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Meeting Title *</Label>
            <Input id="title" value={formData.title} onChange={e => setFormData({
            ...formData,
            title: e.target.value
          })} placeholder="Enter meeting title" required />
          </div>


          <div>
            <Label>Meeting Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={formData.date} onSelect={date => setFormData({
                ...formData,
                date
              })} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="document">Upload Document (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input id="document" type="file" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.txt,.xlsx,.xls" className="file:mr-2 file:px-2 file:py-1 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground" />
              {selectedFile && <Button type="button" variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                  Remove
                </Button>}
            </div>
            {selectedFile && <p className="text-sm text-muted-foreground mt-1">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>}
            <p className="text-xs text-muted-foreground mt-1">
              Supported formats: PDF, DOC, DOCX, TXT, XLS, XLSX (Max 10MB)
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title || !formData.date}>
              {loading ? "Adding..." : "Add Meeting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};