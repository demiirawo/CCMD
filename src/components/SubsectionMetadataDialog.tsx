import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface SubsectionMetadata {
  accountableOwner?: string;
  link?: string;
  linkText?: string;
  updated?: string;
}

interface SubsectionMetadataDialogProps {
  children: React.ReactNode;
  title: string;
  metadata?: SubsectionMetadata;
  attendees: string[];
  onSave: (metadata: SubsectionMetadata) => void;
}

export const SubsectionMetadataDialog = ({
  children,
  title,
  metadata = {},
  attendees,
  onSave
}: SubsectionMetadataDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [accountableOwner, setAccountableOwner] = useState(metadata.accountableOwner || "");
  const [link, setLink] = useState(metadata.link || "");
  const [linkText, setLinkText] = useState(metadata.linkText || "");

  const handleSave = () => {
    const newMetadata: SubsectionMetadata = {
      accountableOwner: accountableOwner || undefined,
      link: link || undefined,
      linkText: linkText || undefined,
      updated: new Date().toLocaleDateString()
    };
    onSave(newMetadata);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {title} Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountable-owner">Accountable Owner</Label>
            <Select value={accountableOwner} onValueChange={setAccountableOwner}>
              <SelectTrigger>
                <SelectValue placeholder="Select from meeting attendees..." />
              </SelectTrigger>
              <SelectContent>
                {attendees.map(attendee => (
                  <SelectItem key={attendee} value={attendee}>
                    {attendee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="link">Link</Label>
            <Input
              id="link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Enter link URL..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="link-text">Link Text (optional)</Label>
            <Input
              id="link-text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Enter display text for link..."
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};