import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { processUrl } from "@/utils/urlProcessor";

export interface SubsectionMetadata {
  accountableOwner?: string;
  link?: string;
  linkText?: string;
  linkIsIframe?: boolean;
  link2?: string;
  link2Text?: string;
  link2IsIframe?: boolean;
  description?: string;
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
  const [linkIsIframe, setLinkIsIframe] = useState(metadata.linkIsIframe || false);
  const [link2, setLink2] = useState(metadata.link2 || "");
  const [link2Text, setLink2Text] = useState(metadata.link2Text || "");
  const [link2IsIframe, setLink2IsIframe] = useState(metadata.link2IsIframe || false);
  const [description, setDescription] = useState(metadata.description || "");

  const processAndDetectIframe = (input: string): { url: string; isIframe: boolean } => {
    if (!input) return { url: '', isIframe: false };
    
    const processed = processUrl(input);
    const shouldBeIframe = processed.type === 'airtable' || 
                          input.includes('embed') || 
                          input.includes('iframe') ||
                          processed.processed.includes('embed');
    
    return {
      url: processed.processed,
      isIframe: processed.isValid && shouldBeIframe
    };
  };

  const handleSave = () => {
    const link1Result = processAndDetectIframe(link);
    const link2Result = processAndDetectIframe(link2);
    
    const newMetadata: SubsectionMetadata = {
      accountableOwner: accountableOwner || undefined,
      link: link1Result.url || undefined,
      linkText: linkText || undefined,
      linkIsIframe: link1Result.isIframe || undefined,
      link2: link2Result.url || undefined,
      link2Text: link2Text || undefined,
      link2IsIframe: link2Result.isIframe || undefined,
      description: description || undefined,
      updated: new Date().toLocaleDateString('en-GB')
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
              <SelectTrigger className="bg-white">
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
            <Label>Link 1</Label>
            <div className="flex gap-2">
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Enter link URL..."
                className="flex-1 bg-white"
              />
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Link text (optional)"
                className="flex-1 bg-white"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Link 2</Label>
            <div className="flex gap-2">
              <Input
                value={link2}
                onChange={(e) => setLink2(e.target.value)}
                placeholder="Enter link URL..."
                className="flex-1 bg-white"
              />
              <Input
                value={link2Text}
                onChange={(e) => setLink2Text(e.target.value)}
                placeholder="Link text (optional)"
                className="flex-1 bg-white"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Note</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description..."
              rows={3}
              className="bg-white"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};